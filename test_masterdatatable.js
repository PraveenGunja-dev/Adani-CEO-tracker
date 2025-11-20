// Test script for MasterDataTable component
// This would typically be run in a browser console or as part of a testing framework

// Mock fetch function to test API calls
const mockFetch = (url, options) => {
  console.log('Fetch called with:', url, options);
  
  // Mock response based on the URL
  if (url.includes('/api/dropdown-options') && options.method === 'POST') {
    const body = JSON.parse(options.body);
    console.log('Saving dropdown options:', body);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({...body, message: 'Options saved successfully'})
    });
  }
  
  if (url.includes('/api/location-relationships') && options.method === 'POST') {
    const body = JSON.parse(options.body);
    console.log('Saving location relationships:', body);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body)
    });
  }
  
  if (url.includes('/api/dropdown-options') && !options.method) {
    console.log('Loading dropdown options for fiscal year');
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        groups: ['AGEL', 'ACL'],
        ppaMerchants: ['PPA', 'Merchant'],
        types: ['Solar', 'Wind', 'Hybrid'],
        locationCodes: ['Khavda', 'RJ'],
        locations: ['Khavda', 'Baap', 'Essel'],
        connectivities: ['CTU']
      })
    });
  }
  
  if (url.includes('/api/location-relationships') && !options.method) {
    console.log('Loading location relationships for fiscal year');
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { location: 'Khavda', locationCode: 'Khavda' },
        { location: 'Baap', locationCode: 'RJ' },
        { location: 'Essel', locationCode: 'RJ' }
      ])
    });
  }
  
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
};

// Test the MasterDataTable component functions
async function testMasterDataTable() {
  console.log('Testing MasterDataTable component...');
  
  // Mock the fetch function
  const originalFetch = window.fetch;
  window.fetch = mockFetch;
  
  try {
    // Test saving dropdown options
    const dropdownOptions = {
      groups: ['AGEL', 'ACL', 'NewGroup'],
      ppaMerchants: ['PPA', 'Merchant'],
      types: ['Solar', 'Wind', 'Hybrid'],
      locationCodes: ['Khavda', 'RJ'],
      locations: ['Khavda', 'Baap', 'Essel'],
      connectivities: ['CTU']
    };
    
    const fiscalYear = 'FY_25';
    
    // Simulate the saveMasterData function from MasterDataTable
    const saveMasterData = async () => {
      try {
        // Save dropdown options with proper structure
        const dropdownOptionsToSave = {
          fiscalYear,
          groups: dropdownOptions.groups,
          ppaMerchants: dropdownOptions.ppaMerchants,
          types: dropdownOptions.types,
          locationCodes: dropdownOptions.locationCodes,
          locations: dropdownOptions.locations,
          connectivities: dropdownOptions.connectivities
        };

        const response = await fetch(`/api/dropdown-options`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dropdownOptionsToSave),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to save dropdown options:', response.status, response.statusText, errorText);
        }

        // Save location relationships (mock data)
        const locationRelationships = [
          { location: 'Khavda', locationCode: 'Khavda' },
          { location: 'Baap', locationCode: 'RJ' }
        ];
        
        const relResponse = await fetch(`/api/location-relationships?fiscalYear=${fiscalYear}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(locationRelationships),
        });

        if (!relResponse.ok) {
          const errorText = await relResponse.text();
          console.error('Failed to save location relationships:', relResponse.status, relResponse.statusText, errorText);
        }
        
        console.log('Master data saved successfully');
      } catch (error) {
        console.error('Error saving master data:', error.message || error);
      }
    };
    
    // Run the test
    await saveMasterData();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Restore original fetch
    window.fetch = originalFetch;
  }
}

// Run the test
testMasterDataTable();