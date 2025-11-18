import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/sqlite-adapter';

// Define the structure for dropdown options
interface DropdownOptions {
  fiscalYear?: string;
  groups: string[];
  ppaMerchants: string[];
  types: string[];
  locationCodes: string[];
  locations: string[];
  connectivities: string[];
}

// GET /api/dropdown-options - Get all dropdown options
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25'; // Default to FY_25
    
    const { db } = await connectToDatabase();
    
    // Get the dropdown options document for the specific fiscal year
    const options = await db.collection('dropdownOptions').findOne({ fiscalYear });
    
    if (options) {
      // For SQLite implementation, options are already in the correct format
      return NextResponse.json(options, { status: 200 });
    } else {
      // Return default options if none exist
      const defaultOptions: Omit<DropdownOptions, 'fiscalYear'> = {
        groups: ['AGEL', 'ACL'],
        ppaMerchants: ['PPA', 'Merchant'],
        types: ['Solar', 'Wind', 'Hybrid'],
        locationCodes: ['Khavda', 'RJ'],
        locations: ['Khavda', 'Baap', 'Essel'],
        connectivities: ['CTU']
      };
      return NextResponse.json(defaultOptions, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error getting dropdown options:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/dropdown-options - Update dropdown options
export async function POST(request: Request) {
  try {
    const options: DropdownOptions = await request.json();
    const { fiscalYear = 'FY_25', ...dropdownOptions } = options;
    
    // Log the incoming options for debugging
    console.log('Received dropdown options:', options);
    
    // Validate input
    if (!options) {
      return NextResponse.json(
        { error: 'Options data is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Log database connection for debugging
    console.log('Connected to database');
    
    // Update or insert dropdown options for the specific fiscal year
    const result: any = await db.collection('dropdownOptions').updateOne(
      { fiscalYear },
      { 
        $set: { 
          fiscalYear,
          ...dropdownOptions,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    // Log update result for debugging
    console.log('Update result:', result);
    
    // Check if the operation was successful
    const success = (result.modifiedCount !== undefined && result.modifiedCount >= 0) || 
                   (result.upsertedCount !== undefined && result.upsertedCount >= 0);
    
    if (success) {
      return NextResponse.json(dropdownOptions, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Failed to update dropdown options' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating dropdown options:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}