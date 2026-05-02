import json
import re
from groq import Groq
from config import GROQ_API_KEY, MODEL_NAME, CLAUSE_PROMPT
from legal_bert_model import get_embeddings

_client = Groq(api_key=GROQ_API_KEY)

VALID_TYPES = {"obligation", "prohibition", "permission"}


def _parse_json_response(raw: str) -> list:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    return json.loads(cleaned)


def _validate_clause(clause: dict, index: int) -> dict | None:
    text = str(clause.get("text", "")).strip()
    if len(text) < 20:
        return None

    clause_type = str(clause.get("type", "obligation")).lower()
    if clause_type not in VALID_TYPES:
        clause_type = "obligation"

    try:
        confidence = float(clause.get("confidence", 0.85))
        confidence = max(0.0, min(1.0, confidence))
    except (TypeError, ValueError):
        confidence = 0.85

    deadline = clause.get("deadline")
    if deadline is not None:
        deadline = str(deadline).strip() or None

    return {
        "text": text,
        "type": clause_type,
        "deadline": deadline,
        "confidence": confidence,
    }


def extract_clauses(text: str) -> list[dict]:
    trimmed = text[:8000]
    prompt = CLAUSE_PROMPT.format(text=trimmed)

    try:
        response = _client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        raw = response.choices[0].message.content
    except Exception as e:
        print(f"  Groq clause extraction failed: {e}")
        return []

    try:
        raw_clauses = _parse_json_response(raw)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"  Failed to parse Groq clause response: {e}")
        print(f"  Raw response snippet: {raw[:300]}")
        return []

    if not isinstance(raw_clauses, list):
        print("  Groq returned non-list for clauses")
        return []

    clauses = []
    for i, raw_clause in enumerate(raw_clauses[:20]):
        validated = _validate_clause(raw_clause, i)
        if validated is None:
            continue
        try:
            validated["embedding"] = get_embeddings(validated["text"])
        except Exception as e:
            print(f"  Embedding failed for clause {i}: {e}")
            validated["embedding"] = []
        clauses.append(validated)

    print(f"  Extracted {len(clauses)} valid clauses via Groq")
    return clauses