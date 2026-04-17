import sys
import os
sys.path.insert(0, os.path.abspath('lead-qualifier'))
from fastapi.testclient import TestClient
from api.main import app

try:
    print("Sending test email to test@example.com")

    client = TestClient(app)
    response = client.post(
        "/api/send-reply",
        json={
            "to": "test@example.com",
            "subject": "Test Reply from Lead Qualifier",
            "body": "This is a test reply from the verify script. Testing the new /api/send-reply endpoint."
        }
    )
    print("Response Status:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except:
        print("Response Content:", response.text)
except Exception as e:
    print(f"Verification failed with Exception: {e}")
