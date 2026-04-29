import logging
from neo4j import GraphDatabase
from embed import retrieve_policy_matches

# Setup Logging for production monitoring
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MappingService")

class MappingService:
    def __init__(self, uri, auth):
        try:
            self.driver = GraphDatabase.driver(uri, auth=auth)
            self.driver.verify_connectivity()
            logger.info("Connected to Neo4j successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise

    def close(self):
        self.driver.close()

    def get_hybrid_context(self, clause_id: str, clause_text: str):
        """
        Industry Grade Hybrid Retrieval:
        Gathers explicit graph links and semantic vector similarities.
        """
        graph_evidence = []
        
        # 1. Graph Retrieval with Timeout/Error Handling
        try:
            with self.driver.session() as session:
                query = """
                MATCH (c:Clause {id: $c_id})
                OPTIONAL MATCH (c)-[:MAPS_TO|ENFORCES]->(p:Policy)
                RETURN p.id as id, p.name as name
                """
                result = session.run(query, c_id=clause_id)
                graph_evidence = [{"id": r["id"], "name": r["name"]} for r in result if r["id"]]
        except Exception as e:
            logger.warning(f"Neo4j retrieval failed for {clause_id}: {e}")

        # 2. Semantic Retrieval (Vector Search)
        try:
            semantic_matches = retrieve_policy_matches(clause_text, n_results=3)
        except Exception as e:
            logger.error(f"ChromaDB retrieval failed: {e}")
            semantic_matches = []

        return {
            "clause_id": clause_id,
            "clause_text": clause_text,
            "retrieval_sources": {
                "graph_policies": [p['name'] for p in graph_evidence],
                "semantic_policies": [p['policy_name'] for p in semantic_matches]
            },
            "candidates": semantic_matches,
            "top_distance": semantic_matches[0]['distance'] if semantic_matches else 1.0
        }