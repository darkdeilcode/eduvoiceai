"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { InterviewSetup } from "@/components/interviews/InterviewSetup";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { getFirstInterviewQuestion } from "@/ai/flows/mock-interview-flow";
import type { InterviewConfigInput, FirstQuestionOutput } from "@/ai/flows/mock-interview-flow";
import { getFeedbackAndNextQuestion } from "@/ai/flows/interview-progression-flow";
import type { InterviewProgressionInput, InterviewProgressionOutput } from "@/ai/flows/interview-progression-flow";
import { getFinalInterviewFeedback } from "@/ai/flows/final-interview-feedback-flow";
import type { FinalInterviewFeedbackInput, FinalInterviewFeedbackOutput } from "@/ai/flows/final-interview-feedback-flow";
import { account, databases, ID, Permission, Role, APPWRITE_DATABASE_ID, INTERVIEWS_COLLECTION_ID, AppwriteException } from "@/lib/appwrite";
import type { Models } from "appwrite";
import type { InterviewReport, InterviewExchangeForReport } from "@/types/interviewReport";

import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Video, VideoOff, MessageSquare, Sparkles, Mic, MicOff, Volume2, VolumeX, TimerIcon, StopCircle, ThumbsUp, ThumbsDown, Award, Camera, CameraOff, Save, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { speakWithElevenLabs, checkElevenLabsStatus } from "@/lib/elevenlabs";

type InterviewStage = "setup" | "token_check_loading" | "first_question_loading" | "interviewing" | "next_question_loading" | "final_feedback_loading" | "final_feedback_display" | "error";

interface InterviewExchange {
  question: string;
  answer: string;
}

// Define a type for the interview configuration that includes all potential API keys
type FullInterviewConfig = Omit<InterviewConfigInput, 'geminiApiKey' | 'openaiApiKey' | 'claudeApiKey'> & {
  geminiApiKey?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
};

const SpeechRecognition = (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;
const speechSynthesis = (typeof window !== 'undefined' && window.speechSynthesis) || null;

const INTERVIEW_DURATION_MINUTES = 10;
const INTERVIEW_WRAP_UP_SECONDS = 30;
const MOCK_INTERVIEW_TOKEN_COST = 1000;

const MockInterviewPage: NextPage = () => {
  const [stage, setStage] = useState<InterviewStage>("setup");
  const [interviewConfig, setInterviewConfig] = useState<FullInterviewConfig | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewExchange[]>([]);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isCameraBeingToggled, setIsCameraBeingToggled] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isElevenLabsAvailable, setIsElevenLabsAvailable] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const [remainingTime, setRemainingTime] = useState(INTERVIEW_DURATION_MINUTES * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [finalFeedback, setFinalFeedback] = useState<FinalInterviewFeedbackOutput | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);

  // Add a function to check internet connectivity
  const checkInternetConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health-check', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      try {
        // Fallback: try to reach a reliable endpoint
        const response = await fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        return true;
      } catch {
        return false;
      }
    }
  };

  const speakText = useCallback(async (text: string) => {
    if (!isTTSEnabled || !text) return;
    
    console.log('speakText called with:', { text: text.substring(0, 50) + '...', isTTSEnabled, isElevenLabsAvailable });
    
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (speechSynthesis?.speaking) {
      speechSynthesis.cancel();
    }
    
    try {
      if (isElevenLabsAvailable) {
        console.log('Attempting to use ElevenLabs...');
        // Try ElevenLabs first
        setIsAISpeaking(true);
        const audio = await speakWithElevenLabs(text);
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          setIsAISpeaking(false);
          currentAudioRef.current = null;
        };
        
        audio.onerror = () => {
          console.log('ElevenLabs audio error, falling back to browser TTS');
          setIsAISpeaking(false);
          currentAudioRef.current = null;
          // Fallback to browser TTS
          fallbackToSpeechSynthesis(text);
        };
        
        // Play the audio
        try {
          await audio.play();
          console.log('ElevenLabs audio playing successfully');
        } catch (playError) {
          console.error('Failed to play ElevenLabs audio:', playError);
          setIsAISpeaking(false);
          currentAudioRef.current = null;
          fallbackToSpeechSynthesis(text);
        }
      } else {
        console.log('ElevenLabs not available, using browser TTS');
        // Fallback to browser TTS
        fallbackToSpeechSynthesis(text);
      }
    } catch (error) {
      console.error('ElevenLabs TTS failed, falling back to browser TTS:', error);
      setIsAISpeaking(false);
      fallbackToSpeechSynthesis(text);
    }
  }, [isTTSEnabled, isElevenLabsAvailable, toast]);
  
  const fallbackToSpeechSynthesis = useCallback((text: string) => {
    if (!speechSynthesis || !text) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsAISpeaking(true);
      utterance.onend = () => setIsAISpeaking(false);
      utterance.onerror = () => {
        setIsAISpeaking(false);
        toast({ title: "Speech Error", description: "Could not play AI voice.", variant: "destructive"});
      };
      speechSynthesis.speak(utterance);
    } catch (e) {
      setIsAISpeaking(false);
      toast({ title: "Speech Error", description: "Could not play AI voice.", variant: "destructive"});
    }
  }, [toast]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRemainingTime(INTERVIEW_DURATION_MINUTES * 60);
    timerRef.current = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= INTERVIEW_WRAP_UP_SECONDS + 1) { 
          clearInterval(timerRef.current!);
          if (prevTime <= 1) { 
            handleEndInterview("timer_elapsed");
          } else { 
            handleEndInterview("timer_wrapping_up");
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }, []); // Removed handleEndInterview from dependencies

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
  },[]);

  useEffect(() => {
    return () => { 
      stopTimer();
      if (speechSynthesis && speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopCameraStream();
    };
  }, [stopTimer, stopCameraStream]);

  // Enhanced Speech Recognition Setup with better error handling
  useEffect(() => {
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support voice input. Please type your answers.",
        variant: "destructive",
        duration: 5000,
      });
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; 
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Set language explicitly

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        let errorMsg = "Speech recognition error. Please try again.";
        let actionButton: React.ReactNode = null;
        
        if (event.error === 'no-speech') {
            errorMsg = "No speech was detected. Please ensure your microphone is working and try speaking clearly.";
        } else if (event.error === 'audio-capture') {
            errorMsg = "Microphone error. Could not capture audio. Please check your microphone connection and permissions.";
        } else if (event.error === 'not-allowed') {
            errorMsg = "Microphone access denied. Please allow microphone access in your browser settings and refresh the page.";
            actionButton = <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh Page</Button>;
        } else if (event.error === 'network') {
            errorMsg = "Network error. Speech recognition requires an internet connection. Please check your connection and try again.";
            actionButton = <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>;
        } else if (event.error === 'service-not-allowed') {
            errorMsg = "Speech recognition service is not available. Please check your internet connection or try typing your answer instead.";
        } else if (event.error === 'bad-grammar') {
            errorMsg = "Speech recognition grammar error. Please try again.";
        } else if (event.error === 'language-not-supported') {
            errorMsg = "Language not supported by speech recognition. Please type your answer instead.";
        } else if (event.error === 'aborted') {
            // Don't show error for aborted - this is usually intentional
            return;
        }
        
        toast({ 
          title: "Voice Input Error", 
          description: errorMsg, 
          variant: "destructive",
          ...(actionButton && { action: actionButton }),
          duration: 7000
        });
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript.trim()) {
             setUserAnswer(prev => prev + finalTranscript.trim() + " "); 
        }
      };
      recognitionRef.current = recognition;
    }
  }, [toast]);

  // Add online/offline detection
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "Internet connection is back. Voice input is now available.",
        duration: 3000
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      toast({
        title: "Connection Lost",
        description: "Voice input requires internet connection. Please use text input or restore your connection.",
        variant: "destructive",
        duration: 5000
      });
    };

    // Set initial state
    updateOnlineStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isListening, toast]);

  // Check ElevenLabs availability on mount
  useEffect(() => {
    const checkElevenLabs = async () => {
      try {
        console.log('Checking ElevenLabs status...');
        const isAvailable = await checkElevenLabsStatus();
        console.log('ElevenLabs status check result:', isAvailable);
        setIsElevenLabsAvailable(isAvailable);
        if (!isAvailable) {
          console.warn('ElevenLabs API not available, falling back to browser TTS');
        } else {
          console.log('ElevenLabs API is available and ready');
        }
      } catch (error) {
        console.error('Error checking ElevenLabs status:', error);
        setIsElevenLabsAvailable(false);
      }
    };
    
    checkElevenLabs();
  }, []);

  useEffect(() => {
    const manageCamera = async () => {
      if (!isVideoEnabled || isCameraBeingToggled) {
        stopCameraStream();
        setHasCameraPermission(null); 
        return;
      }

      if (stage === "interviewing" || stage === "next_question_loading" || stage === "final_feedback_loading") {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (err) {
            setHasCameraPermission(false);
             toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings to use video.',
            });
          }
        } else {
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Not Supported',
            description: 'Your browser does not support camera access.',
          });
        }
      } else if (stage !== "final_feedback_display") { 
        stopCameraStream();
      }
    };

    manageCamera();
  }, [stage, toast, isVideoEnabled, stopCameraStream, isCameraBeingToggled]);

  useEffect(() => {
    if (stage === "final_feedback_display" || stage === "error" || stage === "setup") {
        stopTimer();
        stopCameraStream();
    }
  }, [stage, stopTimer, stopCameraStream]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interviewHistory, currentQuestion, finalFeedback]);

  // Separate config state without API keys, used for saving.
  const [baseInterviewConfig, setBaseInterviewConfig] = useState<Omit<InterviewConfigInput, 'geminiApiKey'|'openaiApiKey'|'claudeApiKey' > | null>(null);

  const handleSetupComplete = async (data: Omit<InterviewConfigInput, 'geminiApiKey'|'openaiApiKey'|'claudeApiKey'>) => {
    setStage("token_check_loading");
    setError(null);
    setBaseInterviewConfig(data); // Store base config for saving report
    setInterviewHistory([]);
    setFinalFeedback(null);
    setCurrentQuestion(null);
    setUserAnswer("");
    setIsVideoEnabled(true);

    let userGeminiApiKey: string | undefined = undefined;
    let userOpenaiApiKey: string | undefined = undefined;
    let userClaudeApiKey: string | undefined = undefined;

    try {
      const savedKeysRaw = localStorage.getItem("eduvoice_api_keys");
      if (savedKeysRaw) {
        const savedKeys = JSON.parse(savedKeysRaw);
        userGeminiApiKey = savedKeys.geminiApiKey;
        userOpenaiApiKey = savedKeys.openaiApiKey;
        userClaudeApiKey = savedKeys.claudeApiKey;
      }
    } catch (e) {
      console.warn("Could not read API keys from localStorage", e);
    }
    
    // Construct the full config with API keys for Genkit flows
    const fullConfigForFlow: InterviewConfigInput = {
      ...data,
      ...(userGeminiApiKey && { geminiApiKey: userGeminiApiKey }),
      ...(userOpenaiApiKey && { openaiApiKey: userOpenaiApiKey }),
      ...(userClaudeApiKey && { claudeApiKey: userClaudeApiKey }),
    };
    setInterviewConfig(fullConfigForFlow); // Store full config for current session

    let currentUser: Models.User<Models.Preferences> | null = null;
    try {
      currentUser = await account.get();
    } catch (authError) {
      toast({ title: "Authentication Error", description: "Could not verify user. Please log in again.", variant: "destructive" });
      setStage("setup");
      return;
    }

    if (!currentUser?.$id) {
      toast({ title: "Authentication Error", description: "User ID not found.", variant: "destructive" });
      setStage("setup");
      return;
    }
    const userId = currentUser.$id;

    try {
      const tokenResponse = await fetch('/api/user/deduct-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          amountToDeduct: MOCK_INTERVIEW_TOKEN_COST,
          description: `Mock Interview Start: ${data.jobDescription.substring(0, 50)}...`
        }),
      });

      const tokenResult = await tokenResponse.json();

      if (!tokenResponse.ok) {
        if (tokenResponse.status === 402 && tokenResult.canSubscribe) {
          toast({
            title: "Insufficient Tokens",
            description: `${tokenResult.message || `You need ${MOCK_INTERVIEW_TOKEN_COST} tokens for a mock interview.`} You have ${tokenResult.currentTokenBalance || 0}.`,
            variant: "destructive",
            action: <Button variant="outline" size="sm" asChild><Link href="/settings/subscription">Get More Tokens</Link></Button>,
            duration: 7000,
          });
        } else {
          throw new Error(tokenResult.message || "Failed to deduct tokens for interview.");
        }
        setStage("setup"); 
        return;
      }
      
      toast({
        title: tokenResult.message.includes("skipped") ? "Pro User" : "Tokens Deducted",
        description: tokenResult.message.includes("skipped") ? `Mock interview started.` : `Successfully deducted ${tokenResult.deductedAmount} tokens. New balance: ${tokenResult.newTokenBalance}. Starting interview...`,
      });

    } catch (tokenError: any) {
      setError(`Token deduction failed: ${tokenError.message}`);
      toast({
        title: "Token Error",
        description: `Could not process token deduction for interview: ${tokenError.message}`,
        variant: "destructive",
      });
      setStage("setup"); 
      return;
    }

    setStage("first_question_loading");
    let attemptDetails = "";
    if (userGeminiApiKey) attemptDetails += "(Attempting your Gemini key). ";
    else if (userOpenaiApiKey) attemptDetails += "(Attempting your OpenAI key). ";
    else if (userClaudeApiKey) attemptDetails += "(Attempting your Claude key). ";

    try {
      const result: FirstQuestionOutput = await getFirstInterviewQuestion(fullConfigForFlow);
      setCurrentQuestion(result.firstQuestion);
      setStage("interviewing");
      startTimer();
      speakText(result.firstQuestion); 
      toast({
        title: "Interview Started!",
        description: `The first question is ready. ${attemptDetails}The timer has begun.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to start interview: ${errorMessage}`);
      setStage("error");
      toast({
        title: "Error Starting Interview",
        description: `Could not fetch the first question. ${attemptDetails}Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleToggleListen = async () => {
    if (!SpeechRecognition || !recognitionRef.current) {
      toast({ 
        title: "Voice Input Not Supported", 
        description: "Your browser doesn't support speech recognition. Please type your answer instead.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (isAISpeaking) {
        toast({ 
          title: "AI is speaking", 
          description: "Please wait for the AI to finish speaking before using voice input.", 
          variant: "default" 
        });
        return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    // Check internet connection before starting speech recognition
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      toast({
        title: "No Internet Connection",
        description: "Voice input requires an internet connection. Please check your connection or type your answer instead.",
        variant: "destructive",
        action: <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>,
        duration: 7000
      });
      return;
    }

    try {
      recognitionRef.current.start();
      toast({
        title: "Listening...",
        description: "Speak clearly into your microphone. The microphone will automatically stop when you finish speaking.",
        duration: 3000
      });
    } catch (e) {
       setIsListening(false); 
       let errorMsg = "Could not start voice input. ";
       let actionButton: React.ReactNode = null;
       
       if (e && typeof e === 'object' && 'name' in e) { 
          if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
              errorMsg += "Microphone access was denied. Please allow microphone access in your browser settings and refresh the page.";
              actionButton = <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh Page</Button>;
          } else if (e.name === 'InvalidStateError') {
              errorMsg += "Speech recognition is already active or in an invalid state. Please try again.";
          } else if (e.name === 'NetworkError') {
              errorMsg += "Network error. Please check your internet connection and try again.";
              actionButton = <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>;
          } else {
              errorMsg += "Please check your browser settings and microphone permissions.";
          }
       } else {
          errorMsg += "An unexpected error occurred. Please check your microphone and internet connection.";
       }
       
       toast({ 
         title: "Voice Input Error", 
         description: errorMsg, 
         variant: "destructive",
         ...(actionButton && { action: actionButton }),
         duration: 7000
       });
    }
  };

  const handleNextQuestion = async () => {
    if (!userAnswer.trim() || !currentQuestion || !interviewConfig) {
      toast({
        title: "Please provide an answer.",
        variant: "destructive",
      });
      return;
    }
    if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
    }
    if (speechSynthesis?.speaking) {
        speechSynthesis.cancel();
        setIsAISpeaking(false);
    }

    setStage("next_question_loading");
    setError(null);

    const currentExchange: InterviewExchange = { question: currentQuestion, answer: userAnswer.trim() };
    
    let attemptDetails = "";
    if (interviewConfig.geminiApiKey) attemptDetails += "(Attempting your Gemini key). ";
    else if (interviewConfig.openaiApiKey) attemptDetails += "(Attempting your OpenAI key). ";
    else if (interviewConfig.claudeApiKey) attemptDetails += "(Attempting your Claude key). ";

    try {
      const input: InterviewProgressionInput = {
        ...interviewConfig, // This now includes all API keys
        interviewHistory: [...interviewHistory, { question: currentQuestion, answer: userAnswer.trim() }],
      };
      const result: InterviewProgressionOutput = await getFeedbackAndNextQuestion(input);
      
      setInterviewHistory(prev => [...prev, currentExchange]);
      
      if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        if (isTTSEnabled) speakText(result.nextQuestion);
        setStage("interviewing");
         toast({ title: "Next Question Ready" });
      } else {
        setCurrentQuestion(null);
        toast({ title: "Interview Concluding", description: "The AI has no more questions."});
        handleEndInterview("no_more_questions");
      }
      setUserAnswer("");

    } catch (err) {
      setInterviewHistory(prev => [...prev, currentExchange]); 
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to get next question: ${errorMessage}`);
      setStage("error"); 
      toast({
        title: "Error Processing Answer",
        description: `Could not get the next question. ${attemptDetails}Please try again if the issue persists.`,
        variant: "destructive",
      });
      setIsAISpeaking(false);
    }
  };

  const handleEndInterview = async (reason: "timer_elapsed" | "timer_wrapping_up" | "manual" | "no_more_questions") => {
    stopTimer();
    setStage("final_feedback_loading");
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    
    // Stop all audio (ElevenLabs and browser TTS)
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (speechSynthesis?.speaking) speechSynthesis.cancel();
    setIsAISpeaking(false);

    let endMessage = "Interview ended. ";
    if (reason === "timer_elapsed") endMessage += "Time's up!";
    else if (reason === "timer_wrapping_up") endMessage += `Wrapping up as time is nearly complete (${INTERVIEW_WRAP_UP_SECONDS}s left).`;
    else if (reason === "manual") endMessage += "You ended the interview.";
    else if (reason === "no_more_questions") endMessage += "The AI has no more questions for you at this time.";

    toast({
        title: "Interview Over",
        description: `${endMessage} Generating final feedback...`,
    });

    if (!baseInterviewConfig || !interviewConfig ) { 
        toast({ title: "Not Enough Data", description: "Interview setup not complete.", variant: "destructive" });
        setStage("setup"); 
        return;
    }
    
    let finalInterviewHistory = [...interviewHistory];
    if (currentQuestion && userAnswer.trim() && (reason === "timer_elapsed" || reason === "timer_wrapping_up" || reason === "manual")) {
        const lastAnswerNotYetInHistory = !finalInterviewHistory.some(ex => ex.question === currentQuestion && ex.answer === userAnswer.trim());
        if (lastAnswerNotYetInHistory) {
            finalInterviewHistory.push({ question: currentQuestion, answer: userAnswer.trim() });
        }
    }
    if (finalInterviewHistory.length === 0 && currentQuestion && userAnswer.trim()){
         finalInterviewHistory.push({ question: currentQuestion, answer: userAnswer.trim() });
    }

    let generatedFeedback: FinalInterviewFeedbackOutput | null = null;
    let attemptDetails = "";
    if (interviewConfig.geminiApiKey) attemptDetails += "(Attempting your Gemini key). ";
    else if (interviewConfig.openaiApiKey) attemptDetails += "(Attempting your OpenAI key). ";
    else if (interviewConfig.claudeApiKey) attemptDetails += "(Attempting your Claude key). ";

    try {
      const input: FinalInterviewFeedbackInput = {
        ...interviewConfig, // Includes all API keys
        fullInterviewHistory: finalInterviewHistory.map(h => ({ question: h.question, answer: h.answer })),
      };
      generatedFeedback = await getFinalInterviewFeedback(input);
      setFinalFeedback(generatedFeedback);
      setStage("final_feedback_display");
      let farewellMessage = generatedFeedback.closingRemark || `Your interview is complete. You scored ${generatedFeedback.overallScore} out of 100. ${generatedFeedback.overallSummary}.`;
      if (generatedFeedback.closingRemark && reason !== "timer_wrapping_up" && reason !== "timer_elapsed") {
           farewellMessage = `${generatedFeedback.closingRemark} Overall, you scored ${generatedFeedback.overallScore}/100. ${generatedFeedback.overallSummary}`;
      } else if (reason === "timer_wrapping_up" || reason === "timer_elapsed") {
          farewellMessage = `${generatedFeedback.closingRemark} Thank you for your time. Your interview has concluded. You scored ${generatedFeedback.overallScore}/100. ${generatedFeedback.overallSummary}`;
      }

      speakText(farewellMessage);
      
      if (generatedFeedback && baseInterviewConfig) { // Ensure baseInterviewConfig exists
        await saveInterviewReport(generatedFeedback, baseInterviewConfig, finalInterviewHistory);
      }

    } catch (err) {
      let displayErrorMessage: string;
      let toastDescription: string;
      
      if (err instanceof Error) {
        if (err.message.includes("503") || err.message.toLowerCase().includes("overloaded") || err.message.toLowerCase().includes("service unavailable")) {
          displayErrorMessage = `The AI model is currently overloaded ${attemptDetails}and couldn't generate your final feedback. This is a temporary issue with the AI service. Please try again later.`;
          toastDescription = `The AI model is currently overloaded, so final feedback could not be generated ${attemptDetails}. Please try again in a few moments.`;
        } else {
          displayErrorMessage = `Failed to get final feedback ${attemptDetails}: ${err.message}`;
          toastDescription = `Could not generate the final interview report ${attemptDetails}. An unexpected error occurred.`;
        }
      } else {
        displayErrorMessage = `Failed to get final feedback ${attemptDetails}due to an unknown error.`;
        toastDescription = `Could not generate the final interview report ${attemptDetails}. An unexpected error occurred.`;
      }
      
      setError(displayErrorMessage);
      setStage("error");
      toast({
        title: "Final Feedback Error",
        description: toastDescription,
        variant: "destructive",
        duration: 7000, 
      });
    }
  };

  const saveInterviewReport = async (
    feedback: FinalInterviewFeedbackOutput,
    config: Omit<InterviewConfigInput, 'geminiApiKey'|'openaiApiKey'|'claudeApiKey'>, // Use base config for saving
    history: InterviewExchange[]
  ) => {
    if (!APPWRITE_DATABASE_ID || !INTERVIEWS_COLLECTION_ID) {
      toast({ title: "Configuration Error", description: "Interview saving is not configured.", variant: "destructive" });
      return;
    }
    setIsSavingReport(true);
    try {
      const user = await account.get();
      if (!user?.$id) {
        throw new Error("User not authenticated for saving report.");
      }

      const reportData: Omit<InterviewReport, keyof Models.Document | '$databaseId' | '$collectionId' | '$permissions'> = {
        userId: user.$id,
        jobDescription: config.jobDescription,
        resumeDataUri: config.resume,
        overallScore: feedback.overallScore,
        overallSummary: feedback.overallSummary,
        detailedFeedback: JSON.stringify(feedback.detailedFeedback), 
        rawInterviewHistory: JSON.stringify(history.map(h => ({ question: h.question, answer: h.answer } as InterviewExchangeForReport))),
        closingRemark: feedback.closingRemark || "",
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        INTERVIEWS_COLLECTION_ID,
        ID.unique(),
        reportData,
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );
      toast({
        title: "Interview Report Saved",
        description: "Your mock interview report, including all questions and feedback, has been saved.",
        action: <Save className="h-5 w-5 text-green-500" />,
      });
    } catch (err) {
      console.error("Error saving interview report:", err);
      let errMsg = "Could not save interview report.";
      if (err instanceof AppwriteException) errMsg = `Appwrite error: ${err.message}`;
      else if (err instanceof Error) errMsg = err.message;
      toast({
        title: "Save Report Failed",
        description: errMsg.substring(0, 150),
        variant: "destructive",
      });
    } finally {
      setIsSavingReport(false);
    }
  };

  const toggleTTS = () => {
    setIsTTSEnabled(prev => {
      const newTTSEnabledState = !prev;
      if (!newTTSEnabledState && speechSynthesis && speechSynthesis.speaking) {
        speechSynthesis.cancel();
        setIsAISpeaking(false);
      }
      toast({
        title: `AI Voice ${newTTSEnabledState ? "Enabled" : "Disabled"}`,
      });
      return newTTSEnabledState;
    });
  };

  const toggleCamera = async () => {
    setIsCameraBeingToggled(true);
    const newVideoEnabledState = !isVideoEnabled;
    setIsVideoEnabled(newVideoEnabledState);
    if (!newVideoEnabledState) {
        stopCameraStream();
        setHasCameraPermission(null); 
    }
    toast({ title: `Camera ${newVideoEnabledState ? "Enabled" : "Disabled"}` });
    setTimeout(() => setIsCameraBeingToggled(false), 500); 
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    stopTimer();
    setStage("setup");
    setError(null);
    setInterviewConfig(null);
    setBaseInterviewConfig(null);
    setInterviewHistory([]);
    setCurrentQuestion(null);
    setUserAnswer("");
    setIsAISpeaking(false);
    setIsListening(false);
    setFinalFeedback(null);
    setRemainingTime(INTERVIEW_DURATION_MINUTES * 60);
    stopCameraStream();
    setHasCameraPermission(null); 
    setIsVideoEnabled(true); 
  };

 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
    <div className="container mx-auto px-4 py-6 space-y-6 flex flex-col h-[calc(100vh-120px)]">
      {/* Modern Header Section */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                AI Mock Interview
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                stage === "interviewing" ? "bg-green-500 animate-pulse" : 
                stage === "setup" ? "bg-blue-500" :
                stage === "final_feedback_display" ? "bg-purple-500" :
                "bg-yellow-500"
              }`} />
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                {stage === "setup" && `✨ Practice your skills with AI-powered interviews • Cost: ${MOCK_INTERVIEW_TOKEN_COST} tokens`}
                {(stage === "token_check_loading" || stage === "first_question_loading" || stage === "next_question_loading" || stage === "final_feedback_loading") && "🤖 AI is processing your request..."}
                {stage === "interviewing" && "🎯 You're live! Show your best self"}
                {stage === "final_feedback_display" && "🎉 Interview complete! Review your performance"}
                {stage === "error" && "⚠️ Something went wrong"}
              </p>
            </div>
          </div>
          
          {/* Modern Control Panel */}
          {(stage === "interviewing" || stage === "next_question_loading" || stage === "final_feedback_loading" || stage === "final_feedback_display") && (
            <div className="flex items-center gap-3">
              {/* Enhanced Connection Status */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isOnline 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {isOnline ? 'Connected' : 'Offline'}
              </div>
              
              {/* Modern Control Buttons */}
              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
                <div className="relative">
                  <Button 
                    onClick={toggleTTS} 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-xl transition-all duration-300 ${
                      isTTSEnabled 
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                    title={`${isTTSEnabled ? "Mute AI Voice" : "Unmute AI Voice"} ${isElevenLabsAvailable ? "(ElevenLabs)" : "(Browser TTS)"}`}
                  >
                    {isTTSEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                  {/* ElevenLabs status indicator */}
                  {isTTSEnabled && (
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                      isElevenLabsAvailable ? 'bg-green-500' : 'bg-yellow-500'
                    }`} title={isElevenLabsAvailable ? 'ElevenLabs AI Voice Active' : 'Browser TTS Active'} />
                  )}
                </div>
                
                {(stage === "interviewing" || stage === "next_question_loading" || stage === "final_feedback_loading") && (
                  <Button 
                    onClick={toggleCamera} 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-xl transition-all duration-300 ${
                      isVideoEnabled 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                    title={isVideoEnabled ? "Turn Camera Off" : "Turn Camera On"} 
                    disabled={isCameraBeingToggled}
                  >
                    {isCameraBeingToggled ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      isVideoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert with Modern Design */}
      {error && stage === "error" && (
        <Alert variant="destructive" className="border-0 bg-red-50 dark:bg-red-950/50 backdrop-blur-xl rounded-2xl shadow-lg">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Something went wrong</AlertTitle>
          <AlertDescription className="text-base">
            {error} Please{" "}
            <Button variant="link" className="p-0 h-auto text-red-600 hover:text-red-700 font-semibold" onClick={handleRestart}>
              restart the interview
            </Button>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Modern Setup Card */}
      {stage === "setup" && (
        <div className="flex-grow flex items-center justify-center">
          <Card className="max-w-4xl w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <CardTitle className="font-headline text-3xl font-bold mb-2">
                🚀 Launch Your Interview
              </CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                Configure your {INTERVIEW_DURATION_MINUTES}-minute AI interview session. Our advanced AI will analyze your responses and provide detailed feedback.
              </CardDescription>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                  <TimerIcon className="h-4 w-4" />
                  {INTERVIEW_DURATION_MINUTES} minutes
                </div>
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                  <Sparkles className="h-4 w-4" />
                  {MOCK_INTERVIEW_TOKEN_COST} tokens
                </div>
              </div>
            </div>
            <CardContent className="p-8">
              <InterviewSetup 
                onSetupComplete={handleSetupComplete} 
                isProcessingSetup={stage === "first_question_loading" || stage === "token_check_loading"}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modern Loading States */}
      {(stage === "token_check_loading" || stage === "first_question_loading" || stage === "next_question_loading" || stage === "final_feedback_loading") && (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {stage === "token_check_loading" && "🔍 Verifying your tokens..."}
                {stage === "first_question_loading" && "🧠 AI is crafting your first question..."}
                {stage === "next_question_loading" && "⚡ Processing your response..."}
                {stage === "final_feedback_loading" && "📊 Generating your performance report..."}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                {stage === "token_check_loading" && "Checking your account balance"}
                {stage === "first_question_loading" && "Our AI is analyzing the job requirements"}
                {stage === "next_question_loading" && "Evaluating your answer and preparing the next question"}
                {stage === "final_feedback_loading" && "Creating detailed feedback and recommendations"}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Modern Interview Interface */}
      {(stage === "interviewing" || stage === "next_question_loading") && (currentQuestion || interviewHistory.length > 0) && (
        <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Enhanced Sidebar */}
          <div className="w-full lg:w-80 space-y-4 flex flex-col">
            {/* Modern Timer Card */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600">
                <CardTitle className="font-headline text-lg flex items-center text-slate-800 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg mr-3">
                    <TimerIcon className="h-4 w-4 text-white" />
                  </div>
                  Interview Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <p className="text-4xl font-mono font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatTime(remainingTime)}
                  </p>
                  <Progress 
                    value={(remainingTime / (INTERVIEW_DURATION_MINUTES * 60)) * 100} 
                    className="h-3 bg-slate-200 dark:bg-slate-700" 
                  />
                  {remainingTime <= INTERVIEW_WRAP_UP_SECONDS && remainingTime > 0 && (
                    <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm font-medium">Wrapping up soon...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Enhanced Camera Section */}
            <div className="flex-grow flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className={`p-1 rounded-lg ${isVideoEnabled && hasCameraPermission ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {isVideoEnabled && hasCameraPermission ? (
                    <Video className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <VideoOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Your Camera</h3>
              </div>
              
              <div className="relative flex-grow bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800" />
                <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                  {isVideoEnabled ? (
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover rounded-2xl" 
                      autoPlay 
                      muted 
                      playsInline 
                    />
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="p-6 bg-slate-200/50 dark:bg-slate-600/50 rounded-full mx-auto w-fit">
                        <CameraOff className="h-12 w-12 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Camera is off</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Camera Status Alerts */}
              {isVideoEnabled && hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-3 border-0 bg-red-50 dark:bg-red-950/50 rounded-xl">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-sm font-semibold">Camera Access Denied</AlertTitle>
                  <AlertDescription className="text-sm">
                    Please enable camera permissions in your browser settings.
                  </AlertDescription>
                </Alert>
              )}
              
              {isVideoEnabled && hasCameraPermission === null && !isCameraBeingToggled && (
                <Alert className="mt-3 border-0 bg-blue-50 dark:bg-blue-950/50 rounded-xl">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertTitle className="text-sm font-semibold">Initializing Camera</AlertTitle>
                  <AlertDescription className="text-sm">
                    Requesting camera access...
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Modern End Interview Button */}
              <Button 
                onClick={() => handleEndInterview("manual")} 
                variant="outline" 
                className="w-full mt-4 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl py-3"
                disabled={stage === "next_question_loading" || stage === "final_feedback_loading"}
              >
                <StopCircle className="mr-2 h-5 w-5" />
                End Interview
              </Button>
            </div>
          </div>

          {/* Enhanced Main Interview Panel */}
          <Card className="flex-grow flex flex-col bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
            {/* AI Interviewer Header */}
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border-b border-slate-200/50 dark:border-slate-600/50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-75 animate-pulse"></div>
                  <div className="relative p-2 bg-white dark:bg-slate-800 rounded-full">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-grow">
                  <CardTitle className="font-headline text-xl flex items-center text-slate-800 dark:text-white">
                    AI Interview Assistant
                    {isAISpeaking && (
                      <div className="ml-3 flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full text-sm">
                        <Volume2 className="h-3 w-3 animate-pulse" />
                        Speaking
                      </div>
                    )}
                  </CardTitle>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
                    Powered by advanced AI • Real-time analysis
                  </p>
                </div>
              </div>
            </CardHeader>
            
            {/* Conversation Area */}
            <CardContent className="flex-grow flex flex-col p-6 overflow-hidden">
              <ScrollArea className="flex-grow pr-4">
                <div className="space-y-6">
                  {interviewHistory.map((exchange, index) => (
                    <div key={index} className="space-y-4">
                      {/* AI Question */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-grow bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl rounded-tl-none p-4 shadow-sm">
                          <p className="font-semibold text-slate-800 dark:text-white mb-2">AI Interviewer</p>
                          <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {exchange.question}
                          </p>
                        </div>
                      </div>
                      
                      {/* User Answer */}
                      <div className="flex gap-3 justify-end">
                        <div className="flex-grow max-w-[85%] bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl rounded-tr-none p-4 text-white shadow-lg">
                          <p className="font-semibold mb-2">Your Response</p>
                          <p className="whitespace-pre-wrap leading-relaxed opacity-95">
                            {exchange.answer}
                          </p>
                        </div>
                        <div className="flex-shrink-0 p-2 bg-blue-500 rounded-full">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Current Question */}
                  {currentQuestion && (stage === "interviewing" || (stage === "next_question_loading" && !interviewHistory.find(h => h.question === currentQuestion && !!h.answer))) && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-grow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl rounded-tl-none p-4 border-2 border-blue-200 dark:border-blue-700 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-blue-800 dark:text-blue-200">AI Interviewer</p>
                          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {currentQuestion}
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Enhanced Answer Input */}
              {stage === "interviewing" && currentQuestion && (
                <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-600/50">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Textarea 
                        placeholder={isListening ? "🎤 Listening... Speak clearly and confidently." : "💭 Type your response or click the microphone to speak..."}
                        rows={4} 
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="flex-grow text-base border-0 bg-slate-50 dark:bg-slate-700 rounded-2xl shadow-inner focus:ring-2 focus:ring-blue-500 resize-none"
                        disabled={stage === "next_question_loading" || isListening || isAISpeaking}
                      />
                      
                      {/* Enhanced Voice Input Button */}
                      {SpeechRecognition && (
                        <Button 
                          onClick={handleToggleListen} 
                          variant={isListening ? "destructive" : (!isOnline ? "secondary" : "outline")}
                          size="lg"
                          className={`px-4 rounded-2xl transition-all duration-300 ${
                            isListening 
                              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse' 
                              : !isOnline 
                                ? 'bg-slate-300 dark:bg-slate-600' 
                                : 'bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border-2 border-blue-200 dark:border-blue-700'
                          }`}
                          disabled={stage === "next_question_loading" || isAISpeaking || !isOnline}
                          title={
                            !isOnline 
                              ? "Voice input requires internet connection" 
                              : isListening 
                                ? "Click to stop listening" 
                                : "Click to start voice input"
                          }
                        >
                          {!isOnline ? (
                            <MicOff className="h-5 w-5 text-slate-500" />
                          ) : isListening ? (
                            <MicOff className="h-5 w-5" />
                          ) : (
                            <Mic className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {/* Enhanced Submit Button */}
                    <Button 
                      onClick={handleNextQuestion} 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                      disabled={stage === "next_question_loading" || !userAnswer.trim() || isListening || isAISpeaking}
                    >
                      {stage === "next_question_loading" ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Processing Your Response...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-3 h-5 w-5" />
                          Submit Answer & Continue
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Final Feedback Display */}
      {stage === "final_feedback_display" && finalFeedback && (
        <Card className="flex-grow flex flex-col bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <CardTitle className="font-headline text-3xl font-bold flex items-center">
                  <Award className="mr-4 h-8 w-8" /> 
                  Interview Complete! 🎉
                </CardTitle>
                <CardDescription className="text-purple-100 text-lg">
                  {finalFeedback.closingRemark && (
                    <p className="italic mb-2 text-white/90">"{finalFeedback.closingRemark}"</p>
                  )}
                  Here's your comprehensive performance analysis and personalized feedback.
                  {isSavingReport && (
                    <span className="ml-2 text-sm italic flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving to your profile...
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button 
                onClick={handleRestart} 
                variant="secondary" 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl px-6 py-3"
              >
                🚀 New Interview
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-grow overflow-y-auto p-8 space-y-8">
            {/* Enhanced Score Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-0 rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl w-fit mx-auto">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Overall Score</p>
                    <p className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {finalFeedback.overallScore}
                      <span className="text-2xl text-slate-400">/100</span>
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    finalFeedback.overallScore >= 80 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : finalFeedback.overallScore >= 50 
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {finalFeedback.overallScore >= 80 ? '🌟 Excellent' : finalFeedback.overallScore >= 50 ? '👍 Good' : '📈 Needs Improvement'}
                  </div>
                </div>
              </Card>
              
              <Card className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border-0 rounded-2xl p-6">
                <h3 className="font-headline text-xl font-bold mb-4 flex items-center">
                  {finalFeedback.overallScore >= 80 ? (
                    <ThumbsUp className="mr-3 text-green-500 h-6 w-6" />
                  ) : finalFeedback.overallScore >= 50 ? (
                    <Sparkles className="mr-3 text-yellow-500 h-6 w-6" />
                  ) : (
                    <ThumbsDown className="mr-3 text-red-500 h-6 w-6" />
                  )}
                  Performance Summary
                </h3>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {finalFeedback.overallSummary}
                </p>
              </Card>
            </div>
            
            <Separator className="bg-slate-200 dark:bg-slate-600" />

            {/* Enhanced Detailed Feedback */}
            <div>
              <h3 className="font-headline text-2xl font-bold mb-6 flex items-center text-slate-800 dark:text-white">
                <MessageSquare className="mr-3 text-blue-500 h-7 w-7" />
                Question-by-Question Analysis
              </h3>
              
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {finalFeedback.detailedFeedback.map((item, index) => (
                    <Card key={index} className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 border-0 rounded-2xl p-6 shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                              Q{index + 1}
                            </span>
                            {item.questionScore !== undefined && (
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                item.questionScore >= 8 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : item.questionScore >= 6
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {item.questionScore}/10
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                            {item.question}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />
                            Your Response
                          </p>
                          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border-l-4 border-blue-500">
                            <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {item.answer || (
                                <span className="italic text-slate-500 dark:text-slate-400">
                                  No response provided
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center">
                            <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                            AI Feedback & Recommendations
                          </p>
                          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border-l-4 border-purple-500">
                            <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {item.specificFeedback}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {finalFeedback.detailedFeedback.length === 0 && (
                    <div className="text-center py-12">
                      <div className="p-6 bg-slate-100 dark:bg-slate-700 rounded-2xl w-fit mx-auto mb-4">
                        <MessageSquare className="h-12 w-12 text-slate-400 mx-auto" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-lg">
                        No questions were answered during this interview session.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>
      )}
    </div>
  </div>
);
}
export default MockInterviewPage;