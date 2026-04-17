from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LeadBase(BaseModel):
    email_subject: Optional[str] = None
    email_body: str
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    nlp_raw_score: Optional[int]
    nlp_processed_score: Optional[int]
    ml_score: Optional[int]
    final_score: Optional[int]
    category: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
