# Pipeline-1: Automated Document Ingestion System

##  Overview

This module implements an automated pipeline that continuously monitors regulatory sources (like RBI), downloads new documents, extracts meaningful information, and stores it in a structured database.

The goal is to eliminate manual effort in reading long legal documents by automatically identifying important clauses, summaries, and keywords.

---

##  What the Pipeline Does

* Fetches latest regulatory PDF links
* Downloads valid documents
* Extracts and cleans text from PDFs
* Avoids duplicate processing (URL + content hash)
* Extracts important clauses using Legal-BERT + rules
* Generates summary and keywords
* Stores everything in PostgreSQL
* Runs continuously using a scheduler

---

##  Project Structure

```
pipeline-1/
│
├── run_pipeline.py        # Main execution script
├── scheduler.py           # Runs pipeline automatically
├── fetcher.py             # Fetches document links
├── downloader.py          # Downloads PDFs
├── cleaner.py             # Cleans extracted text
├── clause_llm.py          # Clause extraction logic
├── context_generator.py   # Summary + keywords
├── storage.py             # Database storage
├── deduplicator.py        # Duplicate checking
├── database.py            # DB connection
├── models.py              # DB schema
│
├── utils/
│   ├── pdf_parser.py
│   ├── hashing.py
│
├── data/pdfs/             # Downloaded PDFs
├── .env                   # DB credentials
├── requirements.txt
```

---

##  Setup Instructions

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

---

### 2. Setup environment variables

Create a `.env` file inside `pipeline-1/`:

```
DATABASE_URL=postgresql://username:password@localhost:5432/your_db
```

---

### 3. Create database tables

Run once:

```bash
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
```

---



### Run pipeline 

```bash
python run_pipeline.py
```

---

### Run continuously 

```bash
python scheduler.py
```

This will automatically check for new documents at regular intervals.

---



The system automatically checks regulatory websites for new documents.
If a new PDF is found, it downloads it, reads the content, and extracts important clauses using an AI model (Legal-BERT).

Instead of reading full documents manually, the system identifies key rules like obligations, permissions, and restrictions. It also generates a short summary and keywords.

All processed information is stored in a database so it can be easily accessed later.

---



* Only first few pages of PDFs are processed (for speed)
* Some regulatory PDFs may be blocked or inaccessible
* Deduplication ensures the same document is not processed twice

---



After running, the database will contain:

* Document text
* Extracted clauses
* Summary
* Keywords

---


