# oauth_gmail.py
"""
Run this once to perform Gmail OAuth and save token.json.
Requires credentials.json (OAuth client secret) in project root.
"""
import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
import json

SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send"
]
CREDS_FILE = "credentials.json"
TOKEN_FILE = "token.json"

def run_oauth():
    if not os.path.exists(CREDS_FILE):
        print(f"ERROR: {CREDS_FILE} not found. Download from Google Cloud Console and place it in project root.")
        return
    flow = InstalledAppFlow.from_client_secrets_file(CREDS_FILE, SCOPES)
    creds = flow.run_local_server(port=0)
    with open(TOKEN_FILE, "w") as f:
        f.write(creds.to_json())
    print(f"Saved {TOKEN_FILE}. You are now authenticated for Gmail API.")

if __name__ == "__main__":
    run_oauth()

