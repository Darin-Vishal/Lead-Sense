from sqlalchemy import Column, Integer, String, Text, Boolean
from .db import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, index=True)  # This will be the email_id
    created_at = Column(String)
    raw_text = Column(Text)
    nlp_raw = Column(Integer, nullable=True)
    nlp_part = Column(Integer)
    ml_part = Column(Integer)
    final_score = Column(Integer)
    category = Column(String)
    sender = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    thread_id = Column(String, nullable=True)
    rfc_message_id = Column(String, nullable=True)
    is_replied = Column(Boolean, default=False)
    stage = Column(String, default="NEW")

