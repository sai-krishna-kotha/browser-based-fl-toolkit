import json
from typing import Dict, List
from app.core.redis import redis_client

async def get_round_history(model_id: str, version: str) -> List[Dict]:
    """
    Fetches the full training history for a model version from Redis.
    This is much faster than scanning the checkpoints directory.
    """
    history = []
    round_meta_key = f"fl:{model_id}:{version}:round_history"
    
    # Get all entries from the Redis list
    history_raw = await redis_client.lrange(round_meta_key, 0, -1)
    
    if not history_raw:
        return history

    for item in history_raw:
        try:
            data = json.loads(item)
            history.append({
                "round": data.get("round"),
                "accuracy": data.get("accuracy", 0.0)
            })
        except Exception:
            continue

    # Sort by round number to ensure the graph draws correctly
    history.sort(key=lambda x: x["round"] if x["round"] is not None else -1)
    return history


async def get_clients(model_id: str, version: str) -> List[Dict]:
    """
    Fetches the contribution history of every client for this model.
    """
    # Pattern to find all client history keys for this specific model/version
    pattern = f"fl:{model_id}:{version}:client:*:history"
    keys = await redis_client.keys(pattern)

    clients = []

    for key in keys:
        try:
            # Extract client_id from key: fl:model:version:client:ID:history
            parts = key.split(":")
            if len(parts) < 5:
                continue
            client_id = parts[4]

            history_raw = await redis_client.lrange(key, 0, -1)
            history = [json.loads(h) for h in history_raw]

            clients.append({
                "clientId": client_id,
                "history": history
            })
        except Exception:
            continue

    return clients


async def get_dashboard_data(model_id: str, version: str) -> Dict:
    """
    Aggregates history and client data for the React Dashboard.
    """
    round_history = await get_round_history(model_id, version)
    clients = await get_clients(model_id, version)

    return {
        "roundHistory": round_history,
        "clients": clients
    }