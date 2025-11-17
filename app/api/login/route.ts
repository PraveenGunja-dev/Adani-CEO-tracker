import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

// Handle CORS preflight OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    // Authenticate user
    const user = await authenticateUser(email, password);
    
    // Return success response
    return NextResponse.json({ user }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle authentication errors
    if (error.message === 'User not found' || error.message === 'Invalid password') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}