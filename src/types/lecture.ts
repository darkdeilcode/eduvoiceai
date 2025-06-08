import type { Models } from "appwrite";

export interface Lecture extends Models.Document {
  userId: string;
  topic: string;
  lectureContent: string;
  summary: string;
  // These are stored as JSON strings in Appwrite
  youtubeVideoLinks: string; // JSON string of string[]
  youtubeVideos: string; // JSON string of YouTubeVideo[]
  playlistUrl: string;
  playlistM3U: string;
  videoSearchQueries: string; // JSON string of string[]
}

// Helper interface for when you parse the JSON data
export interface ParsedLecture extends Omit<Lecture, 'youtubeVideoLinks' | 'youtubeVideos' | 'videoSearchQueries'> {
  youtubeVideoLinks: string[];
  youtubeVideos: Array<{
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    url: string;
    duration?: string;
    viewCount?: string;
  }>;
  videoSearchQueries: string[];
}