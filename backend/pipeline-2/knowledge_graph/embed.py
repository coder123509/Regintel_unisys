import chromadb
from chromadb.utils import embedding_functions
import os

MODEL_PATH="./my_local_model"


EMB_FN = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name=MODEL_PATH
)

# Persistent storage for Docker/Production
client = chromadb.PersistentClient(path="./compliance_db")
collection = client.get_or_create_collection(
    name="internal_policies",
    embedding_function=EMB_FN,
    metadata={"hnsw:space": "cosine"}
)

def upsert_to_vector_db(policies_data):
    """
    Bridge Function: Takes the list of dictionaries from extract.py
    and pushes them into ChromaDB.
    """
    ids = []
    documents = []
    metadatas = []

    for item in policies_data:
        ids.append(item['policy_id'])
        documents.append(item['full_context'])
        metadatas.append({
            "policy_name": item['policy_name'],
            "department": item['department_name']
        })

    if ids:
        collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        print(f"✓ ChromaDB: Upserted {len(ids)} policy vectors.")
def retrieve_policy_matches(query_text, n_results=3):
    """
    The Core Search Engine:
    Takes a raw RBI clause and finds the mathematically closest internal policies.
    """
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    
    formatted_results = []
    # results["ids"][0] contains the list of policy_ids found
    for i in range(len(results["ids"][0])):
        formatted_results.append({
            "policy_id": results["ids"][0][i],
            "policy_name": results["metadatas"][0][i]["policy_name"],
            "department": results["metadatas"][0][i]["department"],
            # Distance: 0.0 is exact match, 1.0+ is very different
            "distance": round(results["distances"][0][i], 4),
            "content": results["documents"][0][i]
        })
    
    return formatted_results

# Temporary test to run AFTER main.py
if __name__ == "__main__":
    # Test if 'PII' query finds a 'Data' policy
    test_query = "How should we handle PII and customer account masking?"
    results = collection.query(query_texts=[test_query], n_results=1)
    print(f"Test Result: {results['ids'][0][0]} found with distance {results['distances'][0][0]}")