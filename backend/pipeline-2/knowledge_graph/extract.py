import pandas as pd
from neo4j import GraphDatabase

# Ensure these match your final project environment
URI = "neo4j+s://e556d5f0.databases.neo4j.io"
AUTH = ("neo4j", "6DHwk-nhxG42F6MPM8IKzTGbDlAEKyBs7s8lyQyVWB0")

def extract_policy_context(driver):
    """
    Pulls data from Neo4j to prepare for Vector Embedding.
    Updated to match the final 'Policy' schema and rich context requirements.
    """
    query = """
    MATCH (p:Policy)-[:OWNED_BY]->(d:Department)
    RETURN 
        p.id AS policy_id, 
        p.name AS policy_name,
        d.name AS department_name,
        // We include the description/gap_description field because it contains 
        // the technical keywords the RAG needs for matching.
        "Policy: " + p.name + 
        " | Context: " + p.description + 
        " | Framework: " + p.framework + 
        " | Dept: " + d.name AS full_context
    """
    
    with driver.session() as session:
        result = session.run(query)
        data = [record.data() for record in result]
        return data

if __name__ == "__main__":
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        policies = extract_policy_context(driver)
        print(f"--- Pipeline 3: Extraction Phase ---")
        print(f"Extracted {len(policies)} records from Knowledge Graph.")
        
        if policies:
            # Check for the key mapping ID and technical context
            sample = policies[0]
            print(f"Verification - Policy ID: {sample['policy_id']}")
            print(f"Verification - Context Quality: {sample['full_context'][:150]}...")