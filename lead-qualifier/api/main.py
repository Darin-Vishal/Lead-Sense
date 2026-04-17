"""
FastAPI backend for Lead Qualifier
Provides endpoints for scoring emails and retrieving leads
"""
import os
import sys
import json
import joblib
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
# import pandas as pd # Removed pandas
try:
    from google import genai
except Exception as _e:
    genai = None

from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from gmail_processor import process_emails, PROJECT_ROOT, get_nlp_score, get_ml_score, MODEL, TFIDF, gmail_auth
import base64
from email.message import EmailMessage
from sqlalchemy.orm import Session
from fastapi import Depends
from .db import SessionLocal, engine, get_db
from .models import Base, Lead
from routes.score_routes import router as score_router

# Create tables
Base.metadata.create_all(bind=engine)

load_dotenv()

# Removed local get_nlp_score and get_ml_score to use imported ones from gmail_processor

app = FastAPI(title="Lead Qualifier API")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(score_router)

# Request/Response models
class ScoreRequest(BaseModel):
    raw_text: str

class ReplyRequest(BaseModel):
    to: str
    subject: str
    body: str
    thread_id: Optional[str] = None
    id: Optional[str] = None

class StageUpdateRequest(BaseModel):
    stage: str

class ScoreResponse(BaseModel):
    nlp_raw: Optional[int]
    nlp_part: int
    ml_prob: float
    ml_part: int
    final_score: int
    category: str

# Removed load_leads_from_excel

@app.get("/")
def root():
    return {"message": "Lead Qualifier API is running"}

@app.post("/api/score", response_model=ScoreResponse)
async def score_email(request: ScoreRequest):
    """Score a single email text"""
    try:
        text = request.raw_text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="raw_text cannot be empty")
        
        # Get NLP score (0-100)
        nlp_raw = get_nlp_score(text)
        nlp_part = 0 if nlp_raw is None else int(round(nlp_raw * 0.5))
        
        # Get ML score (0-50)
        try:
            X = TFIDF.transform([text])
            ml_prob = float(MODEL.predict_proba(X)[0][1])
            ml_part = int(round(ml_prob * 50))
        except Exception as e:
            print(f"ML scoring error: {e}")
            ml_prob = 0.0
            ml_part = 0
        
        # Calculate final score
        final_score = max(0, min(100, nlp_part + ml_part))
        
        # Determine category
        if final_score > 80:
            category = "super"
        elif final_score >= 40:
            category = "good"
        else:
            category = "bad"
        
        return ScoreResponse(
            nlp_raw=nlp_raw,
            nlp_part=nlp_part,
            ml_prob=ml_prob,
            ml_part=ml_part,
            final_score=final_score,
            category=category
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")

@app.get("/api/leads")
async def get_leads(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Get leads from DB, optionally filtered by category"""
    try:
        query = db.query(Lead)
        if category:
            query = query.filter(Lead.category == category)
        
        # Order by created_at desc (or final_score desc if preferred, user said created_at desc)
        leads = query.order_by(Lead.created_at.desc()).all()
        return leads
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading leads: {str(e)}")

@app.get("/api/leads/all")
async def get_all_leads(db: Session = Depends(get_db)):
    """Get all leads"""
    return await get_leads(db=db)

import re

def extract_email(raw):
    if not raw:
        return None

    match = re.search(r'<(.+?)>', raw)
    if match:
        return match.group(1).strip()

    raw = raw.strip()
    if "@" in raw:
        return raw

    return None

@app.get("/api/reply-url/{id}")
async def get_reply_url(id: str):
    """Get Gmail reply URL"""
    return {"url": f"https://mail.google.com/mail/#inbox/{id}"}

@app.post("/api/send-reply")
async def send_reply(request: ReplyRequest, db: Session = Depends(get_db)):
    """Send an email reply via Gmail API"""
    try:
        clean_to = extract_email(request.to)
        if not clean_to:
            raise HTTPException(status_code=400, detail="Invalid recipient email")
            
        print("Sending email to:", clean_to)

        service = gmail_auth()
        message = EmailMessage()
        message.set_content(request.body)
        message["To"] = clean_to
        # If thread_id is provided, try to prefix Re: if missing, but typically Gmail handles it based on threadId
        message["Subject"] = request.subject

        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        body = {
            "raw": encoded_message,
        }
        if request.thread_id:
            body["threadId"] = request.thread_id
            
        service.users().messages().send(userId="me", body=body).execute()
        
        if request.id:
            lead = db.query(Lead).filter(Lead.id == request.id).first()
            if lead:
                lead.is_replied = True
                if lead.stage == "NEW":
                    lead.stage = "CONTACTED"
                db.commit()
        
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/leads/{id}/stage")
async def update_lead_stage(id: str, request: StageUpdateRequest, db: Session = Depends(get_db)):
    """Update a specific lead's pipeline stage."""
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    valid_stages = ["NEW", "CONTACTED", "NEGOTIATING", "CLOSED"]
    if request.stage not in valid_stages:
        raise HTTPException(status_code=400, detail="Invalid stage provided")
        
    lead.stage = request.stage
    db.commit()
    db.refresh(lead)
    return {"message": "Stage updated securely", "stage": lead.stage, "id": lead.id}

# Removed download endpoints as we are using DB now

@app.post("/api/process-emails")
async def process_emails_trigger():
    """
    Start email processing synchronously and return the results.
    The frontend will call this endpoint to trigger sync and receive the new leads.
    """
    new_leads = process_emails()
    if new_leads is None:
        return []
    return new_leads

@app.get("/api/process-status")
async def get_process_status(db: Session = Depends(get_db)):
    """
    Check status of processing (returns counts from DB)
    """
    status = {
        "last_run": None, # Not easily tracked without a separate table, leaving null for now
        "good_leads_count": 0,
        "bad_leads_count": 0
    }
    
    try:
        status["good_leads_count"] = db.query(Lead).filter(Lead.category.in_(["good", "super"])).count()
        status["bad_leads_count"] = db.query(Lead).filter(Lead.category == "bad").count()
    except Exception as e:
        print(f"Error checking status: {e}")
        
    return status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

