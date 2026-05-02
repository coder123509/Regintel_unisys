import chromadb
from chromadb.utils import embedding_functions

_EMB_FN = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

_client = chromadb.PersistentClient(path="./compliance_db")

collection = _client.get_or_create_collection(
    name="internal_policies",
    embedding_function=_EMB_FN,
    metadata={"hnsw:space": "cosine"},
)


def upsert_to_vector_db(policies_data: list[dict]) -> None:
    if not policies_data:
        print("No policies to upsert.")
        return

    ids       = [item["policy_id"]    for item in policies_data]
    documents = [item["full_context"] for item in policies_data]
    metadatas = [
        {
            "policy_name": item["policy_name"],
            "department":  item["department_name"],
        }
        for item in policies_data
    ]

    collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
    print(f"✔ ChromaDB: upserted {len(ids)} policy vectors.")


def retrieve_policy_matches(query_text: str, n_results: int = 3) -> list[dict]:
    results = collection.query(query_texts=[query_text], n_results=n_results)

    formatted = []
    for i in range(len(results["ids"][0])):
        formatted.append({
            "policy_id":   results["ids"][0][i],
            "policy_name": results["metadatas"][0][i]["policy_name"],
            "department":  results["metadatas"][0][i]["department"],
            "distance":    round(results["distances"][0][i], 4),
            "content":     results["documents"][0][i],
        })

    return formatted