import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define the structure for dropdown options
interface DropdownOptions {
  groups: string[];
  ppaMerchants: string[];
  types: string[];
  locationCodes: string[];
  locations: string[];
  connectivities: string[];
}

// GET /api/dropdown-options - Get all dropdown options
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Get the dropdown options document
    const options = await db.collection('dropdownOptions').findOne({});
    
    if (options) {
      // Remove MongoDB _id field before returning
      const { _id, ...optionsWithoutId } = options;
      return NextResponse.json(optionsWithoutId, { status: 200 });
    } else {
      // Return default options if none exist
      const defaultOptions: DropdownOptions = {
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
    
    // First, try to find an existing document
    const existingDoc = await db.collection('dropdownOptions').findOne({});
    
    // Log existing document for debugging
    console.log('Existing document:', existingDoc);
    
    if (existingDoc) {
      // Update existing document
      const result = await db.collection('dropdownOptions').updateOne(
        { _id: existingDoc._id },
        { $set: { ...options, updatedAt: new Date() } }
      );
      
      // Log update result for debugging
      console.log('Update result:', result);
      
      if (result.modifiedCount > 0) {
        return NextResponse.json(options, { status: 200 });
      } else {
        return NextResponse.json(
          { error: 'Failed to update dropdown options' },
          { status: 500 }
        );
      }
    } else {
      // Insert new document
      const newDoc = {
        ...options,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Log new document for debugging
      console.log('New document to insert:', newDoc);
      
      const result = await db.collection('dropdownOptions').insertOne(newDoc);
      
      // Log insert result for debugging
      console.log('Insert result:', result);
      
      if (result.insertedId) {
        return NextResponse.json(options, { status: 200 });
      } else {
        return NextResponse.json(
          { error: 'Failed to insert dropdown options' },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error updating dropdown options:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}