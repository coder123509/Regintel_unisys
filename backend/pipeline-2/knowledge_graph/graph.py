import csv
import os
from neo4j import GraphDatabase

# ── Config ──────────────────────────────────────────────────────────────────
NEO4J_URI      = "neo4j+s://e556d5f0.databases.neo4j.io"
NEO4J_USER     = "e556d5f0"
NEO4J_PASSWORD = "6DHwk-nhxG42F6MPM8IKzTGbDlAEKyBs7s8lyQyVWB0" 
CSV_DIR        = os.path.dirname(os.path.abspath(__file__))

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def load_csv(filename):
    path = os.path.join(CSV_DIR, filename)
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))

# ── Schema Constraints ──────────────────────────────────────────────────────
CONSTRAINTS = [
    "CREATE CONSTRAINT IF NOT EXISTS FOR (d:Department) REQUIRE d.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Policy)     REQUIRE p.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Clause)     REQUIRE c.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (t:ITControl)  REQUIRE t.id IS UNIQUE",
]

# ── Node Ingestion ──────────────────────────────────────────────────────────

def ingest_departments(session, rows):
    for r in rows:
        session.run("""
            MERGE (d:Department {id: $department_id})
            SET d.name = $department_name,
                d.head = $head_title
        """, **r)
    print(f"  ✓ Departments: {len(rows)}")

def ingest_policies(session, rows):
    for r in rows:
        # We only keep fields that help with retrieval or ownership
        session.run("""
            MERGE (p:Policy {id: $policy_id})
            SET p.name = $policy_name,
                p.framework = $framework_alignment,
                p.description = $gap_description 
            WITH p
            MATCH (d:Department {id: $department_id})
            MERGE (p)-[:OWNED_BY]->(d)
        """, **r)
    print(f"  ✓ Policies & Ownership: {len(rows)}")

def ingest_controls(session, rows):
    for r in rows:
        session.run("""
            MERGE (t:ITControl {id: $control_id})
            SET t.name = $control_name,
                t.system_type = $system_type
        """, **r)
        # Link to Policy
        for pol_id in r["policy_id"].split(" / "):
            pol_id = pol_id.strip()
            if pol_id:
                session.run("""
                    MATCH (t:ITControl {id: $ctrl_id})
                    MATCH (p:Policy {id: $pol_id})
                    MERGE (t)-[:IMPLEMENTS]->(p)
                """, ctrl_id=r["control_id"], pol_id=pol_id)
    print(f"  ✓ IT Controls & Implementation: {len(rows)}")

def ingest_clauses(session, rows):
    """
    This simulates Pipeline 1 (Ingestion). 
    We ingest only the RAW regulatory data.
    """
    for r in rows:
        session.run("""
            MERGE (c:Clause {id: $clause_id})
            SET c.text = $verbatim_clause_text,
                c.type = $clause_type,
                c.source = $regulation_name
        """, **r)
    print(f"  ✓ Raw Regulatory Clauses: {len(rows)}")

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    with driver.session() as session:
        print("Applying Constraints...")
        for c in CONSTRAINTS: session.run(c)

        print("Seeding Knowledge Graph Library...")
        ingest_departments(session, load_csv("departments.csv"))
        ingest_policies(session, load_csv("internal_policies.csv"))
        ingest_controls(session, load_csv("it_controls.csv"))
        
        print("Simulating Pipeline 1 Input...")
        ingest_clauses(session, load_csv("regulatory_clauses.csv"))

    driver.close()
    print("\n[SUCCESS] Knowledge Graph Library Seeded.")

if __name__ == "__main__":
    main()