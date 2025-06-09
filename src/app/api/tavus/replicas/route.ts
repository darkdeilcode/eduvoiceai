import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Client, Account } from 'appwrite';

const DEFAULT_TAVUS_API_KEY = '44c1cf65b56246f481740248920b892b';
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

export async function GET(request: NextRequest) {
  try {
    console.log('🎥 Tavus replicas API called');
    
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

    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('api_key');
    const tavusApiKey = apiKey || DEFAULT_TAVUS_API_KEY;

    // Call Tavus API to get replicas
    const response = await fetch(`${TAVUS_BASE_URL}/replicas`, {
      headers: {
        'x-api-key': tavusApiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavus API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch replicas' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      replicas: data.replicas || [],
    });

  } catch (error) {
    console.error('Tavus replicas API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
