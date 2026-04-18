from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio

from app.core.config import ROUND_TIMEOUT_SECONDS
from app.services.connection_manager import manager
from app.registry.model_registry import (
    get_current_round,
    set_current_round,
    round_submitters_key,
    set_round_start_time,
)
from app.services.aggregation import store_update, aggregate_round
from app.services.auth import register_client, validate_client
from app.core.redis import redis_client
from app.db.session import engine
from app.models.base import Base
from app.services.dashboard_service import get_dashboard_data

from app.api.models import router as models_router
from app.api.admin import router as admin_router

app = FastAPI(title="Federated Learning Platform")

# Allow React Frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(models_router, prefix="/models")
app.include_router(admin_router, prefix="/admin")

VERSION = "v1"
AGGREGATION_THRESHOLD = 2

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # --- FIX: Initialize outside loop to prevent UnboundLocalError ---
    client_id = None
    model_id = None
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            # 1. Registration
            if msg_type == "register":
                new_id, token = await register_client()
                await websocket.send_json({
                    "type": "registered",
                    "client_id": new_id,
                    "token": token
                })
                continue

            # 2. Dashboard Data Request
            if msg_type == "get_dashboard":
                model_id = str(message.get("model_id", "1"))
                dashboard_data = await get_dashboard_data(model_id, VERSION)
                await websocket.send_json({
                    "type": "dashboard_data",
                    "model_id": model_id,
                    **dashboard_data
                })
                continue

            # 3. Join Model (Handshake)
            if msg_type == "join":
                client_id = message.get("client_id")
                token = message.get("token")
                model_id = str(message.get("model_id"))

                if not model_id or model_id == "None":
                    await websocket.send_json({"type": "error", "message": "Model ID required"})
                    continue

                if not await validate_client(client_id, token):
                    await websocket.send_json({"type": "error", "message": "Invalid authentication"})
                    continue

                await manager.connect(model_id, client_id, websocket)

                current_round = await get_current_round(model_id, VERSION)
                if current_round == 0:
                    current_round = 1
                    await set_current_round(model_id, VERSION, current_round)
                    await set_round_start_time(model_id, VERSION)

                await manager.send_to_client(model_id, client_id, {
                    "type": "round_started",
                    "round": current_round
                })
                continue
            
            # 4. Model Update Submission
            if msg_type == "model_update":
                client_id = message.get("client_id")
                token = message.get("token")

                if not await validate_client(client_id, token):
                    await websocket.send_json({"type": "error", "message": "Unauthorized"})
                    continue

                current_round = await get_current_round(model_id, VERSION)
                submitters_key = round_submitters_key(model_id, VERSION, current_round)

                # Check for duplicate submission
                if await redis_client.sismember(submitters_key, client_id):
                    await websocket.send_json({
                        "type": "error", 
                        "message": "Already submitted this round"
                    })
                    continue

                # Save update to Redis
                await store_update(model_id, VERSION, current_round, message)
                await redis_client.sadd(submitters_key, client_id)

                submission_count = await redis_client.scard(submitters_key)

                # Trigger Aggregation if threshold reached
                if submission_count >= AGGREGATION_THRESHOLD:
                    weights, global_acc = await aggregate_round(model_id, VERSION, current_round)

                    await redis_client.delete(submitters_key)

                    new_round = current_round + 1
                    await set_current_round(model_id, VERSION, new_round)
                    await set_round_start_time(model_id, VERSION)

                    # Notify all clients: 1. Send Weights, 2. Start Next Round
                    await manager.broadcast(model_id, {
                        "type": "global_model",
                        "round": current_round,
                        "globalAccuracy": global_acc,
                        "weights": weights
                    })

                    await manager.broadcast(model_id, {
                        "type": "round_started",
                        "round": new_round
                    })

                    # Auto-push update to any connected dashboards
                    dashboard_data = await get_dashboard_data(model_id, VERSION)
                    await manager.broadcast(model_id, {
                        "type": "dashboard_data",
                        "model_id": model_id,
                        **dashboard_data
                    })
                continue

    except WebSocketDisconnect:
        if model_id and client_id:
            manager.disconnect(model_id, client_id)
    except Exception as e:
        print(f"WebSocket Error: {e}")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)