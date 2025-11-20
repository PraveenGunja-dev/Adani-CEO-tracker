import requests
import json

# Test the complete frontend data flow
def test_frontend_display():
    print("Testing frontend data display flow...")
    
    # 1. First, save some test data
    test_data = {
        "fiscalYear": "FY_25",
        "groups": ["AGEL", "ACL", "FrontendTestGroup1", "FrontendTestGroup2"],
        "ppaMerchants": ["PPA", "Merchant", "FrontendTestMerchant"],
        "types": ["Solar", "Wind", "Hybrid", "FrontendTestType"],
        "locationCodes": ["Khavda", "RJ", "FrontendTestCode"],
        "locations": ["Khavda", "Baap", "Essel", "FrontendTestLocation"],
        "connectivities": ["CTU", "FrontendTestConnect"]
    }
    
    print("\n1. Saving test data...")
    save_response = requests.post(
        "http://localhost:8005/dropdown-options",
        json=test_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"Save status: {save_response.status_code}")
    
    # 2. Then retrieve the data
    print("\n2. Retrieving data...")
    get_response = requests.get("http://localhost:8005/dropdown-options?fiscalYear=FY_25")
    print(f"Get status: {get_response.status_code}")
    
    if get_response.status_code == 200:
        data = get_response.json()
        print("\n3. Retrieved data:")
        for category, options in data.items():
            if isinstance(options, list):
                print(f"  {category}: {options}")
            else:
                print(f"  {category}: {options}")
        
        # 4. Verify specific categories
        print("\n4. Verification:")
        if "groups" in data and len(data["groups"]) > 0:
            print(f"✓ Groups found: {len(data['groups'])} items")
            print(f"  Groups: {data['groups']}")
        else:
            print("✗ No groups found")
            
        if "ppaMerchants" in data and len(data["ppaMerchants"]) > 0:
            print(f"✓ PPA Merchants found: {len(data['ppaMerchants'])} items")
        else:
            print("✗ No PPA Merchants found")
            
        # 5. Check if our test data is present
        print("\n5. Test data verification:")
        test_groups_present = all(group in data.get("groups", []) for group in ["FrontendTestGroup1", "FrontendTestGroup2"])
        if test_groups_present:
            print("✓ All test groups are present in the retrieved data")
        else:
            print("✗ Some test groups are missing from the retrieved data")
            
        test_merchants_present = "FrontendTestMerchant" in data.get("ppaMerchants", [])
        if test_merchants_present:
            print("✓ Test merchant is present in the retrieved data")
        else:
            print("✗ Test merchant is missing from the retrieved data")
    else:
        print(f"Error retrieving data: {get_response.text}")

if __name__ == "__main__":
    test_frontend_display()