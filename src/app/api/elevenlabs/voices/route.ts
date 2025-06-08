import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Client, Account } from 'appwrite';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_1f2c936d9be3065a0afc78860ea29b99cded8d051080678a';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export async function GET(request: NextRequest) {
  try {
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

    // Call ElevenLabs API to get voices
    const elevenLabsResponse = await fetch(
      `${ELEVENLABS_BASE_URL}/voices`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch voices' },
        { status: elevenLabsResponse.status }
      );
    }

    const voicesData = await elevenLabsResponse.json();
    
    // Filter and format voices for easier use
    const formattedVoices = voicesData.voices?.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description,
      preview_url: voice.preview_url,
      available_for_tiers: voice.available_for_tiers,
      settings: voice.settings,
    })) || [];

    return NextResponse.json({
      voices: formattedVoices,
      total: formattedVoices.length,
    });

  } catch (error) {
    console.error('Voices API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}