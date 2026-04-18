from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, model_id, client_id, websocket):
        # await websocket.accept()

        if model_id not in self.active_connections:
            self.active_connections[model_id] = {}

        self.active_connections[model_id][client_id] = websocket

    def disconnect(self, model_id, client_id):
        if model_id in self.active_connections:
            self.active_connections[model_id].pop(client_id, None)

            if not self.active_connections[model_id]:
                del self.active_connections[model_id]

    async def send_to_client(self, model_id, client_id, message):
        if model_id in self.active_connections:
            websocket = self.active_connections[model_id].get(client_id)
            if websocket:
                await websocket.send_json(message)

    async def broadcast(self, model_id, message):
        if model_id not in self.active_connections:
            return

        for ws in self.active_connections[model_id].values():
            await ws.send_json(message)


manager = ConnectionManager()