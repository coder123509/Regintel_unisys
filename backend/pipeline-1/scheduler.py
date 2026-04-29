import time
from datetime import datetime
from run_pipeline import run

# ⏱️ interval in seconds (e.g., 10 minutes = 600)
INTERVAL = 600  


def start_scheduler():
    print(" Scheduler started...")

    while True:
        print("\n==============================")
        print(" Running pipeline at:", datetime.now())
        print("==============================")

        try:
            run()
        except Exception as e:
            print(" Pipeline crashed:", e)

        print(f"\n Waiting {INTERVAL} seconds...\n")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    start_scheduler()