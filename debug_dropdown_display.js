// Debug script to check why dropdown options are not displaying in MasterDataTable
// This script simulates the data loading and display logic

console.log("Debugging MasterDataTable dropdown display issue...");

// Mock the fetch function to simulate API responses
const originalFetch = window.fetch;

window.fetch = function(url, options) {
  console.log('API call:', url, options?.method || 'GET');
  
  if (url.includes('/api/dropdown-options') && !options?.method) {
    // Simulate loading dropdown options
    console.log('Simulating dropdown options load');
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        fiscalYear: 'FY_25',
        groups: ['AGEL', 'ACL', 'TestGroup1', 'TestGroup2'],
        ppaMerchants: ['PPA', 'Merchant', 'TestMerchant'],
        types: ['Solar', 'Wind', 'Hybrid', 'TestType'],
        locationCodes: ['Khavda', 'RJ', 'TestCode'],
        locations: ['Khavda', 'Baap', 'Essel', 'TestLocation'],
        connectivities: ['CTU', 'TestConnect']
      })
    });
  }
  
  if (url.includes('/api/location-relationships') && !options?.method) {
    // Simulate loading location relationships
    console.log('Simulating location relationships load');
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([
        { location: 'Khavda', locationCode: 'Khavda' },
        { location: 'Baap', locationCode: 'RJ' },
        { location: 'TestLocation', locationCode: 'TestCode' }
      ])
    });
  }
  
  // Default response
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({})
  });
};

// Simulate the MasterDataTable component state and loading
async function simulateMasterDataTable() {
  console.log("\n--- Simulating MasterDataTable Component ---");
  
  // Initial state (similar to what's in the component)
  let dropdownOptions = {
    groups: ['AGEL', 'ACL'],
    ppaMerchants: ['PPA', 'Merchant'],
    types: ['Solar', 'Wind', 'Hybrid'],
    locationCodes: ['Khavda', 'RJ'],
    locations: ['Khavda', 'Baap', 'Essel'],
    connectivities: ['CTU']
  };
  
  let fiscalYear = 'FY_25';
  let isInitialLoad = true;
  
  console.log('Initial dropdown options state:', dropdownOptions);
  
  // Simulate the loadMasterData useEffect
  console.log("\n1. Simulating loadMasterData useEffect...");
  try {
    // Load dropdown options
    console.log('Fetching dropdown options for fiscalYear:', fiscalYear);
    const response = await fetch(`/api/dropdown-options?fiscalYear=${fiscalYear}`);
    if (response.ok) {
      const options = await response.json();
      console.log('Received options from API:', options);
      
      // Update state (similar to setDropdownOptions)
      dropdownOptions = {
        groups: Array.isArray(options.groups) ? options.groups : ['AGEL', 'ACL'],
        ppaMerchants: Array.isArray(options.ppaMerchants) ? options.ppaMerchants : ['PPA', 'Merchant'],
        types: Array.isArray(options.types) ? options.types : ['Solar', 'Wind', 'Hybrid'],
        locationCodes: Array.isArray(options.locationCodes) ? options.locationCodes : ['Khavda', 'RJ'],
        locations: Array.isArray(options.locations) ? options.locations : ['Khavda', 'Baap', 'Essel'],
        connectivities: Array.isArray(options.connectivities) ? options.connectivities : ['CTU']
      };
      
      console.log('Updated dropdownOptions state:', dropdownOptions);
    } else {
      console.error('Failed to load dropdown options');
    }
  } catch (error) {
    console.error('Error loading master data:', error.message || error);
  }
  
  // Simulate rendering the dropdown options display
  console.log("\n2. Simulating dropdown options display...");
  console.log("Dropdown Options Management Section:");
  
  // This is similar to the Object.entries(dropdownOptions).map in the component
  Object.entries(dropdownOptions).forEach(([category, options]) => {
    console.log(`  ${category}:`);
    if (Array.isArray(options) && options.length > 0) {
      options.forEach((option, index) => {
        console.log(`    ${index + 1}. ${option}`);
      });
    } else {
      console.log("    No options available");
    }
  });
  
  // Check if the data is being displayed correctly
  console.log("\n3. Verification:");
  const allCategoriesHaveData = Object.values(dropdownOptions).every(options => 
    Array.isArray(options) && options.length > 0
  );
  
  if (allCategoriesHaveData) {
    console.log("✓ All dropdown categories have data");
    console.log("✓ Data should be displaying correctly in the UI");
  } else {
    console.log("✗ Some categories are missing data");
    Object.entries(dropdownOptions).forEach(([category, options]) => {
      if (!Array.isArray(options) || options.length === 0) {
        console.log(`✗ ${category} has no data`);
      }
    });
  }
  
  // Check specifically for groups
  if (dropdownOptions.groups && dropdownOptions.groups.length > 0) {
    console.log("✓ Groups data is present:", dropdownOptions.groups);
  } else {
    console.log("✗ Groups data is missing or empty");
  }
  
  console.log("\n--- Debug Summary ---");
  console.log("If the data is showing in this simulation but not in the UI, the issue might be:");
  console.log("1. The component is not re-rendering after data loads");
  console.log("2. There's a CSS issue hiding the content");
  console.log("3. The data is loading but the component state isn't updating properly");
  console.log("4. There's an error in the browser console that's preventing display");
}

// Run the simulation
simulateMasterDataTable().then(() => {
  // Restore original fetch
  window.fetch = originalFetch;
  console.log("\nDebug script completed.");
});