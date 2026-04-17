from sqlalchemy.orm import Session
from models.reply import Reply
from schemas.reply_schema import ReplyCreate

def create_reply(db: Session, reply_data: ReplyCreate):
    db_reply = Reply(
        lead_id=reply_data.lead_id,
        reply_text=reply_data.reply_text
    )
    db.add(db_reply)
    db.commit()
    db.refresh(db_reply)
    return db_reply
