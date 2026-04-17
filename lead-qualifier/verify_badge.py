import threading
import time
import requests
import sqlite3
import sys
import os
import uvicorn
from api.main import app
from gmail_processor import gmail_auth

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="warning")

threading.Thread(target=run_server, daemon=True).start()
time.sleep(2)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lead_qualifier.db")

try:
    # 1. Manually add a test lead
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    test_id = "test_lead_verify_badge99"
    cursor.execute("DELETE FROM leads WHERE id=?", (test_id,))
    cursor.execute("INSERT INTO leads (id, created_at, category, final_score, is_replied, sender, subject) VALUES (?, '2024-01-01', 'GOOD', 85, 0, 'dummy@test.com', 'subject test')", (test_id,))
    conn.commit()
    conn.close()

    service = gmail_auth()
    profile = service.users().getProfile(userId='me').execute()
    me = profile.get("emailAddress")

    # 2. Trigger send-reply POST API to update it
    payload = {
        "to": me,
        "subject": "Badge Reply Test",
        "body": "Checking if our badge maps in sqlite correctly",
        "thread_id": None,
        "email_id": test_id
    }
    
    resp = requests.post("http://127.0.0.1:8001/api/send-reply", json=payload)
    if resp.status_code != 200:
        print("Backend sent a non-200 code!", resp.text)
        sys.exit(1)
        
    # 3. Verify SQLite DB flipped
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT is_replied FROM leads WHERE id=?", (test_id,))
    row = cursor.fetchone()
    if row and row[0] == 1:
        print("SUCCESS! Lead successfully updated to is_replied=1 after sending email.")
    else:
        print("FAIL! Lead did not flip is_replied to 1.")
        sys.exit(1)
    
except Exception as e:
    print(f"Test Failed explicitly: {e}")
    sys.exit(1)
