/**
 * Language Speaking Test System Types - Tavus AI Video Integration
 */

import { ReactNode } from "react";

export interface LanguageTestConfig {
  language: string;
  languageCode: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  testType?: string;
}

export interface SpeakingPrompt {
  id: string;
  prompt: string;
  context?: string;
  expectedTopics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeLimit: number; // seconds
}

export interface LanguageTestResponse {
  promptId: string;
  audioRecordingUrl: string;
  transcript: string;
  responseTime: number; // seconds
  timestamp: number;
}

export interface SpeakingEvaluation {
  promptId: string;
  prompt?: string;
  userResponse?: string;
  scores: {
    pronunciation: number; // 0-100
    fluency: number; // 0-100
    grammar: number; // 0-100
    vocabulary: number; // 0-100
    coherence: number; // 0-100
  };
  feedback: string;
  suggestions: string[];
}

export interface LanguageTestReport {
  id: string;
  userId: string;
  language: string;
  languageCode: string;
  difficulty: string;
  testType?: string;
  totalPrompts: number;
  completedPrompts: number;
  overallScore: number; // 0-100
  cefrLevel: string; // A1, A2, B1, B2, C1, C2
  isPassed: boolean; // Pass/Fail status
  passThreshold: number; // Required score to pass
  resultMessage: string; // Pass/Fail message with details
  conversationId?: string; // Tavus CVI conversation ID for language test history
  skillScores: {
    pronunciation: number;
    fluency: number;
    grammar: number;
    vocabulary: number;
    coherence: number;
    overall?: number;
  };
  evaluations: SpeakingEvaluation[];
  generalFeedback: string;
  recommendations: string[];
  testDuration: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface TavusAPIConfig {
  apiKey?: string;
  replicaId?: string;
  personaId?: string;
}

export interface TavusCVIConfig {
  replica_id: string;
  persona_id: string;
  conversation_name: string;
  conversational_context: string;
  properties?: {
    enable_recording?: boolean;
    language?: string;
  };
}

export interface TavusCVIResponse {
  conversation_id: string;
  conversation_url: string;
  status: 'created' | 'active' | 'ended';
  created_at: string;
  daily_room_url?: string;
}

export interface TavusVideoResponse {
  video_url: string;
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
  error?: string;
}

export interface LanguageTestQuestion {
  id: string;
  type: 'speaking' | 'listening' | 'reading' | 'writing';
  prompt: string;
  expectedResponse?: string;
  context?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skillsAssessed: string[];
  timeLimit?: number;
  points: number;
}

export interface LanguageTestSession {
  id: string;
  userId: string;
  config: LanguageTestConfig;
  prompts: SpeakingPrompt[];
  responses: LanguageTestResponse[];
  currentPromptIndex: number;
  startTime: number;
  endTime?: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  tavusConfig?: TavusAPIConfig;
  tavusVideoId?: string;
  conversationHistory: ConversationTurn[];
  
  // Tavus CVI Integration
  cviConfig?: TavusCVIConfig;
  cviResponse?: TavusCVIResponse;
  testMode?: 'traditional' | 'conversational';

  // Backward compatibility for question-based tests
  questions?: LanguageTestQuestion[];
  currentQuestionIndex?: number;
}

export interface ConversationTurn {
  id: string;
  speaker: 'ai' | 'user';
  message: string;
  transcript?: string; // For user messages with speech-to-text
  audioUrl?: string;
  timestamp: number;
}

// Available languages for testing
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export const LANGUAGE_TEST_TOKEN_COST = 10000;
