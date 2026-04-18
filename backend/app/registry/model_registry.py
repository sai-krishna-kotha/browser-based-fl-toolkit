from app.core.redis import redis_client
from app.core.redis import redis_client
import time

async def set_round_start_time(model_id, version):
    await redis_client.set(
        round_start_time_key(model_id, version),
        int(time.time())
    )

async def get_round_start_time(model_id, version):
    val = await redis_client.get(
        round_start_time_key(model_id, version)
    )
    return int(val) if val else None

# round keys
def current_round_key(model_id: str, version: str):
    return f"fl:{model_id}:{version}:current_round"


def round_updates_key(model_id: str, version: str, round_no: int):
    return f"fl:round:{model_id}:{version}:{round_no}:updates"


def global_model_key(model_id: str, version: str, round_no: int):
    return f"fl:round:{model_id}:{version}:{round_no}:global"


# round management

async def get_current_round(model_id: str, version: str):
    value = await redis_client.get(current_round_key(model_id, version))
    return int(value) if value else 0


async def set_current_round(model_id: str, version: str, round_no: int):
    await redis_client.set(name=current_round_key(model_id, version), value=round_no)
    
def round_updates_key(model_id, version, round_no):
    return f"fl:round:{model_id}:{version}:{round_no}:updates"

def round_submitters_key(model_id, version, round_no):
    return f"fl:round:{model_id}:{version}:{round_no}:submitters"

def round_start_time_key(model_id, version):
    return f"fl:{model_id}:{version}:round_start_time"
