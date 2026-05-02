"""
knowledge_graph/extract.py
──────────────────────────
Extracts internal policy data from Neo4j to prepare for
vector embedding in ChromaDB.
"""

import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

_URI  = os.getenv("NEO4J_URI")
_AUTH = (os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD"))


def extract_policy_context(driver) -> list[dict]:
    """
    Pulls Policy + Department data from Neo4j.
    Builds a rich 'full_context' string used for embedding.
    """
    query = """
    MATCH (p:Policy)-[:OWNED_BY]->(d:Department)
    RETURN
        p.id          AS policy_id,
        p.name        AS policy_name,
        d.name        AS department_name,
        "Policy: "    + p.name        +
        " | Context: "+ p.description +
        " | Framework: " + p.framework +
        " | Dept: "   + d.name        AS full_context
    """
    with driver.session() as session:
        result = session.run(query)
        return [record.data() for record in result]

if __name__ == "__main__":
    with GraphDatabase.driver(_URI, auth=_AUTH) as driver:
        policies = extract_policy_context(driver)
        print(f"Extracted {len(policies)} policies from Knowledge Graph.")
        if policies:
            print(f"Sample: {policies[0]['full_context'][:150]}...")