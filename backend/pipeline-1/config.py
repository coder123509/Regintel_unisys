import os
from dotenv import load_dotenv

load_dotenv()

# ======================
# GROQ
# ======================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("Missing GROQ_API_KEY in environment")

MODEL_NAME = "llama-3.3-70b-versatile"

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
You are a regulatory compliance expert.

Your task is NOT just to extract sentences, but to produce HIGH-QUALITY, SELF-CONTAINED regulatory clauses.

STRICT RULES:
1. Each clause MUST be fully understandable on its own.
2. If a sentence contains references like:
   - "these Directions"
   - "this table"
   - "as specified above"
   - "hereinafter"
   you MUST rewrite the clause to include the missing context using surrounding text.
3. DO NOT return clauses that depend on external references.
4. DO NOT include legal boilerplate such as:
   - "The Reserve Bank being satisfied..."
   - introductory or explanatory text
5. Each clause MUST clearly express:
   - subject (who)
   - action (what must/must not/may be done)
   - condition (if applicable)
6. You may merge or rewrite sentences to improve clarity and completeness.
7. Prefer slightly longer, clearer clauses over short incomplete ones.

OUTPUT FORMAT:
Return ONLY a valid JSON array. No explanation, no markdown.

Each clause must be:
{{
  "text": "self-contained regulatory clause",
  "type": "obligation | prohibition | permission",
  "deadline": "YYYY-MM-DD or null",
  "confidence": float (0.0 to 1.0)
}}

TYPE DEFINITIONS:
- obligation → must be done (shall, must, required)
- prohibition → must NOT be done
- permission → optional / allowed

Limit to 20 high-quality clauses only.

TEXT:
{text}

Return ONLY the JSON array:
"""

CONTEXT_PROMPT = """
You are a regulatory document analyst.

Generate a HIGH-QUALITY structured context for the document.

STRICT RULES:
1. Summary must clearly describe:
   - what the regulation is about
   - who it applies to
   - what it enforces
2. Avoid vague phrases like "this document discusses..."
3. Keywords must be meaningful regulatory concepts (not generic words).

OUTPUT FORMAT:
Return ONLY valid JSON. No explanation.

{
  "summary": "clear 2-3 line regulatory summary",
  "keywords": ["term1", "term2", "term3", "term4", "term5"]
}

TEXT:
{text}

Return ONLY the JSON object:
"""