import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lead_qualifier.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        # Standardize missing fields dynamically if older version tables present them missing
        cursor.execute("ALTER TABLE leads ADD COLUMN stage VARCHAR DEFAULT 'NEW'")
        
        # Hydrate all existing legacy tables seamlessly defaulting strictly to new logic.
        cursor.execute("UPDATE leads SET stage = 'NEW' WHERE stage IS NULL")
        conn.commit()
        print("Migration successful: added 'stage' column with backward compatibility.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'stage' already exists. Skipping DDL execution.")
        else:
            print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
