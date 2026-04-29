from sqlalchemy import Column, String, Text, Float, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"

    doc_id = Column(String, primary_key=True)
    source_id = Column(String)
    source_url = Column(String)
    hash = Column(String, unique=True)
    full_text = Column(Text)
    published_at = Column(TIMESTAMP)
    ingested_at = Column(TIMESTAMP)
    status = Column(String)


class Context(Base):
    __tablename__ = "context"

    doc_id = Column(String, primary_key=True)
    summary = Column(Text)
    keywords = Column(Text)


class Clause(Base):
    __tablename__ = "clauses"

    clause_id = Column(String, primary_key=True)
    doc_id = Column(String)
    text = Column(Text)
    type = Column(String)
    deadline = Column(String)
    extraction_confidence = Column(Float)