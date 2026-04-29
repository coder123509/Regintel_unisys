import requests
from bs4 import BeautifulSoup

BASE = "https://www.rbi.org.in"
HEADERS = {"User-Agent": "Mozilla/5.0"}


def fetch_rbi_pdfs() -> list[str]:
    url = "https://www.rbi.org.in/Scripts/NotificationUser.aspx"
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        pdfs = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if ".pdf" in href.lower():
                if not href.startswith("http"):
                    href = f"{BASE}/{href.lstrip('/')}"
                pdfs.append(href)
        pdfs = list(set(pdfs))
        print(f"✅ Fetched {len(pdfs)} RBI links")
        return pdfs
    except Exception as e:
        print(f"⚠️ RBI fetch failed: {e}")
        return []


def get_valid_links() -> list[str]:
    return fetch_rbi_pdfs()  # RBI only, no fallbacks