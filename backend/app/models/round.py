from sqlalchemy import Column, Integer, ForeignKey, Float, String, DateTime
from sqlalchemy.sql import func
from app.models.base import Base

class Round(Base):
    __tablename__ = "rounds"

    id = Column(Integer, primary_key=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"))
    round_number = Column(Integer, nullable=False)
    global_accuracy = Column(Float)
    checkpoint_path = Column(String)
    created_at = Column(DateTime, server_default=func.now())