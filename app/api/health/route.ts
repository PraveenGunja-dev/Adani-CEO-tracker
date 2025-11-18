import { NextResponse } from 'next/server';
import { db } from '@/lib/sqlite';

export async function GET() {
  try {
    // Test the connection by running a simple query
    const stmt = db.prepare('SELECT 1');
    const result = stmt.get();
    
    if (result) {
      return NextResponse.json({ 
        status: 'ok', 
        message: 'SQLite connection successful',
        timestamp: new Date().toISOString()
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'SQLite query failed'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('SQLite connection error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'Internal server error'
    }, { status: 500 });
  }
}