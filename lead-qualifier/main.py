from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import lead_routes, reply_routes, score_routes
from config.database import Base, engine
from pydantic import BaseModel
from typing import Optional

# Initialize DB tables initially if Alembic isn't fully set up yet
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Elite Lead Qualifier API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lead_routes.router)
app.include_router(reply_routes.router)
# Remove broken score_routes router to prevent conflict
# app.include_router(score_routes.router)

from gmail_processor import process_emails as run_process_emails, get_nlp_score, MODEL, TFIDF
import uuid
import datetime
from api.models import Lead
from api.db import SessionLocal

class ScoreRequest(BaseModel):
    email_body: str

@app.post("/api/process-emails")
async def process_emails_endpoint():
    try:
        from api.db import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        before_ids = {row[0] for row in db.execute(text("SELECT id FROM leads")).fetchall()}
        db.close()
        
        run_process_emails()
        
        db = SessionLocal()
        all_leads = db.query(Lead).all()
        db.close()
        
        new_leads = [lead for lead in all_leads if lead.id not in before_ids]
        
        result = []
        for l in new_leads:
            result.append({
                "id": l.id,
                "email_body": l.raw_text,
                "raw_text": l.raw_text,
                "nlp_score": l.nlp_part,
                "ml_score": l.ml_part,
                "nlp_part": l.nlp_part,
                "ml_part": l.ml_part,
                "nlp_raw": l.nlp_raw,
                "final_score": l.final_score,
                "category": l.category,
                "created_at": l.created_at
            })
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/score-email")
async def score_email_endpoint(req: ScoreRequest):
    """Score a single email and add to the primary leads database."""
    try:
        text = req.email_body.strip()
        from fastapi import HTTPException
        if not text:
            raise HTTPException(status_code=400, detail="email_body cannot be empty")
            
        nlp_raw = get_nlp_score(text)
        nlp_part = 0 if nlp_raw is None else int(round(nlp_raw * 0.5))

        try:
            X = TFIDF.transform([text])
            ml_prob = float(MODEL.predict_proba(X)[0][1])
            ml_part = int(round(ml_prob * 50))
        except Exception:
            ml_part = 0

        final_score = max(0, min(100, nlp_part + ml_part))

        if final_score > 80:
            category = "super"
        elif final_score >= 40:
            category = "good"
        else:
            category = "bad"

        lead_id = str(uuid.uuid4())
        created_at = datetime.datetime.utcnow().isoformat()
        
        return {
            "id": lead_id,
            "email_body": text,
            "raw_text": text,
            "nlp_score": nlp_part,
            "ml_score": ml_part,
            "nlp_part": nlp_part,
            "ml_part": ml_part,
            "nlp_raw": nlp_raw,
            "final_score": final_score,
            "category": category,
            "created_at": created_at
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"message": "Elite Lead Qualifier API is running smoothly!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
