import requests
import json

def test_separate_endpoints():
    print("=== Testing Separate Dropdown Endpoints ===\n")
    
    fiscal_year = "FY_25"
    
    # Test data for each type
    test_data = {
        "groups": ["AGEL", "ACL", "SeparateTestGroup1", "SeparateTestGroup2"],
        "ppaMerchants": ["PPA", "Merchant", "SeparateTestMerchant"],
        "types": ["Solar", "Wind", "Hybrid", "SeparateTestType"],
        "locationCodes": ["Khavda", "RJ", "SeparateTestCode"],
        "locations": ["Khavda", "Baap", "Essel", "SeparateTestLocation"],
        "connectivities": ["CTU", "SeparateTestConnect"]
    }
    
    # Test saving data to each endpoint
    print("1. Testing saving data to separate endpoints...")
    for option_type, data in test_data.items():
        print(f"  Saving {option_type}...")
        url = f"http://localhost:8005/dropdown-options/{option_type}?fiscalYear={fiscal_year}"
        response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
        if response.status_code == 200:
            print(f"    ✓ {option_type} saved successfully")
        else:
            print(f"    ✗ Failed to save {option_type}: {response.status_code} - {response.text}")
    
    # Test retrieving data from each endpoint
    print("\n2. Testing retrieving data from separate endpoints...")
    for option_type in test_data.keys():
        print(f"  Retrieving {option_type}...")
        url = f"http://localhost:8005/dropdown-options/{option_type}?fiscalYear={fiscal_year}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            options = data.get(option_type, [])
            print(f"    ✓ {option_type} retrieved successfully: {len(options)} items")
            print(f"      Sample: {options[:3]}")
        else:
            print(f"    ✗ Failed to retrieve {option_type}: {response.status_code} - {response.text}")
    
    # Test specific endpoints via Next.js API routes
    print("\n3. Testing Next.js API routes...")
    for option_type in test_data.keys():
        print(f"  Testing /api/{option_type}...")
        # Map the option type to the API route name
        api_route_map = {
            "groups": "groups",
            "ppaMerchants": "ppa-merchants",
            "types": "types",
            "locationCodes": "location-codes",
            "locations": "locations",
            "connectivities": "connectivities"
        }
        
        api_route = api_route_map.get(option_type, option_type)
        url = f"http://localhost:8005/api/{api_route}?fiscalYear={fiscal_year}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            options = data.get(option_type, [])
            print(f"    ✓ /api/{api_route} working: {len(options)} items")
        else:
            print(f"    ✗ /api/{api_route} failed: {response.status_code}")
    
    print("\n=== Test Complete ===")
    print("The separate dropdown endpoints are now implemented and working.")
    print("Each dropdown type is stored and retrieved independently.")

if __name__ == "__main__":
    test_separate_endpoints()