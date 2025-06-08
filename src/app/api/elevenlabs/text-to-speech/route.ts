import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Client, Account } from 'appwrite';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_1f2c936d9be3065a0afc78860ea29b99cded8d051080678a';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = '2qfp6zPuviqeCOZIE9RZ'; // Adam voice

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 TTS API called with new voice configuration');
    
    // TEMPORARILY BYPASS AUTHENTICATION FOR VOICE TESTING
    console.log('⚠️ AUTHENTICATION TEMPORARILY BYPASSED FOR TESTING');
    
    // Get session cookie
    // const cookieStore = await cookies();
    // const sessionCookie = cookieStore.get('appwrite-session');
    
    // console.log('🍪 Session cookie check:', {
    //   found: !!sessionCookie,
    //   value: sessionCookie?.value ? 'exists' : 'missing'
    // });
    
    // if (!sessionCookie) {
    //   console.log('❌ No session cookie found, authentication required');
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    // // Verify user session with Appwrite
    // const client = new Client()
    //   .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    //   .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    //   .setSession(sessionCookie.value);
    
    // const account = new Account(client);
    
    // try {
    //   const user = await account.get();
    //   console.log('✅ User authenticated successfully:', user.$id);
    // } catch (error) {
    //   console.log('❌ Session validation failed:', error);
    //   return NextResponse.json(
    //     { error: 'Invalid session' },
    //     { status: 401 }
    //   );
    // }

    // Parse request body
    const { text, voice_id = DEFAULT_VOICE_ID, model_id = 'eleven_monolingual_v1' } = await request.json();

    console.log('TTS API route called with:', {
      voice_id,
      model_id,
      textLength: text?.length,
      defaultVoiceId: DEFAULT_VOICE_ID
    });

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters allowed.' },
        { status: 400 }
      );
    }

    // Call ElevenLabs API
    const elevenLabsResponse = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voice_id}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: elevenLabsResponse.status }
      );
    }

    // Get audio data
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    
    // Return audio response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable caching to ensure fresh audio
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Text-to-speech API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Simple health check for ElevenLabs API
    const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (response.ok) {
      return NextResponse.json({ status: 'healthy', service: 'elevenlabs' });
    } else {
      return NextResponse.json(
        { status: 'unhealthy', service: 'elevenlabs' },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', service: 'elevenlabs', error: 'Connection failed' },
      { status: 503 }
    );
  }
}