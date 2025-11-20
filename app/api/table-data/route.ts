import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

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
    
    // Call FastAPI backend to get table data
    const response = await fetch(`${API_BASE_URL}/table-data?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to get table data' },
        { status: response.status }
      );
    }
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
    
    if (!fiscalYear) {
      return NextResponse.json(
        { error: 'fiscalYear is required' },
        { status: 400 }
      );
    }
    
    // Validate data structure
    if (!Array.isArray(data)) {
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
        return NextResponse.json(
          { error: `Invalid data at row ${i + 1}: ${validationError}` },
          { status: 400 }
        );
      }
    }
    
    // Call FastAPI backend to save table data
    const response = await fetch(`${API_BASE_URL}/table-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fiscalYear, data }),
    });

    const responseData = await response.json();

    if (response.ok) {
      return NextResponse.json(responseData, { status: 200 });
    } else {
      return NextResponse.json(
        { error: responseData.detail || 'Failed to save table data' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error saving table data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/table-data?fiscalYear=xxx - Delete table data for a specific fiscal year
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
    
    // Call FastAPI backend to delete table data
    const response = await fetch(`${API_BASE_URL}/table-data?fiscalYear=${encodeURIComponent(fiscalYear)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.detail || 'Failed to delete table data' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('Error deleting table data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}