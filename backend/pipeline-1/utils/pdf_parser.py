import pdfplumber

def extract_text(path):
    try:
        text = ""
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages[:5]:
                text += page.extract_text() or ""
        return text
    except Exception as e:
        print("PDF parse failed:", e)
        return ""