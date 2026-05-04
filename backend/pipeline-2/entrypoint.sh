#!/bin/sh

echo "Checking if ChromaDB exists..."

if [ ! -f "/app/compliance_db/chroma.sqlite3" ]; then
    echo "ChromaDB not found → running knowledge graph setup..."
    python -m knowledge_graph.main
else
    echo "ChromaDB already initialized. Skipping setup."
fi

echo "Starting API..."
exec uvicorn app:app --host 0.0.0.0 --port 8002