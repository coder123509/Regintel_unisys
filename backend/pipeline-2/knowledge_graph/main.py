"""
knowledge_graph/main.py
───────────────────────
One-time setup script. Run this ONCE before starting Pipeline 2.
  1. Seeds Neo4j knowledge graph from CSVs
  2. Extracts policy context from Neo4j
  3. Embeds and stores policies in ChromaDB
"""

import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

from knowledge_graph.graph import (
    ingest_departments,
    ingest_policies,
    ingest_controls,
    ingest_clauses,
    CONSTRAINTS,
    load_csv,
)
from knowledge_graph.extract import extract_policy_context
from knowledge_graph.embed import upsert_to_vector_db

load_dotenv()

URI  = os.getenv("NEO4J_URI")
AUTH = (os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))


def main():
    print("=" * 50)
    print("  Knowledge Graph + Vector DB Setup")
    print("=" * 50)

    driver = GraphDatabase.driver(URI, auth=AUTH)

    with driver.session() as session:
        print("\n[1/2] Seeding Neo4j Knowledge Graph...")
        for constraint in CONSTRAINTS:
            session.run(constraint)
        ingest_departments(session, load_csv("departments.csv"))
        ingest_policies(session, load_csv("internal_policies.csv"))
        ingest_controls(session, load_csv("it_controls.csv"))
        ingest_clauses(session, load_csv("regulatory_clauses.csv"))

    print("\n[2/2] Embedding policies into ChromaDB...")
    with GraphDatabase.driver(URI, auth=AUTH) as d:
        policies = extract_policy_context(d)

    if policies:
        upsert_to_vector_db(policies)
    else:
        print("No policies found in Neo4j — check your CSV seeding.")

    driver.close()
    print("\n[SUCCESS] Setup complete. Pipeline 2 is ready to run.")


if __name__ == "__main__":
    main()