import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Client, Account } from 'appwrite';

const DEFAULT_TAVUS_API_KEY = '44c1cf65b56246f481740248920b892b';
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    console.log(`🎥 Checking Tavus video status for ID: ${params.videoId}`);
    
    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('appwrite-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user session with Appwrite
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setSession(sessionCookie.value);
    
    const account = new Account(client);
    
    try {
      await account.get();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get custom API key from header if provided
    const apiKey = request.headers.get('X-Tavus-API-Key') || DEFAULT_TAVUS_API_KEY;
    
    // Call Tavus API to check video status
    const tavusResponse = await fetch(`${TAVUS_BASE_URL}/videos/${params.videoId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!tavusResponse.ok) {
      const errorText = await tavusResponse.text();
      console.error('Tavus API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to check video status' },
        { status: tavusResponse.status }
      );
    }

    const videoData = await tavusResponse.json();
    return NextResponse.json(videoData);

  } catch (error: any) {
    console.error('Error checking Tavus video status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
