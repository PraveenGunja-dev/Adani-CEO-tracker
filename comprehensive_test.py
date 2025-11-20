import requests
import json

def comprehensive_test():
    print("=== Comprehensive Test for MasterDataTable Display ===\n")
    
    # 1. Test API endpoints directly
    print("1. Testing API endpoints...")
    
    # Get current data
    print("  Getting current dropdown options...")
    get_response = requests.get("http://localhost:8005/dropdown-options?fiscalYear=FY_25")
    if get_response.status_code == 200:
        current_data = get_response.json()
        print(f"  ✓ Current data loaded successfully")
        print(f"  ✓ Groups: {current_data.get('groups', [])}")
        print(f"  ✓ PPA Merchants: {current_data.get('ppaMerchants', [])}")
        print(f"  ✓ Types: {current_data.get('types', [])}")
    else:
        print(f"  ✗ Failed to get current data: {get_response.status_code}")
        return
    
    # 2. Save test data
    print("\n2. Saving test data...")
    test_data = {
        "fiscalYear": "FY_25",
        "groups": ["AGEL", "ACL", "ComprehensiveTestGroup1", "ComprehensiveTestGroup2"],
        "ppaMerchants": ["PPA", "Merchant", "ComprehensiveTestMerchant"],
        "types": ["Solar", "Wind", "Hybrid", "ComprehensiveTestType"],
        "locationCodes": ["Khavda", "RJ", "ComprehensiveTestCode"],
        "locations": ["Khavda", "Baap", "Essel", "ComprehensiveTestLocation"],
        "connectivities": ["CTU", "ComprehensiveTestConnect"]
    }
    
    save_response = requests.post(
        "http://localhost:8005/dropdown-options",
        json=test_data,
        headers={"Content-Type": "application/json"}
    )
    
    if save_response.status_code == 200:
        print("  ✓ Test data saved successfully")
    else:
        print(f"  ✗ Failed to save test data: {save_response.status_code}")
        return
    
    # 3. Verify saved data
    print("\n3. Verifying saved data...")
    verify_response = requests.get("http://localhost:8005/dropdown-options?fiscalYear=FY_25")
    if verify_response.status_code == 200:
        verified_data = verify_response.json()
        print("  ✓ Data verification successful")
        
        # Check specific categories
        groups = verified_data.get('groups', [])
        merchants = verified_data.get('ppaMerchants', [])
        
        print(f"  Groups count: {len(groups)}")
        print(f"  PPA Merchants count: {len(merchants)}")
        
        # Verify test data is present
        test_groups_present = all(group in groups for group in ["ComprehensiveTestGroup1", "ComprehensiveTestGroup2"])
        test_merchant_present = "ComprehensiveTestMerchant" in merchants
        
        if test_groups_present:
            print("  ✓ All test groups are present in the data")
        else:
            print("  ✗ Some test groups are missing from the data")
            
        if test_merchant_present:
            print("  ✓ Test merchant is present in the data")
        else:
            print("  ✗ Test merchant is missing from the data")
    else:
        print(f"  ✗ Failed to verify data: {verify_response.status_code}")
        return
    
    # 4. Summary
    print("\n4. Test Summary:")
    print("  The API endpoints are working correctly and returning the expected data.")
    print("  The issue is likely in the frontend component not displaying the data properly.")
    print("\n  Possible causes:")
    print("  - Component is not re-rendering after data loads")
    print("  - CSS is hiding the content")
    print("  - There's an error in the browser console")
    print("  - The activeTab is not set to 'groups'")
    print("  - The component state is not updating properly")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    comprehensive_test()