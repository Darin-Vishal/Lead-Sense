import os
import sys
import base64
from email.message import EmailMessage

sys.path.insert(0, os.path.abspath('lead-qualifier'))
from gmail_processor import gmail_auth

service = gmail_auth()

profile = service.users().getProfile(userId='me').execute()
me = profile.get("emailAddress")

print(f"Authenticated as {me}")

message = EmailMessage()
message.set_content("This is a direct test.")
message["To"] = me
message["From"] = me
message["Subject"] = "Test Email From Python"

encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

try:
    service.users().messages().send(userId="me", body={"raw": encoded_message}).execute()
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
