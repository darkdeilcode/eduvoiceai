import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Query } from 'node-appwrite';
import { 
  databases, 
  clientInitialized, 
  initializationError,
  APPWRITE_DATABASE_ID, 
  LANGUAGE_TESTS_COLLECTION_ID
} from '@/lib/appwrite.node';
import type { LanguageTestReport } from '@/types/languageTest';

export async function GET(request: NextRequest) {
  try {
    // Check if Appwrite client is initialized
    if (!clientInitialized) {
      console.error("API /language-test/history: Appwrite client not initialized:", initializationError);
      return NextResponse.json(
        { error: 'Server configuration error', details: initializationError },
        { status: 500 }
      );
    }

    // Get session cookie
    const cookieStore = cookies();
    const sessionCookie = (await cookieStore).get('appwrite-session');
    
    if (!sessionCookie) {
      console.error("API /language-test/history: No session cookie found");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching language test history for user:', userId);

    // Fetch completed language tests for the user
    const query = [
      Query.equal('userId', userId),
      Query.equal('status', 'completed'),
      Query.orderDesc('endTime'),
      Query.limit(limit),
      Query.offset(offset)
    ];

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      LANGUAGE_TESTS_COLLECTION_ID,
      query
    );

    console.log(`✅ Found ${response.documents.length} completed language tests`);

    // Parse and format the test history
    const testHistory = response.documents.map((doc: any) => {
      let report: LanguageTestReport | null = null;
      
      try {
        // Try to parse the report from the stored JSON
        if (doc.report) {
          report = JSON.parse(doc.report);
        }
      } catch (error) {
        console.warn('Could not parse report for test:', doc.$id, error);
      }

      // Extract conversation ID from multiple sources and parse cviResponse
      let conversationId = doc.conversation_id;
      let cviResponse = null;
      
      if (doc.cviResponse) {
        try {
          cviResponse = JSON.parse(doc.cviResponse);
          if (!conversationId && cviResponse.conversation_id) {
            conversationId = cviResponse.conversation_id;
          }
        } catch (error) {
          console.warn('Could not parse cviResponse:', error);
        }
      }

      return {
        id: doc.$id,
        userId: doc.userId,
        language: doc.language,
        languageCode: doc.languageCode,
        difficulty: doc.difficulty,
        testType: doc.testType || 'speaking',
        status: doc.status,
        startTime: doc.startTime,
        endTime: doc.endTime,
        conversationId,
        cviResponse, // Include the full CVI response data
        report,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
        // Include basic test results if report is available
        overallScore: report?.overallScore,
        cefrLevel: report?.cefrLevel,
        isPassed: report?.isPassed,
        testDuration: report?.testDuration
      };
    });

    const result = {
      success: true,
      history: testHistory,
      total: response.total,
      hasMore: (offset + response.documents.length) < response.total
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching language test history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch language test history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
