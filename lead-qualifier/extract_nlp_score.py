import os
import json
import time
import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

INPUT_CSV = "data/leads.csv"
OUT_JSONL = "data/llm_nlp.jsonl"

PROMPT = """You are a B2B sales evaluator. Read the email below and output a single integer 0-100 (no text).

100 = perfect, ready-to-buy, decision-maker present.

0 = no intent, no fit.

Email:

\"\"\"{text}\"\"\""""

def call_llm(text):
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": PROMPT.format(text=text)}],
        temperature=0
    )
    return resp.choices[0].message.content.strip()

def normalize_number(s):
    try:
        digits = ''.join(ch for ch in s if ch.isdigit())
        return min(100, max(0, int(digits))) if digits else 0
    except:
        return 0

def main():
    os.makedirs("data", exist_ok=True)

    df = pd.read_csv(INPUT_CSV)
    df = df.fillna("")

    processed = {}
    if os.path.exists(OUT_JSONL):
        with open(OUT_JSONL, "r") as f:
            for line in f:
                d = json.loads(line)
                processed[int(d["lead_id"])] = d

    with open(OUT_JSONL, "a") as out:
        for _, row in df.iterrows():
            lead_id = int(row["lead_id"])
            if lead_id in processed:
                continue

            text = row["raw_text"]

            try:
                raw = call_llm(text)
                score = normalize_number(raw)
            except Exception as e:
                print("Error:", e)
                score = 0

            record = {"lead_id": lead_id, "nlp_score": score}
            out.write(json.dumps(record) + "\n")
            out.flush()

            print(f"Processed lead {lead_id} → NLP Score: {score}")
            time.sleep(0.2)

if __name__ == "__main__":
    main()

