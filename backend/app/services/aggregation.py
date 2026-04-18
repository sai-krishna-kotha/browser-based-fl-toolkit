import os
import json
import torch
from app.core.redis import redis_client
from app.registry.model_registry import (
    round_updates_key,
    global_model_key
)


# Utility 

def to_tensor(weights):
    return [torch.tensor(w, dtype=torch.float32) for w in weights]


def to_list(weights):
    return [w.cpu().tolist() for w in weights]


# Store / Fetch 

async def store_update(model_id: str, version: str, round_no: int, update: dict):
    key = round_updates_key(model_id, version, round_no)
    await redis_client.rpush(key, json.dumps(update))


async def get_updates(model_id: str, version: str, round_no: int):
    key = round_updates_key(model_id, version, round_no)
    updates = await redis_client.lrange(key, 0, -1)
    return [json.loads(u) for u in updates]


# Aggregation 

async def aggregate_round(model_id: str, version: str, round_no: int):

    # Fetch Updates 
    updates = await get_updates(model_id, version, round_no)

    if not updates:
        return None, 0.0

    # Defensive Filtering 
    updates = [
        u for u in updates
        if all(k in u for k in ["samples", "weights", "client_id"])
    ]

    if not updates:
        return None, 0.0

    # Convert to tensors 
    tensor_updates = []
    sample_counts = []

    for u in updates:
        tensor_updates.append(to_tensor(u["weights"]))
        sample_counts.append(u["samples"])

    # Shape Validation 
    ref_shapes = [w.shape for w in tensor_updates[0]]

    for tu in tensor_updates:
        if [w.shape for w in tu] != ref_shapes:
            raise ValueError("Model weight shape mismatch detected")

    # Robust Filtering (L2 norm based) 
    norms = []

    for tu in tensor_updates:
        flat = torch.cat([w.flatten() for w in tu])
        norms.append(torch.norm(flat))

    norms = torch.stack(norms)
    median_norm = torch.median(norms)

    filtered_updates = []
    filtered_samples = []
    filtered_original_updates = []

    for i, tu in enumerate(tensor_updates):
        if norms[i] <= 2.0 * median_norm:
            filtered_updates.append(tu)
            filtered_samples.append(sample_counts[i])
            filtered_original_updates.append(updates[i])

    if not filtered_updates:
        return None, 0.0

    # Pure FedAvg 
    total_samples = sum(filtered_samples)

    aggregated = [
        torch.zeros_like(w) for w in filtered_updates[0]
    ]

    for tu, n in zip(filtered_updates, filtered_samples):
        weight = n / total_samples
        for i in range(len(tu)):
            aggregated[i] += tu[i] * weight

    # Accuracy (for dashboard only) 
    avg_accuracy = sum(
        u.get("accuracy", 0) for u in filtered_original_updates
    ) / len(filtered_original_updates)

    final_weights = to_list(aggregated)

    # Store Global Model 
    await redis_client.set(
        global_model_key(model_id, version, round_no),
        json.dumps(final_weights)
    )

    # Store Round History 
    round_meta_key = f"fl:{model_id}:{version}:round_history"

    await redis_client.rpush(
        round_meta_key,
        json.dumps({
            "round": round_no,
            "accuracy": avg_accuracy
        })
    )

    # Store Per-Client Contribution 
    for u in filtered_original_updates:
        client_id = u["client_id"]

        client_history_key = (
            f"fl:{model_id}:{version}:client:{client_id}:history"
        )

        await redis_client.rpush(
            client_history_key,
            json.dumps({
                "round": round_no,
                "accuracy": u.get("accuracy", 0),
                "samples": u["samples"],
                "score": u["samples"]   # now pure FedAvg weight basis
            })
        )

    # Clear Round Updates 
    await redis_client.delete(
        round_updates_key(model_id, version, round_no)
    )

    # Persist Checkpoint 
    os.makedirs("checkpoints", exist_ok=True)

    base_name = f"{model_id}_{version}_round_{round_no}"

    # ✅ 1. Save PyTorch weights (.pt)
    pt_path = f"checkpoints/{base_name}.pt"

    torch.save({
        "model_id": model_id,
        "version": version,
        "round": round_no,
        "accuracy": avg_accuracy,
        "weights": aggregated
    }, pt_path)

    # ✅ 2. Save JSON metadata (for dashboard)
    json_path = f"checkpoints/{base_name}.json"

    with open(json_path, "w") as f:
        json.dump({
            "model_id": model_id,
            "version": version,
            "round": round_no,
            "accuracy": avg_accuracy
        }, f)

        return final_weights, avg_accuracy