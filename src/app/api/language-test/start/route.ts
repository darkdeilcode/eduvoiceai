import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  databases, 
  users,
  clientInitialized, 
  initializationError,
  APPWRITE_DATABASE_ID, 
  USERS_COLLECTION_ID,
  LANGUAGE_TESTS_COLLECTION_ID
} from '@/lib/appwrite.node';
import { ID } from 'node-appwrite';
import type { LanguageTestConfig, LanguageTestSession, SpeakingPrompt, TavusCVIConfig, TavusCVIResponse } from '@/types/languageTest';
import { createCVIConversation, generateConversationalContext } from '@/lib/tavus-cvi';

const LANGUAGE_TEST_TOKEN_COST = 10000;

export async function POST(request: NextRequest) {
  try {
    // Check if Appwrite client is initialized
    if (!clientInitialized) {
      console.error("API /language-test/start: Appwrite client not initialized:", initializationError);
      return NextResponse.json(
        { error: 'Server configuration error', details: initializationError },
        { status: 500 }
      );
    }

    // Get session cookie
    const cookieStore = cookies();
    const sessionCookie = (await cookieStore).get('appwrite-session');
    
    if (!sessionCookie) {
      console.error("API /language-test/start: No session cookie found");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const { config, tavusConfig, userId, cviOptions } = await request.json();

    if (!config || !config.language || !config.languageCode) {
      return NextResponse.json(
        { error: 'Invalid test configuration' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check user token balance and deduct tokens
    const tokenResponse = await fetch(`${request.nextUrl.origin}/api/user/deduct-tokens`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `appwrite-session=${sessionCookie.value}`
      },
      body: JSON.stringify({ 
        userId, 
        amountToDeduct: LANGUAGE_TEST_TOKEN_COST,
        description: `Language Test: ${config.language} (${config.difficulty})`
      }),
    });

    const tokenResult = await tokenResponse.json();

    if (!tokenResponse.ok) {
      if (tokenResponse.status === 402 && tokenResult.canSubscribe) {
        return NextResponse.json({
          error: 'Insufficient tokens',
          message: tokenResult.message || `You need ${LANGUAGE_TEST_TOKEN_COST} tokens for a language test.`,
          currentTokenBalance: tokenResult.currentTokenBalance || 0,
          canSubscribe: true
        }, { status: 402 });
      }
      
      return NextResponse.json({
        error: 'Token deduction failed',
        message: tokenResult.message || 'Unable to deduct tokens'
      }, { status: 400 });
    }

    console.log(`✅ Tokens deducted successfully for language test: ${LANGUAGE_TEST_TOKEN_COST}`);

    try {
      // Create CVI conversation for conversational mode
      let cviResponse = undefined;
      let cviConfig = null;
      const prompts: SpeakingPrompt[] = []; // Empty prompts array for conversational mode
      
      console.log('🎥 Creating CVI conversation for language test...');
        
        try {
          cviResponse = await createCVIConversation(config, {
            replicaId: cviOptions?.replicaId || tavusConfig?.replicaId,
            personaId: cviOptions?.personaId || tavusConfig?.personaId,
            apiKey: process.env.TAVUS_API_KEY
          });
          
          cviConfig = {
            replica_id: cviOptions?.replicaId || tavusConfig?.replicaId || 're8e740a42',
            persona_id: cviOptions?.personaId || tavusConfig?.personaId || 'p24293d6',
            conversation_name: `${config.language} Language Test - ${config.difficulty} Level`,
            conversational_context: generateConversationalContext(config),
            properties: {
              enable_recording: true,
              language: config.language
            }
          };
          
          console.log('✅ CVI conversation created:', cviResponse.conversation_id);
        } catch (cviError: any) {
          console.error('❌ Failed to create CVI conversation:', cviError);
          throw new Error(`Failed to create conversational video interface: ${cviError.message}`);
        }

      // Create test session
      const sessionId = ID.unique();
      const session: LanguageTestSession = {
        id: sessionId,
        userId,
        config: config as LanguageTestConfig,
        prompts,
        responses: [],
        currentPromptIndex: 0,
        startTime: Date.now(),
        status: 'not_started',
        tavusConfig,
        conversationHistory: [],
        testMode: 'conversational',
        cviConfig: cviConfig as TavusCVIConfig | undefined,
        cviResponse
      };

      // Save session to database
      try {
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          LANGUAGE_TESTS_COLLECTION_ID,
          sessionId,
          {
            userId: userId,
            language: config.language,
            languageCode: config.languageCode,
            difficulty: config.difficulty,
            testType: config.testType || 'conversation',
            duration: config.duration,
            status: 'not_started',
            startTime: session.startTime,
            prompts: JSON.stringify(prompts),
            tavusConfig: tavusConfig ? JSON.stringify(tavusConfig) : null,
            responses: JSON.stringify([]),
            conversationHistory: JSON.stringify([]),
            testMode: 'conversational',
            cviConfig: cviConfig ? JSON.stringify(cviConfig) : null,
            cviResponse: cviResponse ? JSON.stringify(cviResponse) : null,
            config: JSON.stringify(config)
          }
        );
        
        console.log('✅ Test session saved to database successfully');
      } catch (dbError: any) {
        console.error('❌ Database error saving test session:', dbError);
        
        // Provide user-friendly error message for missing collection
        if (dbError.message && dbError.message.includes('Collection with the requested ID could not be found')) {
          throw new Error('Language Tests collection not found. Please contact support to set up the language testing feature.');
        }
        
        throw new Error(`Database error: ${dbError.message}`);
      }

      const promptCount = prompts.length;
      const successMessage = `Conversational language test session created with CVI conversation: ${cviResponse?.conversation_id}`;
      
      console.log(`✅ ${successMessage}`);

      const responseData: any = {
        success: true,
        sessionId,
        session,
        message: successMessage,
        testMode: 'conversational',
        promptsGenerated: promptCount,
        tokenBalance: tokenResult.newTokenBalance
      };
      
      // Include CVI data for conversational mode
      if (cviResponse) {
        responseData.cvi = {
          conversationId: cviResponse.conversation_id,
          conversationUrl: cviResponse.conversation_url,
          dailyRoomUrl: cviResponse.daily_room_url,
          status: cviResponse.status
        };
      }

      return NextResponse.json(responseData);

    } catch (aiError: any) {
      console.error('❌ Error creating test session:', aiError);
      
      // Refund tokens on session creation failure
      try {
        await fetch(`${request.nextUrl.origin}/api/user/refund-tokens`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': `appwrite-session=${sessionCookie.value}`
          },
          body: JSON.stringify({ 
            userId, 
            amountToRefund: LANGUAGE_TEST_TOKEN_COST,
            description: `Language Test Refund: Session creation failed`
          }),
        });
        console.log('✅ Tokens refunded due to session creation failure');
      } catch (refundError) {
        console.error('❌ Failed to refund tokens:', refundError);
      }

      return NextResponse.json({
        error: 'Failed to create test session',
        message: aiError.message || 'Session creation failed'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Language test start error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}