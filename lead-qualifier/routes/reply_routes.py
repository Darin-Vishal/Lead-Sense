from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from schemas.reply_schema import ReplyCreate, ReplyResponse
from services.reply_service import create_reply

router = APIRouter(prefix="/api/reply", tags=["Replies"])

@router.post("", response_model=ReplyResponse)
def post_reply(reply: ReplyCreate, db: Session = Depends(get_db)):
    """Store reply linked to lead"""
    return create_reply(db, reply)
