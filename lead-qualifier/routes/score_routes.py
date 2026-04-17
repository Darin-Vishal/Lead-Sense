from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from schemas.lead_schema import LeadCreate, LeadResponse
from services.lead_service import create_lead
from gmail_processor import get_nlp_score, get_ml_score, MODEL, TFIDF

router = APIRouter(prefix="/api/score-email", tags=["Scoring"])

@router.post("", response_model=LeadResponse)
def score_email_route(lead_data: LeadCreate):
    """Accept email content, run scoring logic, Return full lead object WITHOUT saving"""
    text = lead_data.email_body.strip()
    if not text:
        raise HTTPException(status_code=400, detail="email_body cannot be empty")

    nlp_raw = get_nlp_score(text)
    nlp_part = 0 if nlp_raw is None else int(round(nlp_raw * 0.5))

    try:
        X = TFIDF.transform([text])
        ml_prob = float(MODEL.predict_proba(X)[0][1])
        ml_part = int(round(ml_prob * 50))
    except Exception as e:
        print(f"ML scoring error: {e}")
        ml_part = 0

    final_score = max(0, min(100, nlp_part + ml_part))

    if final_score >= 80:
        category = "SUPER"
    elif final_score >= 50:
        category = "GOOD"
    else:
        category = "BAD"

    # Return only the score data, do not save to DB. We mock ID.
    import uuid
    import datetime
    
    return {
        "id": str(uuid.uuid4()),
        "email_body": text,
        "sender": lead_data.sender,
        "subject": lead_data.subject,
        "category": category,
        "nlp_score": nlp_part,
        "ml_score": ml_part,
        "final_score": final_score,
        "is_replied": False,
        "stage": "NEW",
        "created_at": datetime.datetime.utcnow().isoformat()
    }
