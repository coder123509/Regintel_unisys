"""
knowledge_graph/graph.py
────────────────────────
Neo4j seeding logic. Ingests CSV data into the knowledge graph.
Called by knowledge_graph/main.py during one-time setup.
"""

import csv
import os

CONSTRAINTS = [
    "CREATE CONSTRAINT IF NOT EXISTS FOR (d:Department) REQUIRE d.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Policy)     REQUIRE p.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Clause)     REQUIRE c.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (t:ITControl)  REQUIRE t.id IS UNIQUE",
]

_CSV_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "datasets")


def load_csv(filename: str) -> list[dict]:
    path = os.path.join(_CSV_DIR, filename)
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def ingest_departments(session, rows: list[dict]) -> None:
    for r in rows:
        session.run(
            """
            MERGE (d:Department {id: $department_id})
            SET d.name = $department_name,
                d.head = $head_title
            """,
            **r,
        )
    print(f"  ✔ Departments: {len(rows)}")


def ingest_policies(session, rows: list[dict]) -> None:
    for r in rows:
        session.run(
            """
            MERGE (p:Policy {id: $policy_id})
            SET p.name        = $policy_name,
                p.framework   = $framework_alignment,
                p.description = $gap_description
            WITH p
            MATCH (d:Department {id: $department_id})
            MERGE (p)-[:OWNED_BY]->(d)
            """,
            **r,
        )
    print(f"  ✔ Policies + ownership links: {len(rows)}")


def ingest_controls(session, rows: list[dict]) -> None:
    for r in rows:
        session.run(
            """
            MERGE (t:ITControl {id: $control_id})
            SET t.name        = $control_name,
                t.system_type = $system_type
            """,
            **r,
        )
        for pol_id in r["policy_id"].split(" / "):
            pol_id = pol_id.strip()
            if pol_id:
                session.run(
                    """
                    MATCH (t:ITControl {id: $ctrl_id})
                    MATCH (p:Policy    {id: $pol_id})
                    MERGE (t)-[:IMPLEMENTS]->(p)
                    """,
                    ctrl_id=r["control_id"],
                    pol_id=pol_id,
                )
    print(f"  ✔ IT Controls + implementation links: {len(rows)}")


def ingest_clauses(session, rows: list[dict]) -> None:
    """Seeds raw regulatory clauses — simulates Pipeline 1 input."""
    for r in rows:
        session.run(
            """
            MERGE (c:Clause {id: $clause_id})
            SET c.text   = $verbatim_clause_text,
                c.type   = $clause_type,
                c.source = $regulation_name
            """,
            **r,
        )
    print(f"  ✔ Regulatory Clauses: {len(rows)}")