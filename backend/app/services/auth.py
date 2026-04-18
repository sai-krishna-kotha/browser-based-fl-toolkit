import uuid
import secrets
from app.core.redis import redis_client


def client_token_key(client_id: str):
    return f"fl:client:{client_id}:token"


async def register_client():
    client_id = str(uuid.uuid4())
    token = secrets.token_hex(32)

    await redis_client.set(client_token_key(client_id), token)

    return client_id, token


async def validate_client(client_id: str, token: str):
    stored_token = await redis_client.get(client_token_key(client_id))

    if not stored_token:
        return False

    return stored_token == token