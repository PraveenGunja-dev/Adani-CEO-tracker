import requests
import json

# Test specifically for groups functionality
def test_groups():
    # Test data with focus on groups
    test_options = {
        "fiscalYear": "FY_25",
        "groups": ["AGEL", "ACL", "TestGroup1", "TestGroup2"],
        "ppaMerchants": ["PPA", "Merchant"],
        "types": ["Solar", "Wind", "Hybrid"],
        "locationCodes": ["Khavda", "RJ"],
        "locations": ["Khavda", "Baap", "Essel"],
        "connectivities": ["CTU"]
    }
    
    print("Testing groups saving...")
    try:
        # Save the options
        response = requests.post(
            "http://localhost:8005/dropdown-options",
            json=test_options,
            headers={"Content-Type": "application/json"}
        )
        print(f"Save response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Saved groups: {data.get('groups', [])}")
        else:
            print(f"Error saving: {response.text}")
    except Exception as e:
        print(f"Error saving groups: {e}")
    
    print("\nTesting groups retrieval...")
    try:
        # Retrieve the options
        response = requests.get(
            "http://localhost:8005/dropdown-options?fiscalYear=FY_25"
        )
        print(f"Get response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Retrieved groups: {data.get('groups', [])}")
            
            # Verify that our test groups are present
            groups = data.get('groups', [])
            if 'TestGroup1' in groups and 'TestGroup2' in groups:
                print("SUCCESS: Groups are being saved and retrieved correctly!")
            else:
                print("ERROR: Test groups not found in retrieved data")
        else:
            print(f"Error retrieving: {response.text}")
    except Exception as e:
        print(f"Error retrieving groups: {e}")

if __name__ == "__main__":
    test_groups()