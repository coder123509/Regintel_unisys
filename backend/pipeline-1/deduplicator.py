from database import SessionLocal
from models import Document


def is_duplicate_url(url):
    db = SessionLocal()
    try:
        existing = db.query(Document).filter(
            Document.source_url == url
        ).first()
        return existing is not None
    finally:
        db.close()


def is_duplicate_hash(hash_val):
    db = SessionLocal()
    try:
        existing = db.query(Document).filter(
            Document.hash == hash_val
        ).first()
        return existing is not None
    finally:
        db.close()