import os
import json
from typing import Dict, List
from app.core.redis import redis_client

CHECKPOINT_DIR = "checkpoints"


async def get_round_history(model_id: str, version: str) -> List[Dict]:
    history = []

    if not os.path.exists(CHECKPOINT_DIR):
        return history

    for filename in os.listdir(CHECKPOINT_DIR):

        # Only read JSON files
        if not filename.endswith(".json"):
            continue

        # Match model + version
        print(f"This is model id and version :{model_id}, {version}")
        if not filename.startswith(f"{model_id}_{version}_"):
            continue

        path = os.path.join(CHECKPOINT_DIR, filename)

        try:
            with open(path, "r") as f:
                data = json.load(f)
                print(f"data is {data}")
                history.append({
                    "round": data.get("round"),
                    "accuracy": data.get("accuracy", 0.0)
                })

        except Exception:
            # Skip corrupted/malformed files
            continue

    # Sort by round number
    history.sort(key=lambda x: x["round"] if x["round"] is not None else -1)

    return history


async def get_clients(model_id: str, version: str) -> List[Dict]:

    pattern = f"fl:{model_id}:{version}:client:*:history"
    keys = await redis_client.keys(pattern)

    clients = []

    for key in keys:
        try:
            # Extract client_id
            parts = key.split(":")
            client_id = parts[4]
            print(f"This is client id: {client_id}")
            history_raw = await redis_client.lrange(key, 0, -1)
            history = [json.loads(h) for h in history_raw]

            clients.append({
                "clientId": client_id,
                "history": history
            })

        except Exception:
            continue

    return clients

async def get_dashboard_data(model_id: str, version: str):

    round_history = await get_round_history(model_id, version)
    clients = await get_clients(model_id, version)

    return {
        "roundHistory": round_history,
        "clients": clients
    }
