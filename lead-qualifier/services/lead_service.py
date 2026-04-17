from sqlalchemy.orm import Session
from models.lead import Lead
from schemas.lead_schema import LeadCreate
from typing import Optional

def create_lead(db: Session, lead_data: LeadCreate, nlp_raw: Optional[int], nlp_proc: int, ml: int, final: int, category: str):
    db_lead = Lead(
        email_subject=lead_data.email_subject,
        email_body=lead_data.email_body,
        sender_email=lead_data.sender_email,
        sender_name=lead_data.sender_name,
        nlp_raw_score=nlp_raw,
        nlp_processed_score=nlp_proc,
        ml_score=ml,
        final_score=final,
        category=category,
        status="new"
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

def get_recent_leads(db: Session, limit: int = 100):
    return db.query(Lead).order_by(Lead.created_at.desc()).limit(limit).all()

def get_super_leads(db: Session, limit: int = 100):
    return db.query(Lead).filter(Lead.category == "SUPER").order_by(Lead.created_at.desc()).limit(limit).all()

def update_lead_status(db: Session, lead_id: int, status: str):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead:
        lead.status = status
        db.commit()
        db.refresh(lead)
    return lead
