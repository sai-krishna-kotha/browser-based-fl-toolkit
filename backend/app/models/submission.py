from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True)
    round_id = Column(Integer, ForeignKey("rounds.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))

    accuracy = Column(Float)
    samples = Column(Integer)
    score = Column(Float)

    created_at = Column(DateTime, server_default=func.now())

    # relationships
    round = relationship("Round", back_populates="submissions")