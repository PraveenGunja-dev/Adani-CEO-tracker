import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Test the connection by running a simple command
    const stats = await db.command({ ping: 1 });
    
    if (stats.ok === 1) {
      return NextResponse.json({ 
        status: 'ok', 
        message: 'MongoDB connection successful',
        timestamp: new Date().toISOString()
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'MongoDB ping failed'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'Internal server error'
    }, { status: 500 });
  }
}