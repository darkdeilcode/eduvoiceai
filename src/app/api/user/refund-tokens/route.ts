import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Client, Account } from 'node-appwrite';
import { 
  databases, 
  ID as AppwriteID,
  AppwriteException,
  clientInitialized,
  initializationError,
  APPWRITE_DATABASE_ID, 
  USERS_COLLECTION_ID,
  TRANSACTIONS_COLLECTION_ID 
} from '@/lib/appwrite.node';
import type { Models } from 'appwrite';

interface UserProfileDocument extends Models.Document {
  token_balance?: number;
  subscription_status?: string;
}

export async function POST(request: NextRequest) {
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
    
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    if (!clientInitialized) {
      console.error("API Route /api/user/refund-tokens Error: Appwrite client not initialized.", initializationError);
      return NextResponse.json({ error: `Server configuration error: ${initializationError}` }, { status: 500 });
    }

    if (!APPWRITE_DATABASE_ID || !USERS_COLLECTION_ID || !TRANSACTIONS_COLLECTION_ID) {
      console.error("API Route /api/user/refund-tokens Error: Appwrite Database/Collection IDs missing.");
      return NextResponse.json({ error: 'Server configuration error: Database or Collection IDs missing.' }, { status: 500 });
    }

    const { userId, amountToRefund, description } = await request.json();

    if (!userId || !amountToRefund || amountToRefund <= 0) {
      return NextResponse.json({ error: 'Invalid request: userId and positive amountToRefund are required.' }, { status: 400 });
    }

    // Verify the user making the request matches the userId
    if (currentUser.$id !== userId) {
      return NextResponse.json({ error: 'Unauthorized: Cannot refund tokens for another user' }, { status: 403 });
    }

    try {
      // Get user profile document
      const userProfileDoc = await databases.getDocument(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, userId) as UserProfileDocument;
      console.log(`API Route /api/user/refund-tokens: User ${userId} current token balance: ${userProfileDoc.token_balance}`);

      const currentTokenBalance = userProfileDoc.token_balance ?? 0;
      const newTokenBalance = currentTokenBalance + amountToRefund;

      // Update user token balance
      await databases.updateDocument(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, userId, {
        token_balance: newTokenBalance
      });

      console.log(`API Route /api/user/refund-tokens: User ${userId} token balance updated from ${currentTokenBalance} to ${newTokenBalance} (+${amountToRefund})`);

      // Log the refund transaction
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        AppwriteID.unique(),
        {
          user_id: userId,
          transaction_type: 'refund',
          amount: amountToRefund,
          description: description || 'Token refund',
          old_balance: currentTokenBalance,
          new_balance: newTokenBalance
        }
      );

      return NextResponse.json({
        success: true,
        message: `${amountToRefund} tokens refunded successfully.`,
        oldTokenBalance: currentTokenBalance,
        newTokenBalance: newTokenBalance,
        amountRefunded: amountToRefund
      });

    } catch (error: any) {
      console.error(`API Route /api/user/refund-tokens Error: Error processing refund for user ${userId}:`, error);

      if (error instanceof AppwriteException) {
        if (error.code === 404) {
          return NextResponse.json({ error: `User profile with ID ${userId} not found.` }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: error.code || 500 });
      }

      return NextResponse.json({ error: 'Error processing token refund.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Token refund error:', error);
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
