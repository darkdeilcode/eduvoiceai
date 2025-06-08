import { NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_1f2c936d9be3065a0afc78860ea29b99cded8d051080678a';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Public health check endpoint (no authentication required)
export async function GET() {
  try {
    // Simple health check for ElevenLabs API
    const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (response.ok) {
      return NextResponse.json({ 
        status: 'healthy', 
        service: 'elevenlabs',
        available: true 
      });
    } else {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          service: 'elevenlabs',
          available: false 
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        service: 'elevenlabs', 
        available: false,
        error: 'Connection failed' 
      },
      { status: 503 }
    );
  }
}