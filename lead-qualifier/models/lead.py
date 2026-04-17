from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    email_subject = Column(Text, nullable=True)
    email_body = Column(Text, nullable=False)
    sender_email = Column(String, nullable=True)
    sender_name = Column(String, nullable=True)
    nlp_raw_score = Column(Integer, nullable=True)
    nlp_processed_score = Column(Integer, nullable=True)
    ml_score = Column(Integer, nullable=True)
    final_score = Column(Integer, nullable=True)
    category = Column(String, index=True) # BAD, GOOD, SUPER
    status = Column(String, default="new")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    replies = relationship("Reply", back_populates="lead", cascade="all, delete-orphan")
