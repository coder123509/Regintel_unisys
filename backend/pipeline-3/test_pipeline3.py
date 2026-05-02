import requests
import json
import time

BASE_URL = "http://localhost:8003"
DOC_ID = "test_doc_001"

def test_pipeline_3():
    print("Testing /risk/analyze ...")
    resp_analyze = requests.post(f"{BASE_URL}/risk/analyze", json={"doc_id": DOC_ID})
    print("Status:", resp_analyze.status_code)
    try:
        print("Response:", json.dumps(resp_analyze.json(), indent=2))
    except Exception as e:
        print("Error parsing JSON:", e)

    print("\nTesting /actions/generate ...")
    resp_actions = requests.post(f"{BASE_URL}/actions/generate", json={"doc_id": DOC_ID})
    print("Status:", resp_actions.status_code)
    try:
        print("Response:", json.dumps(resp_actions.json(), indent=2))
    except Exception as e:
        print("Error parsing JSON:", e)

    print("\nTesting /dashboard/{doc_id} ...")
    resp_dash = requests.get(f"{BASE_URL}/dashboard/{DOC_ID}")
    print("Status:", resp_dash.status_code)
    try:
        print("Response:", json.dumps(resp_dash.json(), indent=2))
    except Exception as e:
        print("Error parsing JSON:", e)

if __name__ == "__main__":
    test_pipeline_3()
