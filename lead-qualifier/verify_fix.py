import requests
import pandas as pd
import os

def verify():
    print("Verifying API...")
    try:
        r = requests.get("http://localhost:8000/api/leads")
        if r.status_code == 200:
            leads = r.json()
            if leads:
                print("First lead keys:", leads[0].keys())
                print("First lead sample:", leads[0])
            else:
                print("No leads returned.")
        else:
            print("API Error:", r.status_code)
    except Exception as e:
        print("API Request failed:", e)

    print("\nVerifying Excel...")
    if os.path.exists("bad_leads.xlsx"):
        df = pd.read_excel("bad_leads.xlsx")
        print("Excel columns:", df.columns.tolist())
        if not df.empty:
            print("Last row:", df.iloc[-1].to_dict())
    else:
        print("bad_leads.xlsx not found")

if __name__ == "__main__":
    verify()
