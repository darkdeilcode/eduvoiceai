'use server';

/**
 * @fileOverview Generates a lecture on a given topic, including summaries,
 * explanations, and relevant YouTube videos using YouTube Data API.
 * Implements a cascading API key fallback: User Gemini -> Platform Default.
 */

import { genkit as baseGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TopicLectureInputSchema = z.object({
  topic: z.string().describe('The topic for the lecture.'),
  geminiApiKey: z.string().optional().describe('Optional Google Gemini API key to use for this request.'),
  openaiApiKey: z.string().optional().describe('Optional OpenAI API key to use for this request (currently not supported by this flow).'),
  claudeApiKey: z.string().optional().describe('Optional Anthropic Claude API key to use for this request (currently not supported).'),
});
export type TopicLectureInput = z.infer<typeof TopicLectureInputSchema>;

const TopicLectureOutputSchema = z.object({
  lectureContent: z.string().describe('The generated lecture content.'),
  summary: z.string().describe('A summary of the lecture.'),
  youtubeVideoLinks: z.array(z.string()).describe('Links to relevant YouTube videos.'),
  youtubeVideos: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    thumbnail: z.string(),
    channelTitle: z.string(),
    publishedAt: z.string(),
    url: z.string(),
    duration: z.string().optional(),
    viewCount: z.string().optional(),
  })).describe('Detailed YouTube video information.'),
  playlistUrl: z.string().describe('YouTube playlist URL for all videos.'),
  playlistM3U: z.string().describe('M3U playlist file content.'),
  videoSearchQueries: z.array(z.string()).describe('Search queries used to find relevant videos.'),
});
export type TopicLectureOutput = z.infer<typeof TopicLectureOutputSchema>;

// YouTube API functions
interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
  duration?: string;
  viewCount?: string;
}

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      kind: string;
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
      channelTitle: string;
      publishedAt: string;
    };
  }>;
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    contentDetails: {
      duration: string;
    };
    statistics: {
      viewCount: string;
    };
  }>;
}

const YOUTUBE_API_KEY = 'AIzaSyAzkKS-pD06Lmh7GAIf_9s1BmdqwRnRglE';
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function searchYouTubeVideos(
  query: string,
  maxResults: number = 5,
  relevanceLanguage: string = 'en'
): Promise<YouTubeVideo[]> {
  try {
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults.toString(),
      key: YOUTUBE_API_KEY,
      relevanceLanguage,
      safeSearch: 'moderate',
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      order: 'relevance'
    });

    const response = await fetch(`${YOUTUBE_API_BASE_URL}/search?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data: YouTubeSearchResponse = await response.json();
    
    const videoIds = data.items.map(item => item.id.videoId);
    
    // Get additional details for videos
    let videoDetails: YouTubeVideoDetailsResponse = { items: [] };
    if (videoIds.length > 0) {
      try {
        const detailsParams = new URLSearchParams({
          part: 'contentDetails,statistics',
          id: videoIds.join(','),
          key: YOUTUBE_API_KEY
        });
        
        const detailsResponse = await fetch(`${YOUTUBE_API_BASE_URL}/videos?${detailsParams}`);
        if (detailsResponse.ok) {
          videoDetails = await detailsResponse.json();
        }
      } catch (e) {
        console.warn('Failed to get video details:', e);
      }
    }
    
    return data.items.map((item, index) => {
      const details = videoDetails.items.find(d => d.id === item.id.videoId);
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        duration: details?.contentDetails?.duration || '',
        viewCount: details?.statistics?.viewCount || '',
      };
    });
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    throw new Error(`Failed to search YouTube videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function createYouTubePlaylistUrl(videoIds: string[], playlistTitle?: string): string {
  if (videoIds.length === 0) return '';
  
  const firstVideo = videoIds[0];
  const remainingVideos = videoIds.slice(1);
  
  let playlistUrl = `https://www.youtube.com/watch?v=${firstVideo}`;
  
  if (remainingVideos.length > 0) {
    playlistUrl += `&list=${remainingVideos.join(',')}&index=1`;
  }
  
  return playlistUrl;
}

function generatePlaylistM3U(videos: YouTubeVideo[], playlistName: string): string {
  let m3uContent = '#EXTM3U\n';
  m3uContent += `#PLAYLIST:${playlistName}\n\n`;
  
  videos.forEach(video => {
    m3uContent += `#EXTINF:-1,${video.title} - ${video.channelTitle}\n`;
    m3uContent += `${video.url}\n\n`;
  });
  
  return m3uContent;
}

// Schema for the actual data passed to the prompt template
const PromptDataTypeSchema = z.object({
    topic: z.string(),
});

const LECTURE_PROMPT_TEMPLATE = `You are an AI assistant designed to generate comprehensive lectures on various topics.

Generate a detailed lecture on the topic: {{{topic}}}.

The lecture should include:
- A comprehensive introduction to the topic
- Detailed explanations of key concepts and principles
- Real-world examples and applications
- Important terminology and definitions
- Current trends and developments (if applicable)
- Practical implications and uses
- A clear conclusion that ties everything together

Additionally, suggest 3-5 specific search queries that would be most effective for finding high-quality educational YouTube videos about this topic. These queries should be focused on:
- Educational content (tutorials, explanations, documentaries)
- Academic or professional presentations
- Demonstrations or practical examples
- Different aspects or subtopics of the main subject

Please ensure the lecture is:
- Informative and comprehensive
- Well-structured with clear sections
- Engaging and easy to understand
- Suitable for educational purposes
- Between 800-1500 words in length

Format your response to include both the lecture content and the suggested video search queries.`;

// Updated schema for AI response that includes search queries
const AIResponseSchema = z.object({
  lectureContent: z.string().describe('The comprehensive lecture content.'),
  summary: z.string().describe('A concise summary of the lecture.'),
  videoSearchQueries: z.array(z.string()).describe('Specific search queries for finding relevant YouTube videos.'),
});

async function generateLectureLogic(input: TopicLectureInput): Promise<TopicLectureOutput> {
  const promptData: z.infer<typeof PromptDataTypeSchema> = { topic: input.topic };

  let aiResponse: z.infer<typeof AIResponseSchema>;

  // Try user-provided Gemini API key first
  if (input.geminiApiKey) {
    console.log(`Attempting to use user-provided Gemini API key for lecture generation.`);
    try {
      const tempAi = baseGenkit({
        plugins: [googleAI({ apiKey: input.geminiApiKey })],
      });
      
      const tempGenerate = tempAi.defineFlow(
        {
          name: `tempLectureFlow_${Date.now()}`,
          inputSchema: PromptDataTypeSchema,
          outputSchema: AIResponseSchema,
        },
        async (data) => {
          const result = await tempAi.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt: LECTURE_PROMPT_TEMPLATE.replace('{{{topic}}}', data.topic),
            output: { schema: AIResponseSchema },
          });
          
          if (!result.output) {
            throw new Error('Model returned no output');
          }
          
          return result.output;
        }
      );

      const response = await tempGenerate(promptData);
      if (!response) throw new Error(`Model (Gemini) returned no output.`);

      console.log(`Successfully used user-provided Gemini API key for lecture generation.`);
      aiResponse = response;
    } catch (e: any) {
      console.warn(`Error using user-provided Gemini API key for lecture:`, e.message);
      const errorMessage = (e.message || "").toLowerCase();
      const errorStatus = e.status || e.code;
      const isKeyError =
        errorMessage.includes("api key") ||
        errorMessage.includes("permission denied") ||
        errorMessage.includes("quota exceeded") ||
        errorMessage.includes("authentication failed") ||
        errorMessage.includes("billing") ||
        errorMessage.includes("insufficient_quota") ||
        errorStatus === 401 || errorStatus === 403 || errorStatus === 429 ||
        (e.cause && typeof e.cause === 'object' && 'code' in e.cause && e.cause.code === 7);

      if (!isKeyError) {
        throw e; // Not a key-related error, re-throw
      }
      console.log(`User's Gemini API key failed due to key-related issue. Falling back to platform default.`);
      
      // Fall back to platform default
      console.log("Using platform's default API key for lecture generation.");
      const result = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: LECTURE_PROMPT_TEMPLATE.replace('{{{topic}}}', promptData.topic),
        output: { schema: AIResponseSchema },
      });
      
      if (!result.output) {
        throw new Error("AI model did not return the expected output for the lecture.");
      }
      
      aiResponse = result.output;
    }
  } else {
    console.log("Using platform's default API key for lecture generation.");
    try {
      const result = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: LECTURE_PROMPT_TEMPLATE.replace('{{{topic}}}', promptData.topic),
        output: { schema: AIResponseSchema },
      });
      
      if (!result.output) {
        throw new Error("AI model did not return the expected output for the lecture.");
      }
      
      aiResponse = result.output;
    } catch (e: any) {
      console.error("Platform default key also failed:", e.message);
      throw new Error(`Failed to generate lecture with both user and platform keys: ${e.message}`);
    }
  }

  // Now search for YouTube videos using the AI-generated search queries
  console.log('Searching for YouTube videos...');
  let allVideos: YouTubeVideo[] = [];
  const searchQueries = aiResponse.videoSearchQueries || [input.topic];

  try {
    // Search for videos using each query
    for (const query of searchQueries) {
      console.log(`Searching YouTube for: ${query}`);
      try {
        const videos = await searchYouTubeVideos(query, 2); // Get 2 videos per query
        allVideos.push(...videos);
      } catch (videoError) {
        console.warn(`Failed to search for videos with query "${query}":`, videoError);
        // Continue with other queries even if one fails
      }
    }

    // Remove duplicates based on video ID
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.id === video.id)
    );

    // Limit to top 8 videos
    const topVideos = uniqueVideos.slice(0, 8);

    console.log(`Found ${topVideos.length} unique videos for the lecture.`);

    // Create playlist URL and M3U content
    const videoIds = topVideos.map(video => video.id);
    const playlistUrl = createYouTubePlaylistUrl(videoIds, `${input.topic} - Educational Playlist`);
    const playlistM3U = generatePlaylistM3U(topVideos, `${input.topic} - Educational Videos`);

    return {
      lectureContent: aiResponse.lectureContent,
      summary: aiResponse.summary,
      youtubeVideoLinks: topVideos.map(video => video.url),
      youtubeVideos: topVideos,
      playlistUrl,
      playlistM3U,
      videoSearchQueries: searchQueries,
    };

  } catch (youtubeError) {
    console.error('YouTube search failed:', youtubeError);
    
    // Return lecture content without videos if YouTube search fails
    return {
      lectureContent: aiResponse.lectureContent,
      summary: aiResponse.summary,
      youtubeVideoLinks: [],
      youtubeVideos: [],
      playlistUrl: '',
      playlistM3U: '',
      videoSearchQueries: searchQueries,
    };
  }
}

const topicLectureFlow = ai.defineFlow(
  {
    name: 'topicLectureFlow',
    inputSchema: TopicLectureInputSchema,
    outputSchema: TopicLectureOutputSchema,
  },
  generateLectureLogic
);

export async function generateTopicLecture(input: TopicLectureInput): Promise<TopicLectureOutput> {
  return topicLectureFlow(input);
}