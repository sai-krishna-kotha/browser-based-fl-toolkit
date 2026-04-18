from app.core.redis import redis_client

ROUND_KEY = "fl:round_number"
ACTIVE_CLIENTS = "fl:active_clients"

async def get_current_round():
    round_no = await redis_client.get(ROUND_KEY)
    return int(round_no) if round_no else 0

async def start_new_round():
    current = await get_current_round()
    new_round = current + 1
    await redis_client.set(ROUND_KEY, new_round)
    return new_round

async def register_client(client_id: str):
    await redis_client.sadd(ACTIVE_CLIENTS, client_id)

async def remove_client(client_id: str):
    await redis_client.srem(ACTIVE_CLIENTS, client_id)

async def get_active_clients():
    return await redis_client.smembers(ACTIVE_CLIENTS)

ROUND_SUBMITTERS_KEY = "fl:round:{round_no}:submitters"

def round_submitters_key(round_no: int):
    return f"fl:round:{round_no}:submitters"

async def has_submitted(round_no: int, client_id: str):
    return await redis_client.sismember(
        round_submitters_key(round_no),
        client_id
    )

async def mark_submitted(round_no: int, client_id: str):
    await redis_client.sadd(
        round_submitters_key(round_no),
        client_id
    )

async def get_submission_count(round_no: int):
    return await redis_client.scard(
        round_submitters_key(round_no)
    )

async def clear_round_submissions(round_no: int):
    await redis_client.delete(round_submitters_key(round_no))