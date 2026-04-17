import logging
from config.database import SessionLocal
from models.lead import Lead

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clear_null_senders():
    db = SessionLocal()
    try:
        # Find leads where sender_email is NULL or empty space
        # recipient of the reply is the sender_email
        leads_to_delete = db.query(Lead).filter(
            (Lead.sender_email == None) | (Lead.sender_email == '') | (Lead.sender_email == ' ')
        ).all()
        
        count = len(leads_to_delete)
        logger.info(f"Found {count} leads without a valid sender_email (recipient for replies).")
        
        for lead in leads_to_delete:
            db.delete(lead)
            
        db.commit()
        logger.info(f"Successfully deleted {count} leads.")
        
    except Exception as e:
        logger.error(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_null_senders()
