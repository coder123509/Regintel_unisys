import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def generate_actions(clauses):
    if not GOOGLE_API_KEY:
        # Mock actions if no API key is provided
        return [
            "Update data policy to include encryption standards.",
            "Notify Compliance Team regarding unmapped gaps.",
            "Review deadlines for upcoming high-urgency clauses."
        ]

    prompt = "Analyze the following regulatory clauses and generate 3-5 actionable recommendations to fix the identified gaps. Return ONLY a JSON array of strings, where each string is an action.\n\n"
    has_gaps = False

    for c in clauses:
        mapping = c.get("mapping_data", {})
        if mapping.get("gap_detected"):
            has_gaps = True
            prompt += f"- Gap in {mapping.get('department', 'N/A')}: {c.get('text')} (Policy Check: {mapping.get('mapped_policy')} - {mapping.get('reasoning')})\n"

    if not has_gaps:
        return ["No critical gaps detected. Maintain current compliance posture."]

    try:
        model = genai.GenerativeModel("gemini-2.5-flash") # use local flash if available
        response = model.generate_content(prompt)

        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()

        return json.loads(text)
    except Exception as e:
        print(f"Error generating actions with LLM: {e}")
        return ["Conduct internal audit for detected gaps.", "Update relevant policies based on gap reasoning."]
