import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Client, Account } from 'appwrite';

const DEFAULT_TAVUS_API_KEY = '44c1cf65b56246f481740248920b892b';
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

export async function POST(request: NextRequest) {
  try {
    console.log('🎥 Tavus video creation API called');
    
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

    // Parse request body
    const { 
      script, 
      replica_id, 
      api_key, 
      background_url,
      voice_settings 
    } = await request.json();

    console.log('Tavus video request:', {
      replicaId: replica_id,
      scriptLength: script?.length,
      hasCustomApiKey: !!api_key,
      hasBackgroundUrl: !!background_url,
    });

    if (!script || typeof script !== 'string') {
      return NextResponse.json(
        { error: 'Script is required and must be a string' },
        { status: 400 }
      );
    }

    if (script.length > 2000) {
      return NextResponse.json(
        { error: 'Script too long. Maximum 2000 characters allowed.' },
        { status: 400 }
      );
    }

    // Use user's API key if provided, otherwise use default
    const tavusApiKey = api_key || DEFAULT_TAVUS_API_KEY;

    // Prepare request body for Tavus API
    const requestBody = {
      replica_id: replica_id || 're8e740a42', // Use default replica ID if none provided
      script: script.trim(),
      ...(background_url && { background_url }),
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
        ...voice_settings,
      },
    };

    console.log('🎥 Calling Tavus API with request:', {
      replica_id: requestBody.replica_id,
      script_length: requestBody.script.length,
      api_key_present: !!tavusApiKey
    });

    // Call Tavus API
    const tavusResponse = await fetch(`${TAVUS_BASE_URL}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!tavusResponse.ok) {
      const errorText = await tavusResponse.text();
      console.error('❌ Tavus API error:', {
        status: tavusResponse.status,
        statusText: tavusResponse.statusText,
        error: errorText
      });
      return NextResponse.json(
        { error: `Tavus API error: ${tavusResponse.statusText}`, details: errorText },
        { status: tavusResponse.status }
      );
    }

    const videoData = await tavusResponse.json();
    
    console.log('✅ Tavus video created successfully:', {
      video_id: videoData.video_id,
      status: videoData.status
    });
    
    // Return video data
    return NextResponse.json({
      video_id: videoData.video_id,
      video_url: videoData.video_url,
      status: videoData.status,
    });

  } catch (error) {
    console.error('Tavus video creation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get video status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('video_id');
    const apiKey = searchParams.get('api_key');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

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

    const tavusApiKey = apiKey || DEFAULT_TAVUS_API_KEY;

    const response = await fetch(`${TAVUS_BASE_URL}/videos/${videoId}`, {
      headers: {
        'x-api-key': tavusApiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavus API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get video status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      video_id: data.video_id,
      video_url: data.video_url,
      status: data.status,
    });

  } catch (error) {
    console.error('Tavus video status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
