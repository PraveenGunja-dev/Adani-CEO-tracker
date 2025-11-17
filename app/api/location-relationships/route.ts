import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Define the structure for location relationships
interface LocationRelationship {
  location: string;
  locationCode: string;
}

// GET /api/location-relationships - Get all location relationships
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Get the location relationships document
    const relationshipsDoc = await db.collection('locationRelationships').findOne({});
    
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
    const relationships: LocationRelationship[] = await request.json();
    
    // Validate input
    if (!Array.isArray(relationships)) {
      return NextResponse.json(
        { error: 'Relationships data must be an array' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Update or insert the location relationships document
    const result = await db.collection('locationRelationships').findOneAndUpdate(
      {}, // Find any document (there should only be one)
      { $set: { relationships, updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
    
    if (result.value) {
      return NextResponse.json(relationships, { status: 200 });
    } else {
      return NextResponse.json(relationships, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error updating location relationships:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}