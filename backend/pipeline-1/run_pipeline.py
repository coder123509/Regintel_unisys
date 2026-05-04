"""
run_pipeline.py
---------------
Orchestrates the full Pipeline 1 flow:
  1. Fetch PDF links
  2. Download PDFs
  3. Extract + clean text
  4. Deduplicate via DB microservice
  5. Extract clauses (Gemini + Legal-BERT)
  6. Generate context (Gemini)
  7. Store everything via DB microservice
  8. Emit doc_id for downstream pipelines (Pipeline 2)
"""

from fetcher import get_valid_links
from downloader import download_pdf
from utils.pdf_parser import extract_text
from cleaner import clean_text
from utils.hashing import generate_hash
from clause_llm import extract_clauses
from context_generator import generate_context
from deduplicator import is_duplicate_hash
from storage import store_document
from config import MAX_PDFS_PER_RUN
import time 

def emit_to_downstream(doc_id: str) -> None:
    """
    Placeholder: notify Pipeline 2 that a new doc_id is ready.
    Replace with a message queue push (Kafka/RabbitMQ/Redis) or
    a direct HTTP call to the RAG pipeline trigger endpoint.
    """
    print(f"  → Emitting doc_id={doc_id} to downstream pipelines")
    # TODO: queue.publish("pipeline2", {"doc_id": doc_id})


def run() -> None:
    print(" Pipeline 1 started")

    links = get_valid_links()
    print(f"Total links to process: {len(links)}")

    processed = 0

    for url in links[:MAX_PDFS_PER_RUN]:
        print(f"\n{'─'*60}")
        print(f"Processing: {url}")

        # ── Download ────────────────────────────────────────────────────────
        path = download_pdf(url)
        if not path:
            print("  Skipping: could not download")
            continue

        # ── Extract + clean text ────────────────────────────────────────────
        raw_text = extract_text(path)
        if not raw_text:
            print("  Skipping: empty text extracted")
            continue

        clean = clean_text(raw_text)
        print(f"  Clean text length: {len(clean)} chars")

        # ── Deduplication (hash-based via DB microservice) ──────────────────
        hash_val = generate_hash(clean)
        if is_duplicate_hash(hash_val):
            print("  Duplicate (hash match) — skipping")
            continue

        # ── Clause extraction (Gemini + Legal-BERT embeddings) ──────────────
        clauses = extract_clauses(clean)
        if not clauses:
            print("  No clauses extracted — storing document anyway")

        # ── Context generation (Gemini) ─────────────────────────────────────
        context = generate_context(clean)
        print(f"  Context keywords: {context.get('keywords')}")

        # ── Store via DB microservice ───────────────────────────────────────
        try:
            doc_id = store_document({
                "url":     url,
                "text":    clean,
                "hash":    hash_val,
                "clauses": clauses,
                "context": context,
            })
            print(f"  Stored successfully — doc_id: {doc_id}")
            emit_to_downstream(doc_id)
            processed += 1

        except Exception as e:
            print(f"  Storage failed for {url}: {e}")
        print(f"   Waiting 10s before next document (rate limit)...")
        time.sleep(10)  # 10s gap = max 6 docs/min, well under Groq's 30 req/min limit

    print(f"\n{'='*60}")
    print(f"Pipeline 1 complete — {processed} document(s) stored")


if __name__ == "__main__":
    run()
