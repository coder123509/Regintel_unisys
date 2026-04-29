import re
from collections import Counter

def generate_context(text):

    sentences = re.split(r'(?<=[.!?]) +', text)

    # Summary = first 3 sentences
    summary = " ".join(sentences[:3])

    # Keywords = most frequent words
    words = re.findall(r'\w+', text.lower())

    common = Counter(words).most_common(10)

    keywords = [word for word, _ in common if len(word) > 4][:5]

    return {
        "summary": summary,
        "keywords": keywords
    }