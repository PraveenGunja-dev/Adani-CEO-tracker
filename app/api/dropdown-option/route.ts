import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/api-adapter';

// POST /api/dropdown-option - Add a single dropdown option
export async function POST(request: Request) {
  try {
    const { fiscalYear = 'FY_25', optionType, optionValue } = await request.json();
    
    // Log the incoming option for debugging
    console.log('Received dropdown option:', { fiscalYear, optionType, optionValue });
    
    // Validate input
    if (!optionType || !optionValue) {
      return NextResponse.json(
        { error: 'Option type and value are required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Log database connection for debugging
    console.log('Connected to database');
    
    // First, get the existing options for this fiscal year
    const existingOptions = await db.collection('dropdownOptions').findOne({ fiscalYear });
    
    // Create an updated options object with all option types
    const updatedOptions: any = existingOptions ? { ...existingOptions } : {
      groups: [],
      ppaMerchants: [],
      types: [],
      locationCodes: [],
      locations: [],
      connectivities: []
    };
    
    // Add the new option to the appropriate array if it doesn't already exist
    if (Array.isArray(updatedOptions[optionType]) && !updatedOptions[optionType].includes(optionValue)) {
      updatedOptions[optionType].push(optionValue);
    }
    
    // Update all dropdown options in the database using the MongoDB-like interface
    // This is the correct way to update dropdown options - we need to send all options together
    const result = await db.collection('dropdownOptions').updateOne(
      { fiscalYear },
      { 
        $set: { 
          fiscalYear,
          groups: updatedOptions.groups,
          ppaMerchants: updatedOptions.ppaMerchants,
          types: updatedOptions.types,
          locationCodes: updatedOptions.locationCodes,
          locations: updatedOptions.locations,
          connectivities: updatedOptions.connectivities
        }
      },
      { upsert: true }
    );
    
    // Log update result for debugging
    console.log('Update result:', result);
    
    return NextResponse.json({ 
      success: true, 
      optionType, 
      optionValue,
      message: 'Option added successfully'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error adding dropdown option:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}