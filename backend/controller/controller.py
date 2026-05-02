"""
controller.py
─────────────────────────────────────────────────────────────────
Pipeline Orchestration Controller
Backend: /backend/controller/controller.py

Responsibilities (Phase 1 — P1 → P2 only):
  - Polls pipeline_status table every POLL_INTERVAL seconds
  - Maintains an in-memory queue of docs ready for P2
    (p1_status=completed, p2_status=pending)
  - Sends docs to P2 ONE AT A TIME (sequential per spec)
  - While P2 is busy with doc-N, continues polling so newly
    completed P1 docs get queued immediately
  - Updates p2_status via DB microservice:
      pending → processing → completed | failed

Environment variables (.env):
  DB_SERVICE_URL   = http://localhost:5000   (Node DB microservice)
  PIPELINE_2_URL   = http://localhost:8002   (FastAPI P2 service)
  POLL_INTERVAL    = 15                      (seconds between polls)
"""

import os
import time
import logging
import threading
import requests
from collections import deque
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
DB_URL      = os.getenv("DB_SERVICE_URL", "http://localhost:5000")
P2_URL      = os.getenv("PIPELINE_2_URL", "http://localhost:8002")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", 15))  # seconds

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [CONTROLLER]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger("controller")

# ── Shared State ──────────────────────────────────────────────────────────────
# Queue of doc_ids waiting to be sent to P2
p2_queue: deque[str] = deque()

# Lock so poller thread and worker thread don't race on the queue
queue_lock = threading.Lock()

# Tracks which doc_ids are already in queue or being processed
# so we never double-enqueue the same doc
known_docs: set[str] = set()


# ── DB Microservice Helpers ───────────────────────────────────────────────────

def db_get_pipeline_status() -> list[dict]:
    """GET /db/pipeline-status — returns all rows."""
    try:
        resp = requests.get(f"{DB_URL}/db/pipeline-status", timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        log.warning(f"Could not fetch pipeline-status: {e}")
        return []


def db_update_status(doc_id: str, pipeline: str, status: str) -> bool:
    """PATCH /db/pipeline-status/{doc_id}"""
    try:
        resp = requests.patch(
            f"{DB_URL}/db/pipeline-status/{doc_id}",
            json={"pipeline": pipeline, "status": status},
            timeout=10,
        )
        resp.raise_for_status()
        return True
    except Exception as e:
        log.error(f"Failed to update {doc_id} {pipeline}→{status}: {e}")
        return False


# ── Pipeline 2 Trigger ────────────────────────────────────────────────────────

def trigger_p2(doc_id: str) -> bool:
    """
    Calls GET /rag/map/{doc_id} on Pipeline 2.
    This is a BLOCKING call — P2 processes the full document
    synchronously and returns when done.
    Returns True on success, False on failure.
    """
    try:
        log.info(f"→ Triggering P2 for {doc_id}")
        resp = requests.get(
            f"{P2_URL}/rag/map/{doc_id}",
            timeout=300,  # 5 min max per document
        )
        if resp.status_code == 200:
            log.info(f"✔ P2 completed for {doc_id}")
            return True
        else:
            log.error(f"✘ P2 returned {resp.status_code} for {doc_id}: {resp.text[:200]}")
            return False
    except requests.exceptions.Timeout:
        log.error(f"✘ P2 timed out for {doc_id}")
        return False
    except Exception as e:
        log.error(f"✘ P2 request failed for {doc_id}: {e}")
        return False


# ── Worker Thread — processes queue one doc at a time ─────────────────────────

def p2_worker():
    """
    Runs in its own thread.
    Picks one doc_id from the queue, processes it fully through P2,
    then picks the next. Blocks between docs until queue has work.
    """
    log.info("P2 Worker thread started.")

    while True:
        doc_id = None

        with queue_lock:
            if p2_queue:
                doc_id = p2_queue.popleft()

        if doc_id is None:
            # Nothing to do — sleep briefly and check again
            time.sleep(3)
            continue

        log.info(f"━━━ Starting P2 for {doc_id} ━━━")

        # Mark as processing in DB
        db_update_status(doc_id, "p2", "processing")

        # Trigger P2 — blocking call
        success = trigger_p2(doc_id)

        # Update final status
        if success:
            db_update_status(doc_id, "p2", "completed")
            log.info(f"✔ {doc_id} → p2_status=completed")
            # P3 trigger goes here later (Phase 2)
        else:
            db_update_status(doc_id, "p2", "failed")
            log.warning(f"✘ {doc_id} → p2_status=failed")


# ── Poller Thread — discovers new ready docs ──────────────────────────────────

def poller():
    """
    Runs in its own thread.
    Every POLL_INTERVAL seconds, checks pipeline_status for docs where
    p1=completed and p2=pending, and adds new ones to the queue.
    """
    log.info(f"Poller thread started. Checking every {POLL_INTERVAL}s.")

    while True:
        rows = db_get_pipeline_status()

        ready = [
            r["doc_id"]
            for r in rows
            if r.get("p1_status") == "completed"
            and r.get("p2_status") == "pending"
        ]

        newly_queued = []
        with queue_lock:
            for doc_id in ready:
                if doc_id not in known_docs:
                    p2_queue.append(doc_id)
                    known_docs.add(doc_id)
                    newly_queued.append(doc_id)

        if newly_queued:
            log.info(f"Queued {len(newly_queued)} new doc(s) for P2: {newly_queued}")
            log.info(f"Queue depth: {len(p2_queue)}")
        else:
            log.debug(f"Poll complete — nothing new. Queue depth: {len(p2_queue)}")

        time.sleep(POLL_INTERVAL)


# ── Entry Point ───────────────────────────────────────────────────────────────

def main():
    log.info("═" * 55)
    log.info("  RegIntel Pipeline Controller")
    log.info(f"  DB Service : {DB_URL}")
    log.info(f"  Pipeline 2 : {P2_URL}")
    log.info(f"  Poll every : {POLL_INTERVAL}s")
    log.info("═" * 55)

    # Verify DB service is reachable before starting
    try:
        requests.get(f"{DB_URL}/db/pipeline-status", timeout=5).raise_for_status()
        log.info("✔ DB microservice reachable")
    except Exception as e:
        log.error(f"✘ Cannot reach DB microservice at {DB_URL}: {e}")
        log.error("  Start the DB service first, then run the controller.")
        return

    # Start worker thread (processes queue)
    worker_thread = threading.Thread(target=p2_worker, daemon=True)
    worker_thread.start()

    # Start poller thread (fills queue)
    poller_thread = threading.Thread(target=poller, daemon=True)
    poller_thread.start()

    log.info("Controller running. Press Ctrl+C to stop.\n")

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log.info("Controller stopped.")


if __name__ == "__main__":
    main()