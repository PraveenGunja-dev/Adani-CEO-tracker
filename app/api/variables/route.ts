import { NextResponse } from 'next/server';
import { setVariable, getVariable, getAllVariables, deleteVariable } from '@/lib/variables';

// GET /api/variables?key=xxx - Get a specific variable
// GET /api/variables - Get all variables
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (key) {
      // Get specific variable
      const value = await getVariable(key);
      return NextResponse.json({ key, value }, { status: 200 });
    } else {
      // Get all variables
      const variables = await getAllVariables();
      return NextResponse.json({ variables }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error getting variables:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/variables - Set a variable
export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();
    
    // Validate input
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }
    
    // Set variable
    const result = await setVariable(key, value);
    
    return NextResponse.json({ key, value, result }, { status: 200 });
  } catch (error: any) {
    console.error('Error setting variable:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/variables?key=xxx - Delete a variable
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }
    
    // Delete variable
    const deleted = await deleteVariable(key);
    
    if (deleted) {
      return NextResponse.json({ message: 'Variable deleted' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Variable not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error deleting variable:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}