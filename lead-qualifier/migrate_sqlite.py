import sqlite3
import os

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(PROJECT_ROOT, "lead_qualifier.db")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns_to_add = [
    ("sender", "TEXT"),
    ("subject", "TEXT"),
    ("thread_id", "TEXT")
]

for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE leads ADD COLUMN {col_name} {col_type}")
        print(f"Added column {col_name}.")
    except sqlite3.OperationalError as e:
        print(f"Column {col_name} usually already exists: {e}")

conn.commit()
conn.close()
print("Migration completed.")
