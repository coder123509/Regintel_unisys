from neo4j import GraphDatabase
from extract import extract_policy_context # Import your extraction logic
from knowledge_graph.embed import upsert_to_vector_db     # Import your embedding logic

# Your unified credentials
URI = "neo4j+s://e556d5f0.databases.neo4j.io"
AUTH = ("e556d5f0", "6DHwk-nhxG42F6MPM8IKzTGbDlAEKyBs7s8lyQyVWB0")

def run_pipeline():
    # Step 1: Initialize the Neo4j Driver
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        print("--- Step 1: Extracting from Knowledge Graph ---")
        # Call the function from extract.py
        policies = extract_policy_context(driver) 
        
    # Step 2: Ingest into the RAG Layer
    if policies:
        print(f"\n--- Step 2: Ingesting {len(policies)} policies into ChromaDB ---")
        # Call the function from embed.py
        upsert_to_vector_db(policies)
        print("\nPipeline execution successful!")
    else:
        print("No policies found to extract.")

if __name__ == "__main__":
    run_pipeline()