/**
 * Tavus.io API Integration for Language Testing
 * Provides video avatar functionality for language practice
 */

import type { TavusAPIConfig, TavusVideoResponse } from '@/types/languageTest';

const DEFAULT_TAVUS_API_KEY = '44c1cf65b56246f481740248920b892b';
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

interface TavusVideoRequest {
  replica_id: string;
  script: string;
  background_url?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

interface TavusReplicaInfo {
  replica_id: string;
  name: string;
  status: string;
  created_at: string;
  video_url?: string;
}

/**
 * Create a video using Tavus API
 */
export async function createTavusVideo(
  script: string,
  config: TavusAPIConfig,
  options: {
    replicaId?: string;
    backgroundUrl?: string;
    voiceSettings?: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    };
  } = {}
): Promise<TavusVideoResponse> {
  const apiKey = config.apiKey || DEFAULT_TAVUS_API_KEY;
  
  if (!script || script.trim().length === 0) {
    throw new Error('Script is required for video generation');
  }

  if (script.length > 2000) {
    throw new Error('Script too long. Maximum 2000 characters allowed.');
  }

  const requestBody: TavusVideoRequest = {
    replica_id: options.replicaId || config.replicaId || 'default_replica',
    script: script.trim(),
    ...(options.backgroundUrl && { background_url: options.backgroundUrl }),
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
      ...options.voiceSettings,
    },
  };

  console.log('Creating Tavus video with config:', {
    replicaId: requestBody.replica_id,
    scriptLength: script.length,
    hasCustomSettings: !!options.voiceSettings,
  });

  try {
    const response = await fetch(`${TAVUS_BASE_URL}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Tavus API error:', response.status, errorData);
      throw new Error(`Tavus API error: ${response.status} - ${errorData.error || errorData.message}`);
    }

    const data = await response.json();
    console.log('Tavus video creation success:', {
      videoId: data.video_id,
      status: data.status,
    });

    return {
      video_url: data.video_url,
      video_id: data.video_id,
      status: data.status,
    };
  } catch (error) {
    console.error('Tavus video creation failed:', error);
    throw error;
  }
}

/**
 * Get video status from Tavus
 */
export async function getTavusVideoStatus(
  videoId: string,
  apiKey: string = DEFAULT_TAVUS_API_KEY
): Promise<TavusVideoResponse> {
  try {
    const response = await fetch(`${TAVUS_BASE_URL}/videos/${videoId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get video status: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    return {
      video_url: data.video_url,
      video_id: data.video_id,
      status: data.status,
    };
  } catch (error) {
    console.error('Failed to get Tavus video status:', error);
    throw error;
  }
}

/**
 * Get available replicas from Tavus
 */
export async function getTavusReplicas(
  apiKey: string = DEFAULT_TAVUS_API_KEY
): Promise<TavusReplicaInfo[]> {
  try {
    const response = await fetch(`${TAVUS_BASE_URL}/replicas`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to fetch replicas: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    return data.replicas || [];
  } catch (error) {
    console.error('Failed to get Tavus replicas:', error);
    throw error;
  }
}

/**
 * Check if Tavus API is available
 */
export async function checkTavusStatus(apiKey: string = DEFAULT_TAVUS_API_KEY): Promise<boolean> {
  try {
    const response = await fetch(`${TAVUS_BASE_URL}/replicas`, {
      method: 'HEAD',
      headers: {
        'x-api-key': apiKey,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Tavus status check failed:', error);
    return false;
  }
}

/**
 * Delete a video from Tavus
 */
export async function deleteTavusVideo(
  videoId: string,
  apiKey: string = DEFAULT_TAVUS_API_KEY
): Promise<boolean> {
  try {
    const response = await fetch(`${TAVUS_BASE_URL}/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to delete Tavus video:', error);
    return false;
  }
}
