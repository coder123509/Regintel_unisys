# Pipeline 1 — Automated Regulatory Document Ingestion

## Overview

Pipeline 1 is the entry point of the RegIntel system. It continuously monitors the RBI website for newly published regulatory PDFs, extracts structured clauses and context using LLMs, and stores everything in the central PostgreSQL database via the DB microservice.

Once a document is fully stored, it emits the `doc_id` to downstream pipelines (Pipeline 2 — RAG + Mapping).

---

## What This Pipeline Does

1. Fetches PDF links from the RBI notifications page
2. Downloads valid PDFs
3. Extracts and cleans text
4. Deduplicates using SHA-256 hash (checked against DB microservice)
5. Extracts structured clauses using **Groq (Llama 3.3 70B)**
6. Generates Legal-BERT embeddings per clause for downstream vector retrieval
7. Generates document summary and keywords using **Groq**
8. Stores document, context, and clauses via the **DB microservice** (3 API calls)
9. Marks document status as `processed`
10. Emits `doc_id` for Pipeline 2

---

## Project Structure

```
pipeline-1/
│
├── run_pipeline.py          # Main orchestrator
├── scheduler.py             # Runs pipeline on a timer
├── fetcher.py               # Scrapes RBI PDF links
├── downloader.py            # Downloads and validates PDFs
├── cleaner.py               # Cleans raw extracted text
├── clause_llm.py            # Clause extraction via Groq + BERT embeddings
├── context_generator.py     # Summary + keywords via Groq
├── storage.py               # Writes to DB microservice (3 endpoints)
├── db_client.py             # HTTP client for DB microservice
├── deduplicator.py          # Hash-based dedup via DB microservice
├── legal_bert_model.py      # Legal-BERT embedding model
├── config.py                # All config, env vars, and prompts
│
├── utils/
│   ├── pdf_parser.py        # PDF text extraction
│   └── hashing.py           # SHA-256 hash generation
│
├── data/pdfs/               # Downloaded PDFs (auto-created)
├── .env                     # API keys and service URLs
└── requirements.txt
```

---

## Architecture

```
RBI Website
     ↓
fetcher.py          → scrapes PDF links
     ↓
downloader.py       → downloads + validates PDF
     ↓
pdf_parser.py       → extracts raw text
     ↓
cleaner.py          → normalises whitespace, removes noise
     ↓
deduplicator.py     → GET /db/documents/hash/{hash}
     ↓  (skip if duplicate)
clause_llm.py       → Groq LLM extracts clauses
                    → Legal-BERT generates embeddings per clause
     ↓
context_generator.py → Groq LLM generates summary + keywords
     ↓
storage.py          → POST /db/documents
                    → POST /db/documents/{doc_id}/context
                    → POST /db/documents/{doc_id}/clauses
                    → PATCH /db/documents/{doc_id}/status
     ↓
emit doc_id → Pipeline 2
```

---

## Setup

### 1. Prerequisites

- Python 3.12+
- DB microservice running on `localhost:5000`
- Groq API key (free at [console.groq.com](https://console.groq.com))

---

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

---

### 3. Create `.env` file

```env
GROQ_API_KEY=your_groq_api_key_here
DB_SERVICE_URL=http://localhost:5000
```

---

### 4. Make sure the DB microservice is running

```bash
# in your database service directory
node index.js
```

Verify it's reachable:

```bash
curl http://localhost:5000/db/documents
```

---

## Running the Pipeline

### Run once (development / testing)

```bash
python run_pipeline.py
```

### Run continuously (production)

```bash
python scheduler.py
```

Runs every **10 minutes** by default. Change `SCHEDULER_INTERVAL` in `config.py` to adjust.

---

## DB Microservice Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/db/documents/hash/{hash}` | Deduplication check |
| `POST` | `/db/documents` | Insert document row |
| `POST` | `/db/documents/{doc_id}/context` | Insert summary + keywords |
| `POST` | `/db/documents/{doc_id}/clauses` | Insert extracted clauses |
| `PATCH` | `/db/documents/{doc_id}/status` | Mark as `processed` |

---

## Output Schema

Each successfully processed document produces three records in the DB:

**Document**
```json
{
  "doc_id": "doc_a1b2c3d4",
  "source_id": "rbi_NT60A82D07_ab12cd34",
  "source_url": "https://rbidocs.rbi.org.in/...",
  "hash": "sha256...",
  "full_text": "...",
  "published_at": "2026-04-30T10:00:00Z",
  "status": "processed"
}
```

**Context**
```json
{
  "summary": "This circular directs Regional Rural Banks to...",
  "keywords": ["Reserve Bank of India", "stressed assets", "restructuring"]
}
```

**Clauses** (up to 20 per document)
```json
{
  "clause_id": "doc_a1b2c3d4:c0",
  "text": "Banks must implement AES-256 encryption...",
  "type": "obligation",
  "deadline": "2026-01-01",
  "extraction_confidence": 0.91
}
```

Clause types follow the enum: `obligation` / `prohibition` / `permission`

---

## Configuration

All configuration lives in `config.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_NAME` | `llama-3.3-70b-versatile` | Groq model for LLM calls |
| `MAX_PDFS_PER_RUN` | `5` | Max documents per pipeline run |
| `SCHEDULER_INTERVAL` | `600` | Seconds between scheduled runs |
| `PDF_DOWNLOAD_PATH` | `data/pdfs` | Local PDF storage path |

---

## Known Limitations

- Only the first 5 pages of each PDF are processed (for speed and token efficiency)
- Some RBI PDFs may be inaccessible due to server-side blocking
- Groq free tier has a rate limit of ~30 requests/minute — a 10s delay between documents is applied automatically
- Legal-BERT runs on CPU; embedding generation adds ~1–2s per clause

---

## Downstream

After successful storage, `doc_id` is emitted to **Pipeline 2 (RAG + Mapping + LLM Engine)**, which maps each clause to internal policies, detects compliance gaps, and assigns responsible departments.