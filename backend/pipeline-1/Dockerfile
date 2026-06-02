FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir \
    torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# RUN test -d legal_bert_local || (echo "ERROR: legal_bert_local/ not found. Run download script first." && exit 1)
RUN mkdir -p legal_bert_local
CMD ["python", "scheduler.py"]
