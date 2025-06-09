import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  storage, 
  users,
  clientInitialized, 
  initializationError,
  AUDIO_BUCKET_ID
} from '@/lib/appwrite.node';
import { ID } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    // Check if Appwrite client is initialized
    if (!clientInitialized) {
      console.error("API /audio/upload: Appwrite client not initialized:", initializationError);
      return NextResponse.json(
        { error: 'Server configuration error', details: initializationError },
        { status: 500 }
      );
    }

    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('appwrite-session');
    
    if (!sessionCookie) {
      console.error("API /audio/upload: No session cookie found");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current user from session
    let userId;
    try {
      // Create a client with the session to get user info
      const { Client, Account } = await import('appwrite');
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setSession(sessionCookie.value);
      
      const account = new Account(client);
      const user = await account.get();
      userId = user.$id;
      console.log('✅ User authenticated for audio upload:', userId);
    } catch (error) {
      console.error("API /audio/upload: Failed to get current user:", error);
      return NextResponse.json(
        { error: 'Invalid session or authentication failed' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const questionId = formData.get('questionId') as string;

    if (!audioFile || !questionId) {
      return NextResponse.json(
        { error: 'Audio file and question ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid audio file type. Supported: WAV, MP3, WebM, OGG' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size: 50MB' },
        { status: 400 }
      );
    }

    try {
      // Upload to Appwrite Storage
      const bucketId = AUDIO_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_AUDIO_BUCKET_ID || '6845a8d300066166412c';
      const fileId = ID.unique();
      const fileName = `${questionId}-${fileId}.${audioFile.name.split('.').pop()}`;

      console.log('📁 Uploading audio file:', {
        bucketId,
        fileId,
        fileName,
        fileSize: audioFile.size,
        fileType: audioFile.type
      });

      const uploadedFile = await storage.createFile(
        bucketId,
        fileId,
        audioFile,
        undefined // permissions (inherit from bucket)
      );

      // Generate file URL
      const audioUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

      console.log('✅ Audio file uploaded successfully:', {
        fileId: uploadedFile.$id,
        audioUrl
      });

      return NextResponse.json({
        success: true,
        audioUrl,
        fileId: uploadedFile.$id,
        fileName: uploadedFile.name
      });

    } catch (uploadError: any) {
      console.error('❌ Error uploading audio file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload audio file', details: uploadError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Audio upload error:', error);
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
