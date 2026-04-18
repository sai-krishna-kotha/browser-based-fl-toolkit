from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.models.base import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True)
    client_id = Column(String, unique=True)
    token = Column(String)
    created_at = Column(DateTime, server_default=func.now())