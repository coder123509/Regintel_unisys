# from fetcher import get_valid_links
# from downloader import download_pdf
# from utils.pdf_parser import extract_text
# from cleaner import clean_text
# from utils.hashing import generate_hash
# from clause_llm import extract_clauses
# from context_generator import generate_context
# from storage import store_document
# from database import SessionLocal
# from deduplicator import is_duplicate_url, is_duplicate_hash


# def run():
#     print("🚀 Pipeline started")

#     db = SessionLocal()

#     try:
#         links = get_valid_links()
#         print("Total links:", len(links))

#         # limit for testing/demo
#         for url in links[:5]:
#             print("\nProcessing:", url)

#             # ✅ URL deduplication
#             if is_duplicate_url(url):
#                 print("Duplicate (URL) skipped")
#                 continue

#             path = download_pdf(url)
#             if not path:
#                 print("Skipping invalid file")
#                 continue

#             text = extract_text(path)
#             if not text:
#                 print("Empty text, skipping")
#                 continue

#             clean = clean_text(text)
#             print("Text length:", len(clean))

#             # ✅ Hash deduplication
#             hash_val = generate_hash(clean)
#             if is_duplicate_hash(hash_val):
#                 print("Duplicate (hash) skipped")
#                 continue

#             # ✅ Clause extraction
#             clauses = extract_clauses(clean)

#             print("\n--- Extracted Clauses ---")
#             if not clauses:
#                 print("No clauses found")
#             else:
#                 for i, c in enumerate(clauses):
#                     print(f"{i+1}. [{c['type']}] {c['text'][:100]}...")

#             # ✅ Context generation
#             context = generate_context(clean)

#             print("\n--- Summary ---")
#             print(context.get("summary", ""))

#             print("\n--- Keywords ---")
#             print(context.get("keywords", []))

#             # ✅ Store in DB
#             try:
#                 store_document(db, {
#                     "url": url,
#                     "text": clean,
#                     "hash": hash_val,
#                     "clauses": clauses,
#                     "context": context
#                 })

#                 print("\n✅ Stored successfully")

#             except Exception as e:
#                 db.rollback()
#                 print("❌ DB insert failed:", e)

#     finally:
#         db.close()


# if __name__ == "__main__":
#     print("main block entered")
#     run()

from fetcher import get_valid_links
from downloader import download_pdf
from utils.pdf_parser import extract_text
from cleaner import clean_text
from clause_llm import extract_clauses


def run():
    print("🚀 Pipeline started")

    links = get_valid_links()
    print("Total links:", len(links))

    # limit for testing/demo
    for url in links[:3]:
        print("\n==============================")
        print("Processing:", url)
        print("==============================")

        # Step 1: Download PDF
        path = download_pdf(url)
        if not path:
            print("❌ Skipping invalid file")
            continue

        # Step 2: Extract text
        text = extract_text(path)
        if not text:
            print("❌ Empty text, skipping")
            continue

        # Step 3: Clean text
        clean = clean_text(text)
        print("Text length:", len(clean))

        # Step 4: Extract clauses
        clauses = extract_clauses(clean)

        # Step 5: Print results
        print("\n========== CLAUSE OUTPUT ==========")

        if not clauses:
            print("❌ No clauses extracted")
        else:
            for i, c in enumerate(clauses):
                print(f"\nClause {i+1}")
                print("Type       :", c.get("type"))
                print("Confidence :", c.get("confidence"))
                print("Text       :", c.get("text")[:200], "...")

        print("\n===================================")


if __name__ == "__main__":
    print("main block entered")
    run()