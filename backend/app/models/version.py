# app/models/version.py
from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("models.id"))
    version_str = Column(String, nullable=False) # e.g., "v1"
    
    created_at = Column(DateTime, server_default=func.now())

    # relationships
    model = relationship("Model", back_populates="versions")
    rounds = relationship("Round", back_populates="model_version")