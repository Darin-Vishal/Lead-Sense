import os
import base64
import json
import joblib
from bs4 import BeautifulSoup

def clean_email_body(content):
    if not content:
        return ""
    try:
        soup = BeautifulSoup(content, "html.parser")
        return soup.get_text(separator=" ", strip=True)
    except:
        return content
try:
    from google import genai
except Exception as _e:
    genai = None
# import pandas as pd # Removed pandas
from api.db import SessionLocal
from api.models import Lead
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from email import policy
from email.parser import BytesParser
from scipy import sparse
import time
from datetime import datetime

load_dotenv()

# --------------------------
# Config
# --------------------------
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    # Fallback if .env wasn't loaded automatically
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("OPENAI_API_KEY="):
                    OPENAI_KEY = line.split("=", 1)[1].strip()
                    break

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    # try .env fallback for GEMINI key too
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    GEMINI_API_KEY = line.split("=", 1)[1].strip()
                    break

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
TOKEN_PATH = os.path.join(PROJECT_ROOT, "token.json")
MODEL_PATH = os.path.join(PROJECT_ROOT, "model.joblib")
TFIDF_PATH = os.path.join(PROJECT_ROOT, "tfidf.joblib")
SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL", "")

SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send"
]

# Optional: enable using cached NLP
USE_CACHED_NLP = os.getenv("USE_CACHED_NLP", "0").lower() in ("1", "true", "yes")
CACHED_NLP_PATH = os.path.join(PROJECT_ROOT, "data", "llm_nlp.jsonl")
_cached_nlp_map = None

if USE_CACHED_NLP and os.path.exists(CACHED_NLP_PATH):
    _cached_nlp_map = {}
    try:
        with open(CACHED_NLP_PATH, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    d = json.loads(line.strip())
                    if "raw_text" in d:
                        _cached_nlp_map[d["raw_text"]] = int(d.get("nlp_score", 0))
                except:
                    pass
    except Exception as e:
        print("Warning loading cached LLM:", e)
        _cached_nlp_map = None

# Initialize Gemini client (lazy initialization in get_nlp_score)
genai_client = None

# Load ML artifacts
MODEL = joblib.load(MODEL_PATH)
TFIDF = joblib.load(TFIDF_PATH)

PROMPT = """You are a B2B sales evaluator. Read the email below and output a single integer 0-100 (only a number).

Email:

\"\"\"{text}\"\"\""""

# --------------------------
# Gemini-based NLP scoring
# --------------------------
def get_nlp_score(text, max_retries=2, backoff=2):
    """Use Google Gemini (google-genai) to get a score 0-100.

    Returns int 0-100, or None if Gemini is unavailable or quota exceeded.

    Requires GEMINI_API_KEY in environment/.env.
    """
    # quick cached path if enabled
    try:
        if USE_CACHED_NLP and _cached_nlp_map and text in _cached_nlp_map:
            return int(_cached_nlp_map[text])
    except Exception:
        pass

    # initialize genai client lazily
    global genai_client
    if genai_client is None:
        try:
            if genai is None:
                print('google-genai library not installed or import failed.')
                return None
            
            # Ensure we have the key
            if not GEMINI_API_KEY:
                print('GEMINI_API_KEY not found in environment/.env')
                return None
                
            genai_client = genai.Client(api_key=GEMINI_API_KEY)
        except Exception as e:
            print('Gemini init error:', e)
            return None

    # call Gemini with retries
    for attempt in range(max_retries + 1):
        try:
            # Use gemini-2.5-flash as default (cost-effective model)
            model_name = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
            resp = genai_client.models.generate_content(
                model=model_name,
                contents=[PROMPT.format(text=text)]
            )
            
            # response parsing - genai SDK returns GenerateContentResponse
            out_text = None
            # Try resp.text first (most common)
            if hasattr(resp, 'text'):
                out_text = resp.text
            # Try candidates if text doesn't work
            elif hasattr(resp, 'candidates') and resp.candidates:
                candidate = resp.candidates[0]
                if hasattr(candidate, 'content'):
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        out_text = candidate.content.parts[0].text if hasattr(candidate.content.parts[0], 'text') else str(candidate.content.parts[0])
                    elif hasattr(candidate.content, 'text'):
                        out_text = candidate.content.text
            
            # Fallback to string representation
            if not out_text:
                out_text = str(resp)
                
            # Extract digits from response
            digits = ''.join(ch for ch in out_text if ch.isdigit())
            return int(digits) if digits else 0
            
        except Exception as e:
            err = str(e)
            print(f'Gemini call failed (attempt {attempt+1}):', err)
            # stop on quota/rate-limit
            if '429' in err or 'quota' in err.lower() or 'RateLimit' in err:
                print('Gemini quota/rate-limit detected. Disabling Gemini for this run.')
                return None
            if attempt < max_retries:
                time.sleep(backoff * (2 ** attempt))
                continue
            return None

# --------------------------
# ML score
# --------------------------
def get_ml_score(text):
    X = TFIDF.transform([text])
    p = MODEL.predict_proba(X)[0][1]
    return int(round(p * 50))  # map to 0–50

# --------------------------
# Gmail AUTH
# --------------------------
def gmail_auth():
    if not os.path.exists(TOKEN_PATH):
        raise Exception("token.json missing — run oauth_gmail.py first.")

    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    return build("gmail", "v1", credentials=creds)

# --------------------------
# Safe Email Extraction logic
# --------------------------
import email.utils

def extract_email(value):
    if not value:
        return None
    value = str(value).strip()
    
    # Handle nested JSON formats
    if value.startswith("{"):
        try:
            parsed = json.loads(value)
            raw_email = None
            if "email" in parsed:
                raw_email = parsed["email"]
            elif "from" in parsed and isinstance(parsed["from"], dict) and "email" in parsed["from"]:
                raw_email = parsed["from"]["email"]
                
            if raw_email:
                value = str(raw_email).strip()
        except:
            pass
            
    # Priority-based extraction without blanket regex
    name, parsed_email = email.utils.parseaddr(value)
    if parsed_email and '@' in parsed_email:
        return parsed_email
        
    return value if value else None

def get_sender_email(headers):
    headers_dict = {}
    for h in headers:
        headers_dict[h["name"].lower()] = h["value"]
        
    for header_name in ["reply-to", "from", "sender"]:
        if header_name in headers_dict:
            extracted = extract_email(headers_dict[header_name])
            if extracted and '@' in extracted:
                return extracted
            
    return None

# --------------------------
# Extract raw text from Gmail message
# --------------------------
def extract_text(payload):
    if "parts" in payload:
        for part in payload["parts"]:
            if part.get("mimeType") == "text/plain":
                data = part.get("body", {}).get("data")
                if data:
                    return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")

            # nested parts
            if "parts" in part:
                for sub in part["parts"]:
                    if sub.get("mimeType") == "text/plain":
                        data = sub.get("body", {}).get("data")
                        if data:
                            return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")

    # fallback
    data = payload.get("body", {}).get("data", "")
    if data:
        return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")

    return ""

# --------------------------
# Slack notify
# --------------------------
def send_to_slack(msg):
    if not SLACK_WEBHOOK:
        print("Slack webhook not set — skipping")
        return
    import requests
    try:
        r = requests.post(SLACK_WEBHOOK, json={"text": msg}, timeout=10)
        if r.status_code >= 400:
            print("Slack webhook error:", r.status_code, r.text)
    except Exception as e:
        print("Slack error:", e)

# --------------------------
# Database Saver
# --------------------------
def save_lead_to_db(lead_data):
    db = SessionLocal()
    try:
        # Create or update lead
        lead = Lead(
            id=lead_data["email_id"],
            created_at=lead_data["created_at"],
            raw_text=lead_data["raw_text"],
            nlp_raw=lead_data["nlp_raw"] if lead_data["nlp_raw"] != "" else None,
            nlp_part=lead_data["nlp_part"],
            ml_part=lead_data["ml_part"],
            final_score=lead_data["final_score"],
            category=lead_data["category"],
            sender=lead_data.get("sender"),
            subject=lead_data.get("subject"),
            thread_id=lead_data.get("thread_id"),
            rfc_message_id=lead_data.get("rfc_message_id")
        )
        db.merge(lead)
        db.commit()
    except Exception as e:
        print(f"Error saving to DB: {e}")
    finally:
        db.close()

# --------------------------
# Main processor
# --------------------------
def process_emails():
    print("Authenticating Gmail...")
    service = gmail_auth()

    try:
        results = service.users().messages().list(
            userId="me", q="is:unread"
        ).execute()
    except HttpError as e:
        print("Gmail fetch error:", e)
        return

    messages = results.get("messages", [])
    if not messages:
        print("No unread emails.")
        return

    print(f"Found {len(messages)} unread emails.")

    print(f"Found {len(messages)} unread emails.")
    saved_leads = []

    for msg in messages:
        msg_id = msg["id"]

        try:
            full = service.users().messages().get(
                userId="me", id=msg_id, format="full"
            ).execute()
            
            payload = full.get("payload", {})
            headers = payload.get("headers", [])
            
            sender = get_sender_email(headers)
            
            subject = next((h["value"] for h in headers if h["name"].lower() == "subject"), "")
            thread_id = full.get("threadId", "")
            
            # RFC Message-ID extraction
            rfc_msg_id = next((h["value"] for h in headers if h["name"].lower() == "message-id"), None)
            if rfc_msg_id and not rfc_msg_id.startswith("<"):
                rfc_msg_id = f"<{rfc_msg_id}>"

            email_body = extract_text(payload) or ""
            raw_text = clean_email_body(email_body)
        except Exception as e:
            print("Failed to retrieve message:", e)
            continue

        print("\n--- EMAIL ---")
        print(raw_text[:200], "...")

        # NLP score (0–100 → 0–50)
        nlp_raw = get_nlp_score(raw_text)
        nlp_part = 0 if nlp_raw is None else int(round(nlp_raw * 0.5))

        # ML score (0–50)
        try:
            ml_part = get_ml_score(raw_text)
            # ml_prob is needed for logging/debugging
            X = TFIDF.transform([raw_text])
            ml_prob = MODEL.predict_proba(X)[0][1]
        except:
            ml_part = 0
            ml_prob = 0.0

        final_score = int(max(0, min(100, nlp_part + ml_part)))
        
        # Mismatch check
        if final_score > 80 and (nlp_raw is None or nlp_raw == 0):
            print(f"WARNING: Potential mismatch: super lead without NLP score -> {msg_id}")
            # If NLP failed (None), we shouldn't rely solely on ML for super status unless ML is extremely high?
            # Requirement: "If nlp_raw is None due to quota, the final should still be ml_part only — do not claim it as super if ML part < 80."
            # Since ml_part max is 50, final_score will be max 50 if nlp_raw is None.
            # So final_score > 80 implies nlp_part contributed, OR ml_part is somehow > 50 (impossible by design).
            # Wait, if nlp_raw is 0, nlp_part is 0. If ml_part is 50, final is 50.
            # So final_score > 80 IS impossible without NLP > 60.
            # However, if nlp_raw is None, nlp_part is 0.
            pass

        # Category
        if final_score > 80:
            category = "super"
            send_to_slack(f"🔥 SUPER LEAD ({final_score})\n{raw_text[:300]}")
        elif final_score >= 40:
            category = "good"
        else:
            category = "bad"
            
        print(f"Processed msg: {msg_id} nlp_raw={nlp_raw} ml_prob={ml_prob:.2f} ml_part={ml_part} nlp_part={nlp_part} final_score={final_score} category={category}")

        # Build row
        row = {
            "email_id": msg_id,
            "created_at": datetime.utcnow().isoformat(),
            "raw_text": raw_text,
            "nlp_raw": nlp_raw if nlp_raw is not None else "",
            "nlp_part": nlp_part,
            "ml_part": ml_part,
            "final_score": final_score,
            "category": category,
            "sender": sender,
            "subject": subject,
            "thread_id": thread_id,
            "rfc_message_id": rfc_msg_id,
        }

        # Save to DB
        save_lead_to_db(row)
        saved_leads.append(row)
        print(f"Saved lead {msg_id} to DB.")

        # MARK EMAIL AS READ (prevent re-processing)
        try:
            service.users().messages().modify(
                userId="me",
                id=msg_id,
                body={"removeLabelIds": ["UNREAD"]}
            ).execute()
        except Exception as e:
            print("Warning: unable to mark as read:", e)

    print("\nLead processing complete.")
    return saved_leads


if __name__ == "__main__":
    process_emails()
