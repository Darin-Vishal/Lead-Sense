import sqlite3
import os
import requests
import threading
import time
import sys
import uvicorn
from api.main import app
from gmail_processor import gmail_auth

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8002, log_level="warning")

threading.Thread(target=run_server, daemon=True).start()
time.sleep(2)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lead_qualifier.db")
test_id = "test_lead_pipeline_v1"

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM leads WHERE id=?", (test_id,))
    cursor.execute("INSERT INTO leads (id, created_at, category, final_score, is_replied, stage, sender, subject) VALUES (?, '2024-01-01', 'GOOD', 85, 0, 'NEW', 'sender@test.com', 'Subject tests')", (test_id,))
    conn.commit()
    conn.close()

    # 1. Test PATCH
    print("Testing Stage Mutation endpoints...")
    resp = requests.patch(f"http://127.0.0.1:8002/api/leads/{test_id}/stage", json={"stage": "NEGOTIATING"})
    if resp.status_code != 200:
        print("PATCH API failed!", resp.text)
        sys.exit(1)
        
    print("SUCCESS: Stage updated to NEGOTIATING via PATCH.")
    
    # 2. Test Reply Automation Hook
    print("Testing Email Reply automation hook...")
    cursor = sqlite3.connect(DB_PATH).cursor()
    cursor.execute("UPDATE leads SET stage = 'NEW' WHERE id=?", (test_id,))
    cursor.connection.commit()
    cursor.connection.close()
    
    service = gmail_auth()
    profile = service.users().getProfile(userId='me').execute()
    me = profile.get("emailAddress")

    payload = {
        "to": me,
        "subject": "Testing Stage Shifting Pipeline",
        "body": "Checking if replying maps stage to CONTACTED",
        "email_id": test_id
    }
    
    resp2 = requests.post("http://127.0.0.1:8002/api/send-reply", json=payload)
    if resp2.status_code != 200:
        print("Email reply endpoint failed!", resp2.text)
        sys.exit(1)

    cursor = sqlite3.connect(DB_PATH).cursor()
    cursor.execute("SELECT stage FROM leads WHERE id=?", (test_id,))
    stage = cursor.fetchone()[0]
    
    if stage == "CONTACTED":
        print("SUCCESS! Pipeline successfully cascaded email triggers to CONTACTED.")
    else:
        print("FAIL! Pipeline stage failed to migrate.")
        sys.exit(1)
        
except Exception as e:
    print("Test failed:", str(e))
    sys.exit(1)
