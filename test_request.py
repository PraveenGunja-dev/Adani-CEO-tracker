import requests

# Test with proper query parameter
response = requests.get("http://localhost:8004/table-data", params={"fiscalYear": "FY_23"})
print(f"Status: {response.status_code}")
print(f"Headers: {response.headers}")
print(f"Content: {response.text}")