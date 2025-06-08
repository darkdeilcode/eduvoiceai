import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔐 Server-side login attempt for:', email);
    console.log('🌐 Using endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
    console.log('🆔 Using project:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
      console.error('❌ Missing Appwrite environment variables');
      return NextResponse.json({
        success: false,
        error: 'Server configuration error - missing Appwrite settings',
        code: 'config_error'
      }, { status: 500 });
    }
    
    // Create server-side client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
    
    const account = new Account(client);
    
    // Create session on server
    const session = await account.createEmailPasswordSession(email, password);
    console.log('✅ Server-side login successful - Session ID:', session.$id);
    
    // Create a NEW client with the session for getting user data
    const authenticatedClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setSession(session.secret); // Use session secret, not $id
    
    const authenticatedAccount = new Account(authenticatedClient);
    
    // Get user details with authenticated session
    const user = await authenticatedAccount.get();
    
    // Create response with session data
    const response = NextResponse.json({
      success: true,
      user: {
        $id: user.$id,
        email: user.email,
        name: user.name,
        emailVerification: user.emailVerification,
        prefs: user.prefs
      },
      session: {
        $id: session.$id,
        userId: session.userId,
        expire: session.expire,
        providerType: session.provider,
        secret: session.secret
      }
    });
    
    // Set secure session cookie with the session secret
    response.cookies.set('appwrite-session', session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });
    
    // Also set user data cookie for client access
    response.cookies.set('user-data', JSON.stringify({
      $id: user.$id,
      email: user.email,
      name: user.name,
      emailVerification: user.emailVerification
    }), {
      httpOnly: false, // Allow client access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    });
    
    return response;
    
  } catch (error: any) {
    console.error('❌ Server-side login error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response
    });
    
    let errorMessage = 'Login failed';
    let errorCode = 'unknown_error';
    let statusCode = 400;
    
    if (error.code === 401 || error.type === 'user_invalid_credentials') {
      errorMessage = 'Invalid email or password';
      errorCode = 'invalid_credentials';
      statusCode = 401;
    } else if (error.type === 'user_not_found') {
      errorMessage = 'No account found with this email address';
      errorCode = 'user_not_found';
      statusCode = 404;
    } else if (error.code === 429) {
      errorMessage = 'Too many login attempts. Please wait before trying again.';
      errorCode = 'rate_limited';
      statusCode = 429;
    } else if (error.message && error.message.includes('missing scope')) {
      errorMessage = 'Authentication scope error. Please try again.';
      errorCode = 'scope_error';
      statusCode = 403;
    } else if (error.message && error.message.includes('network')) {
      errorMessage = 'Network error - could not connect to authentication server';
      errorCode = 'network_error';
      statusCode = 503;
    } else if (error.message) {
      errorMessage = error.message;
      errorCode = error.type || 'unknown_error';
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
      type: error.type
    }, { status: statusCode });
  }
}