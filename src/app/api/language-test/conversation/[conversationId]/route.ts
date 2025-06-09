import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TAVUS_API_BASE_URL = 'https://tavusapi.com/v2';
const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '44c1cf65b56246f481740248920b892b';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const sessionCookie = (await cookieStore).get('appwrite-session');
    
    if (!sessionCookie) {
      console.error("API /conversation: No session cookie found");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { conversationId } = params;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching conversation details from Tavus:', conversationId);

    // Fetch conversation details from Tavus API
    const response = await fetch(`${TAVUS_API_BASE_URL}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Tavus API error:', response.status, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch conversation details from Tavus' },
        { status: response.status }
      );
    }

    const conversationData = await response.json();
    
    console.log('✅ Successfully fetched conversation details:', conversationData);

    return NextResponse.json({
      success: true,
      conversation: conversationData
    });

  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversation details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
