// Test script to simulate what the frontend API route is doing
const API_BASE_URL = 'http://localhost:8005';

async function testPpaMerchants() {
  const fiscalYear = 'FY_25';
  const ppaMerchants = ["PPA", "Merchant", "TestMerchant"];
  
  console.log('Testing ppaMerchants endpoint');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Fiscal year:', fiscalYear);
  console.log('ppaMerchants:', ppaMerchants);
  
  try {
    const response = await fetch(`${API_BASE_URL}/dropdown-options/ppa-merchants?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ppaMerchants),
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('Success!');
    } else {
      console.log('Error from backend:', data);
    }
  } catch (error) {
    console.error('Error making request:', error);
  }
}

testPpaMerchants();