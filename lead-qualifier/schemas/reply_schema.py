from pydantic import BaseModel
from datetime import datetime

class ReplyBase(BaseModel):
    lead_id: int
    reply_text: str

class ReplyCreate(ReplyBase):
    pass

class ReplyResponse(ReplyBase):
    id: int
    sent_at: datetime

    class Config:
        from_attributes = True
