import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Authenticate user
    const user = await authenticateUser(email, password);
    
    // Return success response
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle authentication errors
    if (error.message === 'User not found' || error.message === 'Invalid password') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}