import os
import json
import torch
from typing import List, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.redis import redis_client
from app.db.session import AsyncSessionLocal
from app.models.round import Round as SQLRound
from app.models.submission import Submission as SQLSubmission
from app.models.version import ModelVersion as SQLModelVersion
from app.models.client import Client as SQLClient

from app.registry.model_registry import (
    round_updates_key,
    global_model_key
)

# --- UTILITY HELPERS ---

def to_tensor(weights: List) -> List[torch.Tensor]:
    """Converts raw list weights from JSON to PyTorch tensors."""
    return [torch.tensor(w, dtype=torch.float32) for w in weights]

def to_list(weights: List[torch.Tensor]) -> List:
    """Converts PyTorch tensors back to lists for JSON serialization."""
    return [w.cpu().tolist() for w in weights]

# --- DATABASE PERSISTENCE HELPERS ---

async def persist_to_sql(model_id: str, version: str, round_no: int, accuracy: float, checkpoint_path: str, updates: List[Dict]):
    """
    Handles the long-term storage of round results and individual client
    submissions into the PostgreSQL database.
    """
    async with AsyncSessionLocal() as session:
        try:
            # 1. Resolve the ModelVersion ID
            version_stmt = select(SQLModelVersion).where(SQLModelVersion.version_str == version)
            version_result = await session.execute(version_stmt)
            model_version = version_result.scalars().first()
            
            if not model_version:
                print(f"Warning: ModelVersion {version} not found in DB. Skipping SQL persistence.")
                return

            # 2. Create the SQL Round entry
            new_round = SQLRound(
                model_version_id=model_version.id,
                round_number=round_no,
                global_accuracy=accuracy,
                checkpoint_path=checkpoint_path
            )
            session.add(new_round)
            await session.flush() # Get the new round.id

            # 3. Save individual submissions for this round
            for u in updates:
                # Find client internal ID
                client_stmt = select(SQLClient).where(SQLClient.client_id == u["client_id"])
                client_result = await session.execute(client_stmt)
                db_client = client_result.scalars().first()

                if db_client:
                    new_submission = SQLSubmission(
                        round_id=new_round.id,
                        client_id=db_client.id,
                        accuracy=u.get("accuracy", 0.0),
                        samples=u.get("samples", 0),
                        score=u.get("samples") # Federated weight based on sample count
                    )
                    session.add(new_submission)

            await session.commit()
            print(f"Successfully persisted Round {round_no} to SQL.")
        except Exception as e:
            await session.rollback()
            print(f"Database Persistence Error: {e}")

# --- CORE AGGREGATION LOGIC ---

async def store_update(model_id: str, version: str, round_no: int, update: dict):
    """Pushes a client model update to the Redis list."""
    key = round_updates_key(model_id, version, round_no)
    await redis_client.rpush(key, json.dumps(update))

async def get_updates(model_id: str, version: str, round_no: int) -> List[Dict]:
    """Retrieves all client updates for a specific round from Redis."""
    key = round_updates_key(model_id, version, round_no)
    updates = await redis_client.lrange(key, 0, -1)
    return [json.loads(u) for u in updates]

async def aggregate_round(model_id: str, version: str, round_no: int) -> Tuple[List, float]:
    """
    Performs Federated Averaging (FedAvg), filters outliers via L2 norm,
    and persists data to Redis, Disk, and PostgreSQL.
    """
    # 1. Fetch and Validate Updates
    updates = await get_updates(model_id, version, round_no)
    if not updates:
        return None, 0.0

    valid_updates = [
        u for u in updates
        if all(k in u for k in ["samples", "weights", "client_id"])
    ]
    if not valid_updates:
        return None, 0.0

    # 2. Convert to tensors
    tensor_updates = [to_tensor(u["weights"]) for u in valid_updates]
    sample_counts = [u["samples"] for u in valid_updates]

    # 3. Shape Validation
    ref_shapes = [w.shape for w in tensor_updates[0]]
    for tu in tensor_updates:
        if [w.shape for w in tu] != ref_shapes:
            raise ValueError("Model weight shape mismatch detected")

    # 4. Robust Filtering (Median L2-norm based)
    norms = []
    for tu in tensor_updates:
        flat = torch.cat([w.flatten() for w in tu])
        norms.append(torch.norm(flat))

    norms = torch.stack(norms)
    median_norm = torch.median(norms)

    filtered_updates = []
    filtered_samples = []
    filtered_original_updates = []

    # Discard updates that deviate too far from the median (potential poisoning)
    for i, tu in enumerate(tensor_updates):
        if norms[i] <= 2.0 * median_norm:
            filtered_updates.append(tu)
            filtered_samples.append(sample_counts[i])
            filtered_original_updates.append(valid_updates[i])

    if not filtered_updates:
        return None, 0.0

    # 5. Pure FedAvg Algorithm
    total_samples = sum(filtered_samples)
    aggregated = [torch.zeros_like(w) for w in filtered_updates[0]]

    for tu, n in zip(filtered_updates, filtered_samples):
        contribution_weight = n / total_samples
        for i in range(len(tu)):
            aggregated[i] += tu[i] * contribution_weight

    # 6. Metadata Calculations
    avg_accuracy = sum(u.get("accuracy", 0) for u in filtered_original_updates) / len(filtered_original_updates)
    final_weights = to_list(aggregated)

    # 7. REDIS PERSISTENCE (Real-time)
    # Store Global Model Weights
    await redis_client.set(global_model_key(model_id, version, round_no), json.dumps(final_weights))

    # Store Global History
    round_meta_key = f"fl:{model_id}:{version}:round_history"
    await redis_client.rpush(round_meta_key, json.dumps({
        "round": round_no,
        "accuracy": avg_accuracy
    }))

    # Store Per-Client Contribution History in Redis
    for u in filtered_original_updates:
        c_id = u["client_id"]
        client_history_key = f"fl:{model_id}:{version}:client:{c_id}:history"
        await redis_client.rpush(client_history_key, json.dumps({
            "round": round_no,
            "accuracy": u.get("accuracy", 0),
            "samples": u["samples"],
            "score": u["samples"]
        }))

    # 8. DISK PERSISTENCE (Checkpoints)
    os.makedirs("checkpoints", exist_ok=True)
    base_name = f"{model_id}_{version}_round_{round_no}"
    pt_path = f"checkpoints/{base_name}.pt"
    json_path = f"checkpoints/{base_name}.json"

    # Save Torch Weights
    torch.save({
        "model_id": model_id, "version": version, "round": round_no,
        "accuracy": avg_accuracy, "weights": aggregated
    }, pt_path)

    # Save JSON Meta (Legacy Dashboard support)
    with open(json_path, "w") as f:
        json.dump({"model_id": model_id, "version": version, "round": round_no, "accuracy": avg_accuracy}, f)

    # 9. SQL PERSISTENCE (Audit Trail)
    await persist_to_sql(model_id, version, round_no, avg_accuracy, pt_path, filtered_original_updates)

    # 10. Cleanup Transient Data
    await redis_client.delete(round_updates_key(model_id, version, round_no))

    return final_weights, avg_accuracy