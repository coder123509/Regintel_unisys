"""
legal_bert_model.py
───────────────────
Legal-BERT for clause embeddings.
Lazy-loaded on first use — does not block pipeline startup.
"""

from transformers import AutoTokenizer, AutoModel
import torch

_MODEL_NAME = "nlpaueb/legal-bert-base-uncased"

_tokenizer = None
_model     = None


def _load():
    global _tokenizer, _model
    if _model is None:
        print("Loading Legal-BERT model…")
        _tokenizer = AutoTokenizer.from_pretrained(_MODEL_NAME)
        _model     = AutoModel.from_pretrained(_MODEL_NAME)
        _model.eval()
        print("Legal-BERT loaded.")


def get_embeddings(text: str) -> list[float]:
    """
    Returns mean-pooled embedding as a plain Python list of floats.
    Model is loaded on first call, then reused for all subsequent calls.
    """
    _load()

    inputs = _tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512,
    )
    with torch.no_grad():
        outputs = _model(**inputs)

    embedding = outputs.last_hidden_state.mean(dim=1).squeeze()
    return embedding.tolist()