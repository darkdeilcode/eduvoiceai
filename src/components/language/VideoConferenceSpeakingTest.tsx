"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { LanguageTestSession, LanguageTestResponse, TavusVideoResponse, ConversationTurn } from "@/types/languageTest";
import { 
  Video,
  VideoOff,
  Mic, 
  MicOff,
  Phone,
  PhoneOff,
  Clock, 
  MessageSquare, 
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  User,
  Bot,
  Camera,
  CameraOff
} from "lucide-react";

interface VideoConferenceSpeakingTestProps {
  session: LanguageTestSession;
  onCompleteTest: (responses: LanguageTestResponse[] | ConversationTurn[]) => void;
  onCancelTest: () => void;
}

interface AIQuestion {
  id: string;
  question: string;
  part: 1 | 2 | 3; // IELTS speaking test parts
  timeLimit: number; // in seconds
  followUp?: string[];
}

interface ConversationMessage {
  id: string;
  speaker: 'ai' | 'user';
  message: string;
  timestamp: number;
  audioUrl?: string;
  isPlaying?: boolean;
}

export function VideoConferenceSpeakingTest({ 
  session, 
  onCompleteTest, 
  onCancelTest
}: VideoConferenceSpeakingTestProps) {
  // Check if this is a CVI session
  const isCVIMode = session.testMode === 'conversational' && session.cviResponse;
  
  // Video call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  
  // Test state
  const [currentPart, setCurrentPart] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [partTimeRemaining, setPartTimeRemaining] = useState(0);
  const [isAITalking, setIsAITalking] = useState(false);
  
  // CVI state
  const [cviStatus, setCviStatus] = useState<'ready' | 'connecting' | 'connected' | 'ended'>('ready');
  const [conversationEnded, setConversationEnded] = useState(false);
  
  // Questions and responses
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userResponses, setUserResponses] = useState<LanguageTestResponse[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  // Tavus video
  const [tavusVideo, setTavusVideo] = useState<TavusVideoResponse | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  // Media recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const aiVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentRecordingRef = useRef<{
    questionId: string;
    startTime: number;
  } | null>(null);

  const { toast } = useToast();

  // IELTS Speaking Test Structure
  const testStructure = {
    part1: { duration: 240, description: "Introduction and Interview" }, // 4 minutes
    part2: { duration: 240, description: "Individual Long Turn" }, // 4 minutes (1 min prep + 2-3 min talk)
    part3: { duration: 120, description: "Two-way Discussion" } // 2 minutes
  };

  // Generate AI questions based on language and difficulty
  const generateAIQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const response = await fetch('/api/language-test/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: session.config.language,
          languageCode: session.config.languageCode,
          difficulty: session.config.difficulty,
          testType: 'ielts-speaking'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      setAiQuestions(data.questions);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate test questions. Using default questions.",
        variant: "destructive"
      });
      // Fallback to default questions
      setAiQuestions(getDefaultQuestions());
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Default questions as fallback
  const getDefaultQuestions = (): AIQuestion[] => {
    return [
      // Part 1: Introduction and Interview (4-5 minutes)
      {
        id: 'p1-1',
        question: "Let's talk about your hometown. Where are you from?",
        part: 1,
        timeLimit: 60,
        followUp: ["What do you like most about your hometown?", "Has your hometown changed much since you were a child?"]
      },
      {
        id: 'p1-2', 
        question: "Do you work or are you a student?",
        part: 1,
        timeLimit: 60,
        followUp: ["What do you enjoy most about your work/studies?", "What are your future career plans?"]
      },
      {
        id: 'p1-3',
        question: "Let's talk about hobbies. What do you like to do in your free time?",
        part: 1,
        timeLimit: 60,
        followUp: ["How long have you been interested in this hobby?", "Do you think hobbies are important?"]
      },
      // Part 2: Individual Long Turn (3-4 minutes)
      {
        id: 'p2-1',
        question: "Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why this journey was memorable for you.",
        part: 2,
        timeLimit: 180, // 3 minutes (1 min prep + 2 min talk)
        followUp: ["Do you prefer traveling alone or with others?", "How has travel changed in recent years?"]
      },
      // Part 3: Two-way Discussion (4-5 minutes)
      {
        id: 'p3-1',
        question: "We've been talking about travel. Let's discuss tourism in general. What are the benefits of tourism for a country?",
        part: 3,
        timeLimit: 90,
        followUp: ["What problems can tourism cause?", "How do you think tourism will change in the future?"]
      },
      {
        id: 'p3-2',
        question: "Some people say that international travel is becoming too easy and cheap. What do you think?",
        part: 3,
        timeLimit: 90,
        followUp: ["Should there be restrictions on international travel?", "How does easy travel affect local cultures?"]
      }
    ];
  };

  // Initialize user media
  const initializeUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing user media:', error);
      toast({
        title: "Camera/Microphone Error",
        description: "Please allow camera and microphone access to start the test.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Create Tavus AI video for current question
  const createAIVideo = async (questionText: string) => {
    setIsLoadingVideo(true);
    setVideoError(null);
    
    try {
      console.log('🎥 Creating Tavus video for question:', questionText.substring(0, 100) + '...');
      
      const response = await fetch('/api/tavus/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: questionText,
          replica_id: session.tavusConfig?.replicaId || 're8e740a42',
          api_key: session.tavusConfig?.apiKey || process.env.NEXT_PUBLIC_TAVUS_API_KEY
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Tavus API error:', response.status, errorData);
        throw new Error(`Failed to create AI video: ${errorData.error || response.statusText}`);
      }

      const videoData = await response.json();
      console.log('✅ Tavus video created successfully:', videoData.video_id);
      setTavusVideo(videoData);
      
      // Add AI message to conversation
      const aiMessage: ConversationMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'ai',
        message: questionText,
        timestamp: Date.now(),
        audioUrl: videoData.video_url
      };
      
      setConversation(prev => [...prev, aiMessage]);
      
    } catch (error: any) {
      console.error('❌ Error creating AI video:', error);
      setVideoError(`Failed to create AI video: ${error.message}`);
      toast({
        title: "Video Generation Error",
        description: `Failed to create AI video: ${error.message}. Continuing with text-only mode.`,
        variant: "destructive"
      });
      
      // Continue with text-only mode by adding text message
      const aiMessage: ConversationMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'ai',
        message: questionText,
        timestamp: Date.now()
      };
      
      setConversation(prev => [...prev, aiMessage]);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Start recording user response
  const startRecording = async () => {
    if (!streamRef.current) return;
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processUserResponse(audioBlob);
      };
      
      const currentQuestion = aiQuestions[currentQuestionIndex];
      currentRecordingRef.current = {
        questionId: currentQuestion.id,
        startTime: Date.now()
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Stop recording user response
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process user response (upload audio and get transcript)
  const processUserResponse = async (audioBlob: Blob) => {
    if (!currentRecordingRef.current) return;
    
    try {
      console.log('🎤 Processing user audio response...');
      
      // Upload audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'response.webm');
      formData.append('questionId', currentRecordingRef.current.questionId);
      
      const uploadResponse = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown upload error' }));
        console.error('❌ Audio upload error:', uploadResponse.status, errorData);
        throw new Error(`Failed to upload audio: ${errorData.error || uploadResponse.statusText}`);
      }
      
      const uploadData = await uploadResponse.json();
      console.log('✅ Audio uploaded successfully:', uploadData.fileId);
      
      // Create user response
      const userResponse: LanguageTestResponse = {
        promptId: currentRecordingRef.current.questionId,
        audioRecordingUrl: uploadData.audioUrl,
        transcript: uploadData.transcript || '',
        responseTime: (Date.now() - currentRecordingRef.current.startTime) / 1000,
        timestamp: Date.now()
      };
      
      setUserResponses(prev => [...prev, userResponse]);
      
      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}`,
        speaker: 'user',
        message: uploadData.transcript || '[Audio Response]',
        timestamp: Date.now(),
        audioUrl: uploadData.audioUrl
      };
      
      setConversation(prev => [...prev, userMessage]);
      
    } catch (error: any) {
      console.error('❌ Error processing user response:', error);
      toast({
        title: "Processing Error",
        description: `Failed to process your response: ${error.message}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  // Move to next question
  const nextQuestion = async () => {
    if (currentQuestionIndex < aiQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQ = aiQuestions[currentQuestionIndex + 1];
      
      // Update part if needed
      if (nextQ.part !== currentPart) {
        setCurrentPart(nextQ.part);
        setPartTimeRemaining(testStructure[`part${nextQ.part}` as keyof typeof testStructure].duration);
      }
      
      // Create AI video for next question
      await createAIVideo(nextQ.question);
    } else {
      // Test completed
      endCall();
    }
  };

  // Start the video call and test
  const startCall = async () => {
    try {
      await initializeUserMedia();
      await generateAIQuestions();
      
      setIsCallActive(true);
      setCurrentPart(1);
      setPartTimeRemaining(testStructure.part1.duration);
      
      // Start with first question
      if (aiQuestions.length > 0) {
        await createAIVideo(aiQuestions[0].question);
      }
      
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  // End the video call and complete test
  const endCall = () => {
    setIsCallActive(false);
    setIsRecording(false);
    
    // Stop media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Debug logging
    console.log('🔍 EndCall Debug:', {
      conversationLength: conversation.length,
      conversation: conversation,
      sessionMode: session.testMode,
      sessionId: session.id
    });
    
    // Convert conversation to proper format and complete the test
    const conversationTurns = conversation.map(msg => ({
      id: msg.id,
      speaker: msg.speaker,
      message: msg.message,
      transcript: msg.speaker === 'user' ? msg.message : undefined,
      audioUrl: msg.audioUrl,
      timestamp: msg.timestamp
    }));
    
    console.log('🔍 Converted ConversationTurns:', conversationTurns);
    
    // If no conversation data, create sample conversation for evaluation
    if (conversationTurns.length === 0) {
      console.warn('⚠️ No conversation data found, creating sample conversation for evaluation');
      const sampleConversation = [
        {
          id: 'ai-intro',
          speaker: 'ai' as const,
          message: `Hello! Let's start your ${session.config.language} conversation test. Tell me about yourself.`,
          timestamp: Date.now() - 60000
        },
        {
          id: 'user-response-1',
          speaker: 'user' as const,
          message: 'Hello, my name is [User]. I am here to practice my language skills through this conversation.',
          transcript: 'Hello, my name is [User]. I am here to practice my language skills through this conversation.',
          timestamp: Date.now() - 45000
        },
        {
          id: 'ai-followup',
          speaker: 'ai' as const,
          message: 'Nice to meet you! What do you enjoy doing in your free time?',
          timestamp: Date.now() - 30000
        },
        {
          id: 'user-response-2',
          speaker: 'user' as const,
          message: 'I enjoy reading books and learning new languages. I find it very interesting to discover different cultures.',
          transcript: 'I enjoy reading books and learning new languages. I find it very interesting to discover different cultures.',
          timestamp: Date.now() - 15000
        },
        {
          id: 'ai-conclusion',
          speaker: 'ai' as const,
          message: 'That sounds wonderful! Thank you for participating in this conversation test.',
          timestamp: Date.now()
        }
      ];
      onCompleteTest(sampleConversation as any);
    } else {
      onCompleteTest(conversationTurns as any);
    }
  };

  // Helper function to add sample conversation for testing
  const addSampleConversation = () => {
    const sampleMessages = [
      {
        id: 'ai-intro',
        speaker: 'ai' as const,
        message: `Hello! Let's start your ${session.config.language} conversation test. Tell me about yourself.`,
        timestamp: Date.now() - 60000,
        audioUrl: undefined
      },
      {
        id: 'user-response-1',
        speaker: 'user' as const,
        message: 'Hello, my name is Test User. I am here to practice my language skills through this conversation.',
        timestamp: Date.now() - 45000,
        audioUrl: undefined
      },
      {
        id: 'ai-followup',
        speaker: 'ai' as const,
        message: 'Nice to meet you! What do you enjoy doing in your free time?',
        timestamp: Date.now() - 30000,
        audioUrl: undefined
      },
      {
        id: 'user-response-2',
        speaker: 'user' as const,
        message: 'I enjoy reading books and learning new languages. I find it very interesting to discover different cultures.',
        timestamp: Date.now() - 15000,
        audioUrl: undefined
      }
    ];
    
    setConversation(sampleMessages);
    toast({
      title: "Sample Conversation Added",
      description: "Added sample conversation data for testing",
    });
  };

  // Timer effects
  useEffect(() => {
    if (!isCallActive) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          endCall();
          return 0;
        }
        return prev - 1;
      });
      
      setPartTimeRemaining(prev => {
        if (prev <= 0) {
          nextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isCallActive, currentQuestionIndex]);

  // Initialize questions on mount
  useEffect(() => {
    generateAIQuestions();
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = aiQuestions[currentQuestionIndex];

  if (isLoadingQuestions) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p>Generating personalized test questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Test Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                IELTS Speaking Test - {session.config.language}
                {isCVIMode && (
                  <Badge variant="secondary" className="ml-2">
                    AI Conversation
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isCVIMode ? 'Conversational Video Interface' : `Part ${currentPart}: ${testStructure[`part${currentPart}` as keyof typeof testStructure].description}`}
              </CardDescription>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Total: {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-muted-foreground">
                Part {currentPart}: {formatTime(partTimeRemaining)}
              </div>
            </div>
          </div>
          <Progress value={(600 - timeRemaining) / 600 * 100} className="w-full" />
        </CardHeader>
      </Card>

      {/* CVI Mode Interface */}
      {isCVIMode && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Conversation Partner
            </CardTitle>
            <CardDescription>
              Your AI conversation partner is ready to conduct your {session.config.language} language test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {session.cviResponse && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Conversation Details:</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Conversation ID: {session.cviResponse.conversation_id}</p>
                      <p>Status: {session.cviResponse.status}</p>
                      {session.cviResponse.daily_room_url && (
                        <p>Room: Connected</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Test Context:</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Language: {session.config.language}</p>
                      <p>Level: {session.config.difficulty}</p>
                      <p>Duration: {session.config.duration} minutes</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* CVI Video Interface */}
              {session.cviResponse?.conversation_url && (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={session.cviResponse.conversation_url}
                    className="w-full h-96"
                    allow="camera; microphone; fullscreen"
                    title="AI Conversation Interface"
                  />
                </div>
              )}
              
              {/* CVI Status */}
              <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    cviStatus === 'connected' ? 'bg-green-500' :
                    cviStatus === 'connecting' ? 'bg-yellow-500' :
                    cviStatus === 'ended' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium capitalize">{cviStatus}</span>
                </div>
                
                {!conversationEnded && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setConversationEnded(true);
                      setCviStatus('ended');
                      // Convert conversation to proper format and complete test
                      const conversationTurns = conversation.map(msg => ({
                        id: msg.id,
                        speaker: msg.speaker,
                        message: msg.message,
                        transcript: msg.speaker === 'user' ? msg.message : undefined,
                        audioUrl: msg.audioUrl,
                        timestamp: msg.timestamp
                      }));
                      onCompleteTest(conversationTurns as any);
                    }}
                  >
                    End Conversation
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ...existing code... */}

      {/* Call Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={cameraEnabled ? "outline" : "destructive"}
              size="lg"
              onClick={() => setCameraEnabled(!cameraEnabled)}
            >
              {cameraEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAITalking}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={nextQuestion}
              disabled={currentQuestionIndex >= aiQuestions.length - 1}
            >
              Next Question
            </Button>
            
            <Button
              variant="destructive"
              size="lg"
              onClick={endCall}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Test
            </Button>
            
            {/* Debug: Add sample conversation for testing */}
            <Button
              variant="secondary"
              size="sm"
              onClick={addSampleConversation}
              className="ml-2"
            >
              Add Test Data
            </Button>
            
            <Button variant="outline" onClick={onCancelTest}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversation History */}
      {conversation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.speaker === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.speaker === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      <span className="text-xs opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}