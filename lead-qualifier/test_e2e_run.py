import requests
import time

BASE_URL = "http://localhost:8000/api"

print("Starting E2E Tests for Lead Management Pipeline...")
print("-" * 50)

# TEST 2: Quick Score
print("\n[TEST 2] Executing Quick Score...")
score_payload = {"raw_text": "Hello, I am interested in enterprise licensing. What are your bulk pricing options?"}
resp = requests.post(f"{BASE_URL}/score", json=score_payload)
try:
    score_data = resp.json()
    if resp.status_code == 200 and "final_score" in score_data:
        print("  [SUCCESS] Email successfully scored.")
    else:
        print(f"  [FAIL] Score failed: {score_data}")
except Exception as e:
    print(f"  [FAIL] Score request failed: {e}")

print("\nFetching all leads from DB...")
leads = requests.get(f"{BASE_URL}/leads/all").json()
if not leads:
    print("No leads in DB. Can't run state tests. Please trigger an email sync.")
    exit(1)

test_lead = leads[0]
test_id = test_lead["id"]
test_email = "test@example.com"
print(f"Using Lead ID: {test_id} (Stage: {test_lead.get('stage', 'NEW')})")

# Ensure it's NEW for the reply test
print(f"\n[SETUP] Setting Lead {test_id} to 'NEW'")
requests.patch(f"{BASE_URL}/leads/{test_id}/stage", json={"stage": "NEW"})

# TEST 3: Reply System -> sets to CONTACTED
print("\n[TEST 3] Testing Reply System (NEW -> CONTACTED)...")
reply_payload = {
    "to": test_email,
    "subject": "Testing Email",
    "body": "Hello this is a test.",
    "id": test_id
}
try:
    resp = requests.post(f"{BASE_URL}/send-reply", json=reply_payload)
    if resp.status_code == 200:
        print("  [SUCCESS] Reply dispatched successfully.")
        # Check DB State
        check = requests.get(f"{BASE_URL}/leads/all").json()
        updated_lead = next(l for l in check if l["id"] == test_id)
        if updated_lead["is_replied"] and updated_lead["stage"] == "CONTACTED":
            print(f"  [SUCCESS] State updated perfectly. is_replied=True, stage={updated_lead['stage']}")
        else:
            print(f"  [FAIL] State not updated. State: {updated_lead['stage']}, is_replied={updated_lead['is_replied']}")
    else:
        print(f"  [FAIL] Reply failed: {resp.json()}")
except Exception as e:
    print(f"  [FAIL] Error: {e}")

# TEST 4 & 5: Stage Update API & Stage Protection
print("\n[TEST 5] Updating Stage via API to NEGOTIATING...")
resp = requests.patch(f"{BASE_URL}/leads/{test_id}/stage", json={"stage": "NEGOTIATING"})
if resp.status_code == 200 and resp.json()["stage"] == "NEGOTIATING":
    print("  [SUCCESS] Stage manually updated successfully to NEGOTIATING.")
else:
    print(f"  [FAIL] Stage update failed: {resp.status_code}")

print("\n[TEST 4] Testing Stage Protection (Replying when NEGOTIATING)...")
resp = requests.post(f"{BASE_URL}/send-reply", json=reply_payload)
if resp.status_code == 200:
    check = requests.get(f"{BASE_URL}/leads/all").json()
    updated_lead = next(l for l in check if l["id"] == test_id)
    if updated_lead["stage"] == "NEGOTIATING":
        print(f"  [SUCCESS] Stage protection active! Stage remains: {updated_lead['stage']}")
    else:
        print(f"  [FAIL] Stage protection broke! Overwritten to: {updated_lead['stage']}")

# TEST 10: Error Handling
print("\n[TEST 10] Testing Invalid Email Handling...")
bad_payload = reply_payload.copy()
bad_payload["to"] = "just_a_string"
resp = requests.post(f"{BASE_URL}/send-reply", json=bad_payload)
if resp.status_code >= 400:
    print(f"  [SUCCESS] Invalid email rejected correctly. (Status {resp.status_code})")
else:
    print(f"  [FAIL] Invalid email went through! Code: {resp.status_code}")

print("\n" + "=" * 50)
print("E2E Verification Complete.")
