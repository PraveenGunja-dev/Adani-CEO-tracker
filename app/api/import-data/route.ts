import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import exDataFY24 from '@/app/components/ex.json';
import exDataFY25 from '@/app/components/ex_fy25.json';
import exDataFY26 from '@/app/components/ex_fy26.json';
import exDataFY27 from '@/app/components/ex_fy27.json';
import exDataFY28 from '@/app/components/ex_fy28.json';

// Convert fiscal year data to table row format
const convertToTableRow = (item: any, index: number) => {
  // Handle different possible field names for PSS
  let pssValue = '';
  if (item["PSS"]) {
    pssValue = item["PSS"];
  } else if (item["PSS -"]) {
    pssValue = item["PSS -"];
  } else if (item["PSS-"]) {
    pssValue = item["PSS-"];
  }
  
  return {
    id: index + 1,
    sno: item["Sl No"] || index + 1,
    capacity: typeof item["Capacity"] === 'number' ? item["Capacity"] : 
              (typeof item["Capacity"] === 'string' && !isNaN(parseFloat(item["Capacity"])) ? parseFloat(item["Capacity"]) : null),
    group: item["Group"] || '',
    ppaMerchant: item["PPA/Merchant"] || '',
    type: item["Type"] || '',
    solar: typeof item["Solar"] === 'number' ? item["Solar"] : 
           (typeof item["Solar"] === 'string' && !isNaN(parseFloat(item["Solar"])) ? parseFloat(item["Solar"]) : null),
    wind: typeof item["Wind"] === 'number' ? item["Wind"] : 
          (typeof item["Wind"] === 'string' && !isNaN(parseFloat(item["Wind"])) ? parseFloat(item["Wind"]) : null),
    spv: item["SPV"] || '',
    locationCode: item["Location Code"] || '',
    location: item["Location"] || '',
    pss: pssValue || '',
    connectivity: item["Connectivity"] || ''
  };
};

// POST /api/import-data - Import all fiscal year data into the database
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    
    // Process each fiscal year
    const fiscalYears = [
      { name: 'FY_24', data: exDataFY24 },
      { name: 'FY_25', data: exDataFY25 },
      { name: 'FY_26', data: exDataFY26 },
      { name: 'FY_27', data: exDataFY27 },
      { name: 'FY_28', data: exDataFY28 }
    ];
    
    const results = [];
    
    for (const fy of fiscalYears) {
      // Convert data to table row format
      const convertedData = fy.data.map(convertToTableRow);
      
      // Skip if no data
      if (convertedData.length === 0) {
        results.push({ fiscalYear: fy.name, message: 'No data to import', count: 0 });
        continue;
      }
      
      // Insert data into database
      const result = await db.collection('tableData').updateOne(
        { fiscalYear: fy.name },
        { 
          $set: { 
            fiscalYear: fy.name,
            data: convertedData,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      
      results.push({ 
        fiscalYear: fy.name, 
        message: 'Data imported successfully', 
        count: convertedData.length,
        modifiedCount: result.modifiedCount
      });
    }
    
    return NextResponse.json(
      { message: 'All fiscal year data imported successfully', results },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}