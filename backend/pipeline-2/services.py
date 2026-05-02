import logging
from neo4j import GraphDatabase
from knowledge_graph.embed import retrieve_policy_matches

logger = logging.getLogger("MappingService")


class MappingService:
    def __init__(self, uri: str, auth: tuple):
        self._uri  = uri
        self._auth = auth
        try:
            self.driver = GraphDatabase.driver(uri, auth=auth)
            self.driver.verify_connectivity()
            logger.info("Connected to Neo4j successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise

    def close(self):
        self.driver.close()

    def _reconnect(self):
        try:
            self.driver.verify_connectivity()
        except Exception:
            logger.warning("Neo4j connection lost — reconnecting...")
            try:
                self.driver.close()
            except Exception:
                pass
            self.driver = GraphDatabase.driver(self._uri, auth=self._auth)

    def get_hybrid_context(self, clause_id: str, clause_text: str) -> dict:

        # ── Reconnect if dropped ──────────────────────────────────────────
        self._reconnect()

        # ── 1. Semantic Retrieval — relevance filter ──────────────────────
        # ChromaDB finds the top 3 most semantically similar policies
        # to this clause. These become the candidate policy IDs for graph.
        semantic_matches = []
        try:
            semantic_matches = retrieve_policy_matches(clause_text, n_results=3)
        except Exception as e:
            logger.error(f"ChromaDB retrieval failed for {clause_id}: {e}")

        # ── 2. Graph Retrieval — enrich the semantic matches ──────────────
        # We query Neo4j ONLY for the 3 policy IDs that semantic search
        # returned. Graph gives us department ownership, IT controls, and
        # framework alignment — structure that ChromaDB doesn't store.
        graph_evidence = {}
        if semantic_matches:
            try:
                policy_ids = [m["policy_id"] for m in semantic_matches]
                with self.driver.session() as session:
                    result = session.run(
                        """
                        MATCH (p:Policy)-[:OWNED_BY]->(d:Department)
                        WHERE p.id IN $policy_ids
                        OPTIONAL MATCH (t:ITControl)-[:IMPLEMENTS]->(p)
                        RETURN
                            p.id            AS policy_id,
                            p.name          AS policy_name,
                            p.framework     AS framework,
                            p.description   AS description,
                            d.name          AS department,
                            collect(t.name) AS controls
                        """,
                        policy_ids=policy_ids,
                    )
                    for r in result:
                        if r["policy_id"]:
                            graph_evidence[r["policy_id"]] = {
                                "policy_id":   r["policy_id"],
                                "policy_name": r["policy_name"],
                                "framework":   r["framework"],
                                "description": r["description"],
                                "department":  r["department"],
                                "controls":    r["controls"],
                            }
            except Exception as e:
                logger.warning(f"Neo4j retrieval failed for {clause_id}: {e}")

        # ── 3. Enrich semantic matches with graph data ────────────────────
        # Merge: semantic match (has distance/content) +
        #        graph data (has department/controls/framework)
        enriched_candidates = []
        for match in semantic_matches:
            graph_info = graph_evidence.get(match["policy_id"], {})
            enriched_candidates.append({
                **match,
                "department": graph_info.get("department", match.get("department", "Unknown")),
                "framework":  graph_info.get("framework", ""),
                "controls":   graph_info.get("controls", []),
            })

        return {
            "clause_id":   clause_id,
            "clause_text": clause_text,
            "retrieval_sources": {
                # graph_policies = the 3 semantic matches confirmed + enriched via graph
                "graph_policies":    [v["policy_name"] for v in graph_evidence.values()],
                "semantic_policies": [m["policy_name"] for m in semantic_matches],
            },
            "candidates":   enriched_candidates,
            "top_distance": enriched_candidates[0]["distance"] if enriched_candidates else 1.0,
        }