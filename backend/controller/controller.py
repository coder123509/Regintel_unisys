"""
controller.py
─────────────────────────────────────────────────────────────────
Pipeline Orchestration Controller
Backend: /backend/controller/controller.py

Responsibilities:
  - Waits for DB, P2, P3 to be ready before starting
  - Polls pipeline_status table every POLL_INTERVAL seconds
  - P1 → P2: queues docs where p1=completed, p2=pending
  - P2 → P3: queues docs where p2=completed, p3=pending
  - Processes each pipeline queue ONE doc at a time (sequential)
  - Updates pipeline status at each stage

Environment variables (.env):
  DB_SERVICE_URL   = http://localhost:5000
  PIPELINE_2_URL   = http://localhost:8002
  PIPELINE_3_URL   = http://localhost:8003
  POLL_INTERVAL    = 15
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
DB_URL        = os.getenv("DB_SERVICE_URL", "http://localhost:5000")
P2_URL        = os.getenv("PIPELINE_2_URL", "http://localhost:8002")
P3_URL        = os.getenv("PIPELINE_3_URL", "http://localhost:8003")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", 15))

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [CONTROLLER]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("controller")

# ── Shared State ──────────────────────────────────────────────────────────────
p2_queue: deque[str] = deque()
p3_queue: deque[str] = deque()
queue_lock = threading.Lock()

known_p2_docs: set[str] = set()
known_p3_docs: set[str] = set()


# ── Readiness Checks ──────────────────────────────────────────────────────────

def wait_for_service(name: str, url: str, interval: int = 5) -> None:
    """Blocks until the service responds with 2xx."""
    log.info(f"Waiting for {name} to be ready...")
    while True:
        try:
            resp = requests.get(url, timeout=5)
            resp.raise_for_status()
            log.info(f"✔ {name} reachable")
            return
        except Exception as e:
            log.warning(f"{name} not ready yet — retrying in {interval}s...")
            time.sleep(interval)


# ── DB Microservice ───────────────────────────────────────────────────────────

def db_get_pipeline_status() -> list[dict]:
    """GET /db/pipeline-status"""
    try:
        resp = requests.get(f"{DB_URL}/db/pipeline-status", timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data if isinstance(data, list) else []
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


# ── Pipeline Triggers ─────────────────────────────────────────────────────────

def trigger_p2(doc_id: str) -> bool:
    try:
        log.info(f"→ Triggering P2 for {doc_id}")
        resp = requests.get(
            f"{P2_URL}/rag/map/{doc_id}",
            timeout=600,  # 10 min — P2 has rate limit sleeps
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


def trigger_p3(doc_id: str) -> bool:
    try:
        log.info(f"→ Triggering P3 for {doc_id}")
        resp = requests.post(
            f"{P3_URL}/risk/analyze/{doc_id}",
            timeout=300,  # 5 min
        )
        if resp.status_code == 200:
            log.info(f"✔ P3 completed for {doc_id}")
            return True
        else:
            log.error(f"✘ P3 returned {resp.status_code} for {doc_id}: {resp.text[:200]}")
            return False
    except requests.exceptions.Timeout:
        log.error(f"✘ P3 timed out for {doc_id}")
        return False
    except Exception as e:
        log.error(f"✘ P3 request failed for {doc_id}: {e}")
        return False


# ── Worker Threads ────────────────────────────────────────────────────────────

def p2_worker():
    log.info("P2 Worker thread started.")
    while True:
        doc_id = None
        with queue_lock:
            if p2_queue:
                doc_id = p2_queue.popleft()

        if doc_id is None:
            time.sleep(3)
            continue

        log.info(f"━━━ P2 starting: {doc_id} ━━━")
        db_update_status(doc_id, "p2", "processing")

        success = trigger_p2(doc_id)

        if not success:
            db_update_status(doc_id, "p2", "failed")
            log.warning(f"✘ {doc_id} → p2_status=failed")


def p3_worker():
    log.info("P3 Worker thread started.")
    while True:
        doc_id = None
        with queue_lock:
            if p3_queue:
                doc_id = p3_queue.popleft()

        if doc_id is None:
            time.sleep(3)
            continue

        log.info(f"━━━ P3 starting: {doc_id} ━━━")
        db_update_status(doc_id, "p3", "processing")

        success = trigger_p3(doc_id)

        if not success:
            db_update_status(doc_id, "p3", "failed")
            log.warning(f"✘ {doc_id} → p3_status=failed")


# ── Poller Thread ─────────────────────────────────────────────────────────────

def poller():
    log.info(f"Poller thread started. Checking every {POLL_INTERVAL}s.")

    while True:
        rows = db_get_pipeline_status()

        new_p2 = []
        new_p3 = []

        with queue_lock:
            for r in rows:
                doc_id = r.get("doc_id")
                if not doc_id:
                    continue

                # Ready for P2
                if (r.get("p1_status") == "completed"
                        and r.get("p2_status") == "pending"
                        and doc_id not in known_p2_docs):
                    p2_queue.append(doc_id)
                    known_p2_docs.add(doc_id)
                    new_p2.append(doc_id)

                # Ready for P3
                if (r.get("p2_status") == "completed"
                        and r.get("p3_status") == "pending"
                        and doc_id not in known_p3_docs):
                    p3_queue.append(doc_id)
                    known_p3_docs.add(doc_id)
                    new_p3.append(doc_id)

        if new_p2:
            log.info(f"Queued for P2 ({len(new_p2)}): {new_p2}")
        if new_p3:
            log.info(f"Queued for P3 ({len(new_p3)}): {new_p3}")

        time.sleep(POLL_INTERVAL)


# ── Entry Point ───────────────────────────────────────────────────────────────

def main():
    log.info("═" * 55)
    log.info("  RegIntel Pipeline Controller")
    log.info(f"  DB Service : {DB_URL}")
    log.info(f"  Pipeline 2 : {P2_URL}")
    log.info(f"  Pipeline 3 : {P3_URL}")
    log.info(f"  Poll every : {POLL_INTERVAL}s")
    log.info("═" * 55)

    # Wait for all services to be ready before doing anything
    wait_for_service("DB microservice", f"{DB_URL}/db/pipeline-status")
    wait_for_service("Pipeline 2",      f"{P2_URL}/")
    wait_for_service("Pipeline 3",      f"{P3_URL}/")

    # Start threads
    threading.Thread(target=p2_worker, daemon=True).start()
    threading.Thread(target=p3_worker, daemon=True).start()
    threading.Thread(target=poller,    daemon=True).start()

    log.info("Controller running. Press Ctrl+C to stop.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log.info("Controller stopped.")


if __name__ == "__main__":
    main()