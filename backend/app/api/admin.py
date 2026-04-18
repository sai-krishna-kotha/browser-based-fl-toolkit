from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert

from app.db.session import AsyncSessionLocal
from app.models.model import Model

router = APIRouter()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/create-model")
async def create_model(name: str, db: AsyncSession = Depends(get_db)):
    new_model = Model(name=name)
    db.add(new_model)
    await db.commit()
    await db.refresh(new_model)

    return {
        "id": new_model.id,
        "name": new_model.name
    }