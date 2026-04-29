import os
import json
from google import genai
from typing import Dict, Any
from dotenv import load_dotenv

# Load credentials
load_dotenv()

# Modern 2026 Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def analyze_mapping_with_llm(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    State-of-the-art LLM Reasoning using Gemini 2.5 Flash.
    """
    
    prompt = f"""
    ROLE: Senior Banking Compliance Officer.
    TASK: Map the RBI Clause to the most relevant Internal Policy and identify Gaps.
    
    RBI CLAUSE:
    {context['clause_text']}
    
    INTERNAL POLICY CANDIDATES:
    {json.dumps(context['candidates'], indent=2)}
    
    INSTRUCTIONS:
    1. If the 'distance' of the top candidate is > 0.6 and no graph matches exist, gap_detected = true.
    2. Check for technical mismatches (e.g., if RBI requires 24/7 monitoring but policy says 'business hours').
    3. Return ONLY a JSON object.
    
    REQUIRED JSON STRUCTURE:
    {{
        "mapped_policy": "Policy Name",
        "department": "Owning Dept",
        "gap_detected": boolean,
        "mapping_confidence": 0.0-1.0,
        "reasoning": "Technical explanation"
    }}
    """

    try:
        # Targeting the 2026 Stable version
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.1
            }
        )
        
        return {
            "clause_id": context['clause_id'],
            "text": context['clause_text'],
            "mapping_data": json.loads(response.text),
            "retrieval_sources": context['retrieval_sources']
        }
        
    except Exception as e:
        return {
            "clause_id": context['clause_id'],
            "error": "LLM Mapping Failed",
            "details": str(e)
        }