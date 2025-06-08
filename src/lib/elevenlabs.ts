/**
 * ElevenLabs Text-to-Speech Integration
 * Provides AI voice functionality for the mock interview feature
 */

// Default voice ID for the AI interviewer (you can change this to any ElevenLabs voice)
const DEFAULT_VOICE_ID = '2qfp6zPuviqeCOZIE9RZ'; // Adam voice

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
}

interface TextToSpeechOptions {
  voice_id?: string;
  model_id?: string;
}

/**
 * Convert text to speech using our API route
 */
export async function textToSpeech(
  text: string,
  options: TextToSpeechOptions = {}
): Promise<ArrayBuffer> {
  const {
    voice_id = DEFAULT_VOICE_ID,
    model_id = 'eleven_monolingual_v1',
  } = options;

  console.log('textToSpeech called with:', {
    voice_id,
    model_id,
    textLength: text.length,
    defaultVoiceId: DEFAULT_VOICE_ID
  });

  if (!text || text.trim().length === 0) {
    throw new Error('Text is required for text-to-speech conversion');
  }

  if (text.length > 5000) {
    throw new Error('Text too long. Maximum 5000 characters allowed.');
  }

  try {
    const response = await fetch('/api/elevenlabs/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({
        text: text.trim(),
        voice_id,
        model_id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('TTS API error:', response.status, errorData);
      throw new Error(`API error: ${response.status} - ${errorData.error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('TTS API success, audio buffer size:', arrayBuffer.byteLength);
    return arrayBuffer;
  } catch (error) {
    console.error('Text-to-speech conversion failed:', error);
    throw error;
  }
}

/**
 * Play audio from ArrayBuffer
 */
export async function playAudio(audioBuffer: ArrayBuffer): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.oncanplaythrough = () => {
        // Remove the event listener to prevent multiple calls
        audio.oncanplaythrough = null;
        resolve(audio);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Failed to load audio'));
      };
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      // Start loading the audio
      audio.load();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert text to speech and play it immediately
 */
export async function speakWithElevenLabs(
  text: string,
  options: TextToSpeechOptions = {}
): Promise<HTMLAudioElement> {
  try {
    console.log('speakWithElevenLabs called with options:', options);
    const audioBuffer = await textToSpeech(text, options);
    console.log('textToSpeech completed, audioBuffer size:', audioBuffer.byteLength);
    return await playAudio(audioBuffer);
  } catch (error) {
    console.error('Failed to speak with ElevenLabs:', error);
    throw error;
  }
}

/**
 * Get available voices from our API route
 */
export async function getVoices(): Promise<ElevenLabsVoice[]> {
  try {
    const response = await fetch('/api/elevenlabs/voices', {
      credentials: 'include' // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to fetch voices: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Failed to get voices:', error);
    throw error;
  }
}

/**
 * Check if ElevenLabs API is available through our health check endpoint
 */
export async function checkElevenLabsStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/elevenlabs/health');
    
    if (response.ok) {
      const data = await response.json();
      return data.available === true;
    }
    
    return false;
  } catch (error) {
    console.error('ElevenLabs status check failed:', error);
    return false;
  }
}