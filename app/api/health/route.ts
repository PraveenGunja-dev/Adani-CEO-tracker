import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the connection by making a request to the API health endpoint through the proxy
    const response = await fetch('http://localhost:8004/health');
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'ok',
        message: 'API connection successful',
        apiStatus: data,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'API health check failed',
        apiStatus: response.status
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API connection error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Internal server error'
    }, { status: 500 });
  }
}