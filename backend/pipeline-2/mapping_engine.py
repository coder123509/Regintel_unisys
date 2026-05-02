"""
mapping_engine.py
─────────────────
LLM reasoning layer: takes hybrid retrieval context and returns
a structured mapping result using Gemini 2.5 Flash.
"""

import os
import json
import logging
from typing import Dict, Any
from google import genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("MappingEngine")
_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

BATCH_PROMPT_TEMPLATE = """
ROLE: Senior Banking Compliance Officer.

TASK:
Map each RBI clause to the best internal policy.

CLAUSES:
{clauses_json}

RULES:
- Return ONLY valid JSON array
- Order must match input
- No explanation

FORMAT:
[
  {{
    "clause_id": "...",
    "mapped_policy": "...",
    "department": "...",
    "gap_detected": true,
    "mapping_confidence": 0.0,
    "reasoning": "..."
  }}
]
"""

def analyze_batch_with_llm(contexts: list[dict]) -> list[dict] | None:
    try:
        clauses_input = [
            {
                "clause_id": c["clause_id"],
                "clause_text": c["clause_text"],
                "candidates": c["candidates"]
            }
            for c in contexts
        ]

        prompt = BATCH_PROMPT_TEMPLATE.format(
            clauses_json=json.dumps(clauses_input)
        )

        response = _client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        )

        data = json.loads(response.text)

        if not isinstance(data, list) or len(data) != len(contexts):
            return None

        return data

    except Exception as e:
        logger.error(f"Batch LLM failed: {e}")
        return None