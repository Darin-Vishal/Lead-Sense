import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    try:
        r = requests.get(f"{BASE_URL}/docs")
        if r.status_code == 200:
            print("Backend is up!")
            return True
    except:
        return False
    return False

def test_score():
    print("\nTesting /api/score...")
    payload = {"raw_text": "I am interested in buying 500 units of your enterprise software. Please send a quote."}
    try:
        r = requests.post(f"{BASE_URL}/api/score", json=payload)
        if r.status_code == 200:
            data = r.json()
            print("Score Response:", data)
            if "final_score" in data and "nlp_part" in data and "ml_part" in data:
                print("✅ /api/score works and returns full details.")
                return True
            else:
                print("❌ /api/score missing keys.")
        else:
            print(f"❌ /api/score failed: {r.status_code} {r.text}")
    except Exception as e:
        print(f"❌ /api/score error: {e}")
    return False

def test_leads():
    print("\nTesting /api/leads...")
    try:
        r = requests.get(f"{BASE_URL}/api/leads")
        if r.status_code == 200:
            leads = r.json()
            print(f"✅ /api/leads returned {len(leads)} leads.")
            if len(leads) > 0:
                print("Sample lead:", leads[0])
            return True
        else:
            print(f"❌ /api/leads failed: {r.status_code}")
    except Exception as e:
        print(f"❌ /api/leads error: {e}")
    return False

if __name__ == "__main__":
    print("Waiting for backend to start...")
    for i in range(30):
        if test_health():
            break
        time.sleep(2)
    else:
        print("Backend failed to start in time.")
        sys.exit(1)

    if test_score() and test_leads():
        print("\n✅ Verification Passed!")
    else:
        print("\n❌ Verification Failed.")
        sys.exit(1)
