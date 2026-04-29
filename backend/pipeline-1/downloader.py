import requests
import os
import pdfplumber

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
    "Referer": "https://www.rbi.org.in/",
    "Connection": "keep-alive"
}

def download_pdf(url):
    os.makedirs("data/pdfs", exist_ok=True)

    filename = url.split("/")[-1]
    path = f"data/pdfs/{filename}"

    if os.path.exists(path):
        return path

    try:
        session = requests.Session()

        response = session.get(
            url,
            headers=HEADERS,
            timeout=20,
            allow_redirects=True
        )

        # ❌ If HTML instead of PDF
        if "text/html" in response.headers.get("Content-Type", ""):
            print("⚠️ Blocked or HTML response:", url)
            return None

        # save file
        with open(path, "wb") as f:
            f.write(response.content)

        # ✅ validate by opening
        try:
            with pdfplumber.open(path) as pdf:
                _ = pdf.pages

            return path

        except Exception:
            print("⚠️ Downloaded but not readable PDF:", url)
            os.remove(path)
            return None

    except Exception as e:
        print("Download failed:", e)
        return None