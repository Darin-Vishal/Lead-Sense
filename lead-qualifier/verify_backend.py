import time
import requests
import threading
import sys
import uvicorn
from api.main import app
from gmail_processor import gmail_auth

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8123, log_level="warning")

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
time.sleep(3)

try:
    service = gmail_auth()
    profile = service.users().getProfile(userId='me').execute()
    me = profile.get("emailAddress")

    payload = {
        "to": me,
        "subject": "Test Reply",
        "body": "This is a test email",
        "thread_id": None
    }
    
    resp = requests.post("http://127.0.0.1:8123/api/send-reply", json=payload)
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.json()}")
    if resp.status_code == 200:
        print("Backend Validation SUCCESS")
    else:
        sys.exit(1)
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
