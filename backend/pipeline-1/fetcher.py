import requests
from bs4 import BeautifulSoup

BASE = "https://www.rbi.org.in"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}


FALLBACK_PDFS = [
    "https://www.sec.gov/files/rules/final/34-93504.pdf",
    "https://www.irs.gov/pub/irs-pdf/p17.pdf",
    "https://www.govinfo.gov/content/pkg/PLAW-117publ169/pdf/PLAW-117publ169.pdf"
]


def fetch_rbi_pdfs():
    url = "https://www.rbi.org.in/Scripts/NotificationUser.aspx"

    try:
        res = requests.get(url, headers=HEADERS, timeout=10)

        soup = BeautifulSoup(res.text, "html.parser")

        pdfs = []

        for a in soup.find_all("a", href=True):
            href = a["href"]

            if ".pdf" in href.lower():
                if not href.startswith("http"):
                    href = BASE + "/" + href

                pdfs.append(href)

        pdfs = list(set(pdfs))

        print(f"✅ Fetched {len(pdfs)} RBI links")

        return pdfs

    except Exception as e:
        print("⚠️ RBI fetch failed:", e)
        return []


def get_valid_links():
    links = fetch_rbi_pdfs()

    
    return links[:3] + FALLBACK_PDFS