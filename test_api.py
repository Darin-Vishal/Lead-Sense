import requests
import json
import traceback

print("--- Testing /api/score ---")
try:
    r = requests.post('http://localhost:8000/api/score', json={'raw_text': 'I want to buy your software plan.'})
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n--- Testing /api/process-emails ---")
try:
    r2 = requests.post('http://localhost:8000/api/process-emails')
    print(f"Status: {r2.status_code}")
    print(f"Response (first 500 chars): {r2.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
