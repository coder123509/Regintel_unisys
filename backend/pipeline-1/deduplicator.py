"""
deduplicator.py
---------------
Checks the DB microservice for duplicates.
URL-based check is not a dedicated endpoint in the spec, so we do
hash-based dedup only (which is the correct approach anyway —
same content from a different URL is still a duplicate).
"""

from db_client import check_hash_exists


def is_duplicate_hash(hash_val: str) -> bool:
    try:
        result = check_hash_exists(hash_val)
        return result.get("exists", False)
    except Exception as e:
        print(f"  Hash dedup check failed (treating as non-duplicate): {e}")
        return False