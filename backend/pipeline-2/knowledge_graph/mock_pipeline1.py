import pandas as pd
import uuid

def simulate_pipeline_1_output(csv_path="./datasets/regulatory_clauses.csv"):
    """
    Stand-in for Pipeline 1: Converts CSV rows into the 
    standardized 'Document' JSON structure.
    """
    df = pd.read_csv(csv_path)
    
    # We group clauses by 'doc_id' if they exist, otherwise we treat 
    # the whole CSV as one single document for testing.
    clauses = []
    for _, row in df.iterrows():
        clauses.append({
            "clause_id": row['clause_id'],
            "text": row['verbatim_clause_text'],
            "type": "obligation",  # Default for testing
            "confidence": 0.95
        })
        
    return {
        "doc_id": "test_doc_001",
        "source_id": "rbi_test_circular",
        "clauses": clauses
    }