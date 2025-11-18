import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/sqlite-adapter';

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
    
    // Insert the new option
    const stmt = db.prepare(
      'INSERT INTO dropdown_options (fiscal_year, option_type, option_value, version) VALUES (?, ?, ?, 1)'
    );
    const result = stmt.run(fiscalYear, optionType, optionValue);
    
    // Log insert result for debugging
    console.log('Insert result:', result);
    
    // Check if the operation was successful
    if (result.changes > 0) {
      return NextResponse.json({ 
        success: true, 
        optionType, 
        optionValue,
        message: 'Option added successfully'
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Failed to add dropdown option' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error adding dropdown option:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}