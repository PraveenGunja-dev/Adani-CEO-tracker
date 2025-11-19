import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/api-adapter';

// Validate table row structure
function validateTableRow(row: any): string | null {
  // Check required fields
  if (typeof row.id !== 'number' || row.id <= 0) {
    return 'Invalid or missing id';
  }
  
  if (typeof row.sno !== 'number' || row.sno <= 0) {
    return 'Invalid or missing sno';
  }
  
  if (typeof row.capacity !== 'number' || row.capacity < 0) {
    return 'Invalid capacity';
  }
  
  if (!row.group || typeof row.group !== 'string') {
    return 'Invalid or missing group';
  }
  
  if (!row.ppaMerchant || typeof row.ppaMerchant !== 'string') {
    return 'Invalid or missing ppaMerchant';
  }
  
  if (!row.type || typeof row.type !== 'string') {
    return 'Invalid or missing type';
  }
  
  if (row.solar !== null && typeof row.solar !== 'number') {
    return 'Invalid solar value';
  }
  
  if (row.wind !== null && typeof row.wind !== 'number') {
    return 'Invalid wind value';
  }
  
  if (typeof row.spv !== 'string') {
    return 'Invalid spv';
  }
  
  if (typeof row.locationCode !== 'string') {
    return 'Invalid locationCode';
  }
  
  if (typeof row.location !== 'string') {
    return 'Invalid location';
  }
  
  if (typeof row.pss !== 'string') {
    return 'Invalid pss';
  }
  
  if (typeof row.connectivity !== 'string') {
    return 'Invalid connectivity';
  }
  
  return null; // Valid row
}

// GET /api/table-data?fiscalYear=xxx - Get table data for a specific fiscal year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear');
    
    if (!fiscalYear) {
      return NextResponse.json(
        { error: 'fiscalYear is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const tableData = await db.collection('tableData').findOne({ fiscalYear });
    
    // Return empty array if no data found
    return NextResponse.json(
      { data: tableData ? tableData.data : [] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error getting table data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/table-data - Save table data for a specific fiscal year
export async function POST(request: Request) {
  try {
    const { fiscalYear, data } = await request.json();
    
    console.log(`Received POST request for fiscal year ${fiscalYear} with data:`, data);
    
    if (!fiscalYear) {
      return NextResponse.json(
        { error: 'fiscalYear is required' },
        { status: 400 }
      );
    }
    
    // Validate data structure
    if (!Array.isArray(data)) {
      console.error('Invalid data structure - not an array:', data);
      return NextResponse.json(
        { error: 'Data must be an array' },
        { status: 400 }
      );
    }
    
    // Validate each row in the data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const validationError = validateTableRow(row);
      if (validationError) {
        console.error(`Validation error at row ${i + 1}:`, validationError, row);
        return NextResponse.json(
          { error: `Invalid data at row ${i + 1}: ${validationError}` },
          { status: 400 }
        );
      }
    }
    
    console.log(`Data validation passed for fiscal year ${fiscalYear}`);
    
    const { db } = await connectToDatabase();
    
    // Upsert the table data
    const result = await db.collection('tableData').updateOne(
      { fiscalYear },
      { 
        $set: { 
          fiscalYear,
          data,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`Database update result for ${fiscalYear}:`, result);
    
    // Get the current version after the update
    const updatedRecord = await db.collection('tableData').findOne({ fiscalYear });
    const currentVersion = updatedRecord ? updatedRecord.version : 1;
    
    console.log(`Updated record for ${fiscalYear}:`, updatedRecord);
    
    return NextResponse.json(
      { message: 'Table data saved successfully', version: currentVersion },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error saving table data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/table-data?fiscalYear=xxx - Soft delete table data for a specific fiscal year
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear');
    
    if (!fiscalYear) {
      return NextResponse.json(
        { error: 'fiscalYear is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    // Soft delete - mark as deleted instead of removing
    const result = await db.collection('tableData').deleteOne({ fiscalYear });
    
    // For soft delete, we check deletedCount (which represents the number of records marked as deleted)
    if (result.deletedCount > 0) {
      return NextResponse.json(
        { message: 'Table data marked as deleted successfully' },
        { status: 200 }
      );
    } else {
      // If no records were marked as deleted, it might be because the record doesn't exist
      // Let's check if the record exists
      const existing = await db.collection('tableData').findOne({ fiscalYear });
      if (existing) {
        // Record exists but wasn't marked as deleted (might already be deleted)
        return NextResponse.json(
          { message: 'Table data already marked as deleted' },
          { status: 200 }
        );
      } else {
        // Record doesn't exist at all
        return NextResponse.json(
          { error: 'Table data not found' },
          { status: 404 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error deleting table data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}