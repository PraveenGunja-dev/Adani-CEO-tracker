import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

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
    
    return NextResponse.json(
      { message: 'Table data saved successfully' },
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
    
    const { db } = await connectToDatabase();
    const result = await db.collection('tableData').deleteOne({ fiscalYear });
    
    if (result.deletedCount > 0) {
      return NextResponse.json(
        { message: 'Table data deleted successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Table data not found' },
        { status: 404 }
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