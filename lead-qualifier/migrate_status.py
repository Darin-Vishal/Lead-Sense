import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lead_qualifier.db")

def migrate():
    print(f"Connecting to {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE leads ADD COLUMN is_replied BOOLEAN DEFAULT 0;")
        conn.commit()
        print("Migration successful: added is_replied missing column")
    except sqlite3.OperationalError as e:
        print(f"Error: {e}. Maybe the column already exists?")
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
