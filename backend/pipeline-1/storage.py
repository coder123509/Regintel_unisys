import uuid
from datetime import datetime
from models import Document, Context, Clause


def store_document(db, data):

    doc_id = "doc_" + str(uuid.uuid4())[:8]

    
    doc = Document(
        doc_id=doc_id,
        source_id="rbi_auto",
        source_url=data["url"],
        hash=data["hash"],
        full_text=data["text"],
        published_at=datetime.utcnow(),
        ingested_at=datetime.utcnow(),
        status="processed"
    )

    db.add(doc)
    db.commit()   

    
    ctx = Context(
        doc_id=doc_id,
        summary=data["context"]["summary"],
        keywords=",".join(data["context"]["keywords"])
    )
    db.add(ctx)

    
    valid_types = ["obligation", "prohibition", "permission"]

    for i, c in enumerate(data["clauses"]):

        clause_type = c["type"]
        if clause_type not in valid_types:
            clause_type = "obligation"   

        db.add(Clause(
            clause_id=f"{doc_id}:c{i}",
            doc_id=doc_id,
            text=c["text"],
            type=clause_type,
            deadline=c.get("deadline"),
            extraction_confidence=c["confidence"]
        ))

    
    db.commit()