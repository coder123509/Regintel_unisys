import re
from legal_bert_model import get_embeddings

def classify_clause(text):
    text_lower = text.lower()

    if "shall" in text_lower or "must" in text_lower:
        return "obligation"
    elif "shall not" in text_lower or "prohibited" in text_lower:
        return "prohibition"
    elif "may" in text_lower:
        return "permission"
    else:
        return "obligation"


def extract_clauses(text):

    # Split into sentences
    sentences = re.split(r'(?<=[.!?]) +', text)

    clauses = []

    for sent in sentences:

        if len(sent.strip()) < 30:
            continue

        clause_type = classify_clause(sent)

        embedding = get_embeddings(sent)

        clauses.append({
            "text": sent.strip(),
            "type": clause_type,
            "deadline": None,
            "confidence": 0.85   # static for now
        })

    return clauses[:20]  # limit