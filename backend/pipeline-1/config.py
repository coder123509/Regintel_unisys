import os
from dotenv import load_dotenv

load_dotenv()

# ======================
# GROQ
# ======================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "llama-3.3-70b-versatile"  # best free model on Groq

# ======================
# DATABASE MICROSERVICE
# ======================
DB_SERVICE_URL = os.getenv("DB_SERVICE_URL", "http://localhost:5000")

# ======================
# PIPELINE SETTINGS
# ======================
PDF_DOWNLOAD_PATH = "data/pdfs"
MAX_PDFS_PER_RUN = 5
SCHEDULER_INTERVAL = 600  # seconds

# ======================
# PROMPTS
# ======================

CLAUSE_PROMPT = """
You are a regulatory compliance expert. Extract all meaningful regulatory clauses from the text below.

Return ONLY a valid JSON array. No explanation, no markdown, no extra text.

Each clause must have:
- "text": the clause sentence (string)
- "type": one of "obligation", "prohibition", "permission"
  - obligation: contains "shall", "must", "required", "is to"
  - prohibition: contains "shall not", "must not", "prohibited", "not permitted"
  - permission: contains "may", "is permitted", "is allowed"
- "deadline": date string if mentioned (e.g. "2026-01-01"), else null
- "confidence": float between 0.0 and 1.0 reflecting extraction certainty

Limit to 20 most important clauses.

TEXT:
{text}

Return ONLY the JSON array:
"""

CONTEXT_PROMPT = """
You are a regulatory document analyst. Analyze the text below.

Return ONLY a valid JSON object. No explanation, no markdown, no extra text.

{{
  "summary": "2-3 line summary of what this regulatory document is about",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}}

TEXT:
{text}

Return ONLY the JSON object:
"""