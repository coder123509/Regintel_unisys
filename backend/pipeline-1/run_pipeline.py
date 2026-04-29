from fetcher import get_valid_links
from downloader import download_pdf
from utils.pdf_parser import extract_text
from cleaner import clean_text
from utils.hashing import generate_hash
from clause_llm import extract_clauses
from context_generator import generate_context
from storage import store_document
from database import SessionLocal
from deduplicator import is_duplicate_url, is_duplicate_hash


def run():
    print("🚀 Pipeline started")

    db = SessionLocal()

    try:
        links = get_valid_links()
        print("Total links:", len(links))

        # 👉 limit for demo/testing
        for url in links[:5]:
            print("\nProcessing:", url)

            # ✅ URL-based dedup (fast)
            if is_duplicate_url(url):
                print("Duplicate (URL) skipped")
                continue

            # ✅ download
            path = download_pdf(url)
            if not path:
                print("Skipping invalid file")
                continue

            # ✅ extract text
            text = extract_text(path)
            if not text:
                print("Empty text, skipping")
                continue

            clean = clean_text(text)
            print("Text length:", len(clean))

            # ✅ hash-based dedup
            hash_val = generate_hash(clean)
            if is_duplicate_hash(hash_val):
                print("Duplicate (hash) skipped")
                continue

            # ✅ clause extraction
            clauses = extract_clauses(clean)
            print(f"Extracted clauses: {len(clauses)}")

            if not clauses:
                print("⚠️ No clauses extracted")

            # ✅ context generation
            context = generate_context(clean)

            # ✅ store in DB
            try:
                store_document(db, {
                    "url": url,
                    "text": clean,
                    "hash": hash_val,
                    "clauses": clauses,
                    "context": context
                })

                print("✅ Stored successfully")

            except Exception as e:
                db.rollback()
                print("❌ DB insert failed:", e)

    finally:
        db.close()


if __name__ == "__main__":
    print("main block entered")
    run()