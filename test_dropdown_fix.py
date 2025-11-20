import requests
import json

# Test the dropdown options saving functionality
def test_dropdown_options():
    # Test data
    test_options = {
        "fiscalYear": "FY_25",
        "groups": ["AGEL", "ACL", "NewGroup"],
        "ppaMerchants": ["PPA", "Merchant", "NewMerchant"],
        "types": ["Solar", "Wind", "Hybrid", "NewType"],
        "locationCodes": ["Khavda", "RJ", "NewCode"],
        "locations": ["Khavda", "Baap", "Essel", "NewLocation"],
        "connectivities": ["CTU", "NewConnectivity"]
    }
    
    # Test saving dropdown options
    print("Testing saving dropdown options...")
    try:
        response = requests.post(
            "http://localhost:8005/dropdown-options",
            json=test_options,
            headers={"Content-Type": "application/json"}
        )
        print(f"Save response status: {response.status_code}")
        print(f"Save response data: {response.json()}")
    except Exception as e:
        print(f"Error saving dropdown options: {e}")
    
    # Test retrieving dropdown options
    print("\nTesting retrieving dropdown options...")
    try:
        response = requests.get(
            "http://localhost:8005/dropdown-options?fiscalYear=FY_25"
        )
        print(f"Get response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Groups: {data.get('groups', [])}")
            print(f"PPA Merchants: {data.get('ppaMerchants', [])}")
            print(f"Types: {data.get('types', [])}")
            print(f"Location Codes: {data.get('locationCodes', [])}")
            print(f"Locations: {data.get('locations', [])}")
            print(f"Connectivities: {data.get('connectivities', [])}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error retrieving dropdown options: {e}")

if __name__ == "__main__":
    test_dropdown_options()