import pandas as pd
from embed import retrieve_policy_matches 


def test_rbi_mapping():
    print("Mapping pipeline......\n")
    clause_df=pd.read_csv('./datasets/regulatory_clauses.csv')


    for _, row in clause_df.head(5).iterrows():
        clause_id=row['clause_id']
        clause_text=row['verbatim_clause_text']

        print(f"Testing clause {clause_id}....\n Clause details: {clause_text[:100]}\n")

        results=retrieve_policy_matches(clause_text,n_results=1)
        print(f"Mapped policies.....\n {results}")

        if results:
            match=results[0]
            print(f"Mapped to {match['policy_id']}, {match['policy_name']}")
            print(f"Similarity distance....\n {match['distance']}")
            if match['distance'] > 0.5:
                print("Result: ⚠️ POSSIBLE GAP - Weak semantic match.")
            else:
                print("Result: ✅ COVERED - Strong semantic match.")
        
        print("-" * 50)

if __name__ == "__main__":
    test_rbi_mapping()

    