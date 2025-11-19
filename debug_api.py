import requests
import json

# Test health endpoint first
try:
    response = requests.get("http://localhost:8004/health")
    print(f"Health check - Status code: {response.status_code}")
    print(f"Health check - Response: {response.text}")
except Exception as e:
    print(f"Health check error: {e}")

# Test table-data endpoint with explicit parameters
try:
    response = requests.get("http://localhost:8004/table-data", params={"fiscalYear": "FY_23"})
    print(f"Table data - Status code: {response.status_code}")
    print(f"Table data - Response headers: {response.headers}")
    print(f"Table data - Response text: {response.text}")
except Exception as e:
    print(f"Table data error: {e}")
    import traceback
    traceback.print_exc()