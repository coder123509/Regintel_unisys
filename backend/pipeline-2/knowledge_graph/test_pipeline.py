import json
from mock_pipeline1 import simulate_pipeline_1_output
from services import MappingService
from mapping_logic import analyze_mapping_with_llm
from dotenv import load_dotenv
import os

load_dotenv()

def test_full_mapping_pipeline():
    print("🚀 Starting Integration Test: CSV -> Hybrid RAG -> Gemini 2.5 Flash\n")
    
    # 1. Initialize Service
    service = MappingService(os.getenv("NEO4J_URI"), (os.getenv("NEO4J_USER"), os.getenv("NEO4J_PASSWORD")))
    
    # 2. Get Mock Data (Stand-in for Pipeline 1)
    mock_doc = simulate_pipeline_1_output()
    
    final_output = []
    
    # 3. Process each clause through YOUR logic
    for clause in mock_doc['clauses'][:3]: # Test first 3 for speed
        print(f"🔍 Processing: {clause['clause_id']}...")
        
        # Step A: Hybrid Retrieval
        context = service.get_hybrid_context(clause['clause_id'], clause['text'])
        
        # Step B: LLM Logic
        mapping_result = analyze_mapping_with_llm(context)
        
        # Step C: Combine (As per your Pipeline 2 Doc)
        enriched_clause = {**clause, "mapping_data": mapping_result["mapping_data"]}
        final_output.append(enriched_clause)
        
    # 4. Save/Print Results
    print("\n✅ Test Complete. Final Enriched JSON:")
    print(json.dumps(final_output, indent=2))

if __name__ == "__main__":
    test_full_mapping_pipeline()