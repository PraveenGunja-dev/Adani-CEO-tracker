import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/api-adapter';

// Define the structure for location relationships
interface LocationRelationship {
  location: string;
  locationCode: string;
}

// Define the structure for the location relationships document
interface LocationRelationshipsDocument {
  fiscalYear: string;
  relationships: LocationRelationship[];
}

// GET /api/location-relationships - Get all location relationships
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25'; // Default to FY_25
    
    const { db } = await connectToDatabase();
    
    // Get the location relationships document for the specific fiscal year
    const relationshipsDoc = await db.collection('locationRelationships').findOne({ fiscalYear }) as LocationRelationshipsDocument | null;
    
    if (relationshipsDoc && relationshipsDoc.relationships) {
      return NextResponse.json(relationshipsDoc.relationships, { status: 200 });
    } else {
      // Return default relationships if none exist
      const defaultRelationships: LocationRelationship[] = [
        { location: 'Khavda', locationCode: 'Khavda' },
        { location: 'Baap', locationCode: 'RJ' },
        { location: 'Essel', locationCode: 'RJ' }
      ];
      return NextResponse.json(defaultRelationships, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error getting location relationships:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/location-relationships - Update location relationships
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25'; // Default to FY_25
    
    const relationships: LocationRelationship[] = await request.json();
    
    // Validate input
    if (!Array.isArray(relationships)) {
      return NextResponse.json(
        { error: 'Relationships data must be an array' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Update or insert the location relationships document for the specific fiscal year
    const result = await db.collection('locationRelationships').updateOne(
      { fiscalYear },
      { $set: { fiscalYear, relationships, updatedAt: new Date() } },
      { upsert: true }
    );
    
    return NextResponse.json(relationships, { status: 200 });
  } catch (error: any) {
    console.error('Error updating location relationships:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}