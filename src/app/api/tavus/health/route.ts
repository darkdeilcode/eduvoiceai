import { NextResponse } from 'next/server';

const DEFAULT_TAVUS_API_KEY = '44c1cf65b56246f481740248920b892b';
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

// Public health check endpoint (no authentication required)
export async function GET() {
  try {
    // Simple health check for Tavus API
    const response = await fetch(`${TAVUS_BASE_URL}/replicas`, {
      method: 'HEAD',
      headers: {
        'x-api-key': DEFAULT_TAVUS_API_KEY,
      },
    });

    if (response.ok) {
      return NextResponse.json({ 
        status: 'healthy', 
        service: 'tavus',
        available: true 
      });
    } else {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          service: 'tavus',
          available: false 
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        service: 'tavus', 
        available: false,
        error: 'Connection failed' 
      },
      { status: 503 }
    );
  }
}
