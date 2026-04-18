from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.model import Model

router = APIRouter()


# Dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.get("/")
async def list_models(db: AsyncSession = Depends(get_db)):

    result = await db.execute(select(Model))
    models = result.scalars().all()

    return [
        {
            "id": m.id,
            "name": m.name,
            "created_at": m.created_at
        }
        for m in models
    ]