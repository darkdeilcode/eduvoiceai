import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const sessionSecret = request.cookies.get('appwrite-session')?.value;
    
    if (sessionSecret) {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setSession(sessionSecret); // Use session secret
      
      const account = new Account(client);
      await account.deleteSession('current');
    }
    
    // Clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    response.cookies.delete('appwrite-session');
    response.cookies.delete('user-data');
    
    return response;
    
  } catch (error: any) {
    console.error('❌ Logout error:', error);
    
    // Even if logout fails, clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    response.cookies.delete('appwrite-session');
    response.cookies.delete('user-data');
    
    return response;
  }
}