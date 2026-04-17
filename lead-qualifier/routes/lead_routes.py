from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from config.database import get_db
from schemas.lead_schema import LeadResponse
from services.lead_service import get_recent_leads, get_super_leads

router = APIRouter(prefix="/api/leads", tags=["Leads"])

@router.get("", response_model=List[LeadResponse])
def get_leads(db: Session = Depends(get_db)):
    """Return latest leads sorted by created_at DESC"""
    return get_recent_leads(db)

@router.get("/super", response_model=List[LeadResponse])
def get_super_leads_route(db: Session = Depends(get_db)):
    """Return leads where category = 'SUPER'"""
    return get_super_leads(db)
