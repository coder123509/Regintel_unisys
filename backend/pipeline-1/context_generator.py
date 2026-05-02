import json
import re
from collections import Counter

from groq import Groq
from config import GROQ_API_KEY, MODEL_NAME, CONTEXT_PROMPT

_client = Groq(api_key=GROQ_API_KEY)


def _parse_json_response(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    return json.loads(cleaned)


def _heuristic_context(text: str) -> dict:
    """Simple fallback if Gemini fails."""
    sentences = re.split(r"(?<=[.!?]) +", text)
    summary = " ".join(sentences[:3])
    words = re.findall(r"\w+", text.lower())
    stop = {"the", "and", "for", "that", "this", "with", "from", "shall", "have"}
    keywords = [w for w, _ in Counter(words).most_common(30) if len(w) > 4 and w not in stop][:5]
    return {"summary": summary, "keywords": keywords}


def generate_context(text: str) -> dict:
    trimmed = text[:6000]
    prompt = CONTEXT_PROMPT.replace("{text}", trimmed)

    try:
        response = _client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        raw = response.choices[0].message.content
        result = _parse_json_response(raw)

        summary = str(result.get("summary", "")).strip()
        keywords = result.get("keywords", [])
        if not isinstance(keywords, list):
            keywords = []
        keywords = [str(k).strip() for k in keywords if str(k).strip()][:10]

        if not summary:
            raise ValueError("Empty summary")

        return {"summary": summary, "keywords": keywords}

    except Exception as e:
        print(f"  Groq context generation failed ({e}), using heuristic fallback")
        return _heuristic_context(text)