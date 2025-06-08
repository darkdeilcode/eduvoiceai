import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'node-appwrite';

export async function GET(request: NextRequest) {
  try {
    const sessionSecret = request.cookies.get('appwrite-session')?.value;
    
    if (!sessionSecret) {
      return NextResponse.json({
        success: false,
        error: 'No session found',
        code: 'no_session'
      }, { status: 401 });
    }
    
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setSession(sessionSecret); // Use session secret
    
    const account = new Account(client);
    const user = await account.get();
    
    return NextResponse.json({
      success: true,
      user: {
        $id: user.$id,
        email: user.email,
        name: user.name,
        emailVerification: user.emailVerification,
        prefs: user.prefs
      }
    });
    
  } catch (error: any) {
    console.error('❌ Session check error:', error);
    
    // Clear invalid session cookie
    const response = NextResponse.json({
      success: false,
      error: 'Invalid session',
      code: 'invalid_session'
    }, { status: 401 });
    
    response.cookies.delete('appwrite-session');
    response.cookies.delete('user-data');
    
    return response;
  }
}