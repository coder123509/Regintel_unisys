import os
from dotenv import load_dotenv

load_dotenv()

# ======================
# DATABASE
# ======================
# DB_HOST = os.getenv("DB_HOST")
# DB_PORT = os.getenv("DB_PORT")
# DB_NAME = os.getenv("DB_NAME")
# DB_USER = os.getenv("DB_USER")
# DB_PASSWORD = os.getenv("DB_PASSWORD")

# ======================
# GEMINI
# ======================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-1.5-flash"

# ======================
# PIPELINE SETTINGS
# ======================
PDF_DOWNLOAD_PATH = "data/pdfs"
MAX_PDFS_PER_RUN = 5

SOURCE_ID = "rbi_auto"

# ======================
# PROMPTS (EDIT HERE ONLY)
# ======================

CLAUSE_PROMPT = """
Extract regulatory clauses.

Return ONLY valid JSON:

[
  {
    "text": "...",
    "type": "obligation/prohibition/permission",
    "deadline": null,
    "confidence": 0.9
  }
]

TEXT:
"""

CONTEXT_PROMPT = """
Generate JSON:

{
  "summary": "2-3 line summary",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

TEXT:
"""