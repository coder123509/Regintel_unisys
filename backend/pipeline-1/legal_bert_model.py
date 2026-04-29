"""
legal_bert_model.py
-------------------
Loads Legal-BERT once at import time and exposes get_embeddings().
Returns a plain Python list (serialisable) instead of a raw tensor.
"""

from transformers import AutoTokenizer, AutoModel
import torch

_MODEL_NAME = "nlpaueb/legal-bert-base-uncased"

print("Loading Legal-BERT model…")
_tokenizer = AutoTokenizer.from_pretrained(_MODEL_NAME)
_model = AutoModel.from_pretrained(_MODEL_NAME)
_model.eval()
print("Legal-BERT loaded.")


def get_embeddings(text: str) -> list[float]:
    """
    Returns the mean-pooled CLS embedding as a plain Python list of floats.
    Safe to log, store, or pass to a vector DB.
    """
    inputs = _tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512,
    )
    with torch.no_grad():
        outputs = _model(**inputs)

    # Mean pool over token dimension → shape (1, hidden_size)
    embedding = outputs.last_hidden_state.mean(dim=1).squeeze()
    return embedding.tolist()