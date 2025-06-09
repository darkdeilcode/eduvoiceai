"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Languages, 
  Brain, 
  Video, 
  Zap, 
  AlertCircle, 
  History, 
  Coins,
  Trophy,
  Users,
  Globe,
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  Star
} from "lucide-react";
import { account, databases, APPWRITE_DATABASE_ID, USERS_COLLECTION_ID } from "@/lib/appwrite";
import type { Models } from "appwrite";
import type { LanguageTestConfig, LanguageTestSession, LanguageTestResponse, LanguageTestReport, TavusAPIConfig, ConversationTurn } from "@/types/languageTest";

// Import components
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { VideoConferenceSpeakingTest } from "@/components/language/VideoConferenceSpeakingTest";
import { SpeakingTestReport } from "@/components/language/SpeakingTestReport";

type PageState = 'selection' | 'video-test' | 'report' | 'loading';

interface UserProfileDocument extends Models.Document {
  token_balance?: number;
  subscription_status?: string;
}

export default function EnhancedLanguagePage() {
  const [pageState, setPageState] = useState<PageState>('selection');
  const [currentUser, setCurrentUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [testSession, setTestSession] = useState<LanguageTestSession | null>(null);
  const [testResponses, setTestResponses] = useState<LanguageTestResponse[]>([]);
  const [testReport, setTestReport] = useState<LanguageTestReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  // Initialize user and token balance
  useEffect(() => {
    const initializeUser = async () => {
      try {
        setIsLoading(true);
        const user = await account.get();
        setCurrentUser(user);

        if (APPWRITE_DATABASE_ID && USERS_COLLECTION_ID) {
          try {
            const userDoc = await databases.getDocument(
              APPWRITE_DATABASE_ID,
              USERS_COLLECTION_ID,
              user.$id
            ) as UserProfileDocument;
            
            setUserTokenBalance(userDoc.token_balance ?? 0);
          } catch (dbError: any) {
            console.error('Error fetching user token balance:', dbError);
            setUserTokenBalance(0);
          }
        }
      } catch (authError: any) {
        console.error('Authentication error:', authError);
        toast({
          title: "Authentication Required",
          description: "Please log in to access language testing.",
          variant: "destructive",
        });
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [router, toast]);

  const handleStartTest = async (
    config: LanguageTestConfig, 
    tavusConfig?: TavusAPIConfig, 
    testMode: 'conversational' = 'conversational', // Always conversational
    cviOptions?: { replicaId?: string; personaId?: string }
  ) => {
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "Please log in to start a language test.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setPageState('loading');

      const response = await fetch('/api/language-test/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          config, 
          tavusConfig,
          userId: currentUser.$id,
          testMode,
          cviOptions
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast({
            title: "Insufficient Tokens",
            description: result.message || "You don't have enough tokens for this test.",
            variant: "destructive",
          });
          setPageState('selection');
          return;
        }
        throw new Error(result.error || 'Failed to start test');
      }

      setTestSession(result.session);
      setTestResponses([]);
      setUserTokenBalance(result.tokenBalance);
      
      // Always use video-test mode for conversational AI
      setPageState('video-test');
      
      // Show CVI conversation details
      if (result.cvi) {
        toast({
          title: "AI Conversation Ready",
          description: `Your AI conversation partner is ready! Join the video call to start your ${config.language} test.`,
          duration: 5000,
        });
      }

      toast({
        title: "Test Started",
        description: `Generated ${result.questionsGenerated} questions for your ${config.language} test.`,
      });

    } catch (error: any) {
      console.error('Error starting test:', error);
      toast({
        title: "Test Start Failed",
        description: error.message || "Unable to start the language test.",
        variant: "destructive",
      });
      setPageState('selection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async (response: LanguageTestResponse) => {
    if (!testSession) return;

    try {
      setIsSubmitting(true);

      // Add response to current responses
      const updatedResponses = [...testResponses, response];
      setTestResponses(updatedResponses);

      // Check if this is the last question
      const isLastQuestion = testSession.questions && testSession.currentQuestionIndex !== undefined 
        ? testSession.currentQuestionIndex === testSession.questions.length - 1
        : false;

      if (isLastQuestion) {
        // Complete the test
        await handleCompleteTest(updatedResponses);
      } else {
        // Move to next question
        const updatedSession = {
          ...testSession,
          currentQuestionIndex: (testSession.currentQuestionIndex ?? 0) + 1,
          responses: updatedResponses
        };
        setTestSession(updatedSession);
      }

    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTest = async (finalResponses?: LanguageTestResponse[] | ConversationTurn[]) => {
    if (!testSession) return;

    try {
      setIsLoading(true);
      setPageState('loading');

      // Debug logging
      console.log('🔍 HandleCompleteTest Debug:', {
        testSessionMode: testSession.testMode,
        testSessionId: testSession.id,
        finalResponsesLength: finalResponses?.length || 0,
        finalResponses: finalResponses,
        hasSessionId: !!testSession.id
      });

      // Check if we have conversation data (CVI mode) or traditional responses
      const isConversationalMode = testSession.testMode === 'conversational' && Array.isArray(finalResponses) && finalResponses.length > 0 && 'speaker' in finalResponses[0];
      
      let evaluationPayload;
      
      if (isConversationalMode) {
        // For conversational mode, send conversation turns with test config
        evaluationPayload = {
          sessionId: testSession.id,
          conversationTurns: finalResponses as ConversationTurn[],
          testConfig: {
            language: testSession.config.language,
            languageCode: testSession.config.languageCode, 
            difficulty: testSession.config.difficulty
          }
        };
      } else {
        // For traditional mode, send responses (fallback - shouldn't happen in current streamlined version)
        evaluationPayload = {
          session: testSession,
          responses: (finalResponses as LanguageTestResponse[]) || testResponses,
          userId: currentUser?.$id
        };
      }

      console.log('🔍 Evaluation Payload:', evaluationPayload);

      const response = await fetch('/api/language-test/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to evaluate test');
      }

      setTestReport(result.report);
      setPageState('report');

      toast({
        title: result.report.isPassed ? "Test Passed! 🎉" : "Test Completed",
        description: result.report.isPassed 
          ? `Congratulations! You passed with ${result.report.overallScore}% (Required: ${result.report.passThreshold}%)`
          : `You scored ${result.report.overallScore}% (Required: ${result.report.passThreshold}%). Keep practicing!`,
        variant: result.report.isPassed ? "default" : "destructive",
      });

    } catch (error: any) {
      console.error('Error completing test:', error);
      toast({
        title: "Evaluation Failed",
        description: error.message || "Unable to evaluate your test.",
        variant: "destructive",
      });
      setPageState('selection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTest = () => {
    setTestSession(null);
    setTestResponses([]);
    setPageState('selection');
    toast({
      title: "Test Cancelled",
      description: "Your language test has been cancelled.",
    });
  };

  const handleRetakeTest = () => {
    if (testSession) {
      handleStartTest(testSession.config, testSession.tavusConfig, 'conversational');
    }
  };

  const handleStartVideoTest = async (
    config: LanguageTestConfig, 
    tavusConfig?: TavusAPIConfig,
    useConversationalMode: boolean = true, // Always true now
    cviOptions?: { replicaId?: string; personaId?: string }
  ) => {
    // Always use conversational mode with CVI
    await handleStartTest(config, tavusConfig, 'conversational', cviOptions);
  };

  const handleShareReport = async () => {
    if (!testReport) return;

    try {
      const passFailText = testReport.isPassed ? "PASSED" : "did not pass";
      const shareText = `I ${passFailText} my ${testReport.language} language test with ${testReport.overallScore}% (${testReport.cefrLevel} level)!`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Language Test Report - ${testReport.language}`,
          text: shareText,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        const text = `${shareText} Take your language test on EduVoice AI!`;
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied to Clipboard",
          description: "Test result copied to clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  const handleDownloadReport = () => {
    if (!testReport) return;

    // Create a simple text report
    const reportText = `
EduVoice AI Language Test Report
===============================

Test Result: ${testReport.isPassed ? '✅ PASSED' : '❌ NOT PASSED'}
${testReport.resultMessage}

Test Details:
Language: ${testReport.language}
Difficulty: ${testReport.difficulty}
Test Type: ${testReport.testType}
Date: ${new Date(testReport.createdAt).toLocaleDateString()}

Performance Summary:
Overall Score: ${testReport.overallScore}%
Required Score: ${testReport.passThreshold}%
CEFR Level: ${testReport.cefrLevel}

Skill Breakdown:
- Pronunciation: ${testReport.skillScores.pronunciation}%
- Fluency: ${testReport.skillScores.fluency}%
- Grammar: ${testReport.skillScores.grammar}%
- Vocabulary: ${testReport.skillScores.vocabulary}%
- Coherence: ${testReport.skillScores.coherence}%

General Feedback: ${testReport.generalFeedback}

Recommendations:
${testReport.recommendations.map(rec => `- ${rec}`).join('\n')}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `language-test-report-${testReport.languageCode}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Your test report has been downloaded.",
    });
  };

  const handleBackToSelection = () => {
    setTestSession(null);
    setTestResponses([]);
    setTestReport(null);
    setPageState('selection');
  };

  if (isLoading && pageState !== 'video-test') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card className="border-0 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">Initializing Language Hub</p>
                <p className="text-gray-600 dark:text-gray-400">Setting up your personalized language learning experience...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Language Assessment Hub
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Master any language with AI-powered conversation practice and comprehensive CEFR evaluation
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Token Balance Display */}
              <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Your Tokens</p>
                      <p className="text-xl font-bold text-amber-900 dark:text-amber-100">{userTokenBalance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* History Button */}
              <Button 
                variant="outline" 
                onClick={() => router.push('/language/history')}
                className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 border-blue-200 dark:border-blue-800"
              >
                <History className="h-4 w-4" />
                Test History
              </Button>
            </div>
          </div>

          {/* Stats Cards Row */}
          {pageState === 'selection' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Languages</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">12+</p>
                    </div>
                    <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">AI Avatars</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">Real-time</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 dark:text-green-400 text-sm font-medium">CEFR Levels</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">A1-C2</p>
                    </div>
                    <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Feedback</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">Instant</p>
                    </div>
                    <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Feature Overview */}
          {pageState === 'selection' && (
            <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950 dark:via-purple-950 dark:to-blue-950 border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl text-blue-900 dark:text-blue-100">
                  <Brain className="h-7 w-7 text-purple-600" />
                  AI-Powered Language Assessment
                </CardTitle>
                <CardDescription className="text-lg text-blue-700 dark:text-blue-300">
                  Experience natural conversation with AI avatars and receive instant, detailed feedback aligned with international CEFR standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="group p-6 rounded-xl bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all duration-300 hover:shadow-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900 group-hover:scale-110 transition-transform duration-300">
                        <Video className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-lg">Realistic AI Avatars</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">Powered by Tavus.io technology for natural conversation flow and immersive language practice</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-6 rounded-xl bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all duration-300 hover:shadow-lg border border-purple-100 dark:border-purple-800">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900 group-hover:scale-110 transition-transform duration-300">
                        <Trophy className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900 dark:text-purple-100 mb-2 text-lg">CEFR Assessment</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">Official European framework evaluation with detailed skill breakdown from A1 to C2 levels</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-6 rounded-xl bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all duration-300 hover:shadow-lg border border-green-100 dark:border-green-800">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900 group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="h-7 w-7 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100 mb-2 text-lg">Instant Analysis</p>
                        <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">Advanced AI evaluation of pronunciation, fluency, grammar, vocabulary, and coherence</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Loading State */}
          {pageState === 'loading' && (
            <Card className="border-0 shadow-xl">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 dark:border-blue-800"></div>
                  <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0 left-0 [animation-duration:1.5s]"></div>
                  <div className="animate-spin rounded-full h-20 w-20 border-r-4 border-purple-600 absolute top-0 left-0 [animation-duration:2s]"></div>
                </div>
                <div className="text-center space-y-3">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Preparing Your Test</p>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    {testSession ? 'Setting up AI conversation partner and generating personalized questions...' : 'Processing your responses with advanced AI language models...'}
                  </p>
                  <div className="flex items-center gap-2 justify-center mt-6">
                    <div className="h-3 w-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-3 w-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-3 w-3 bg-blue-600 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Based on State */}
          {pageState === 'selection' && (
            <div className="space-y-6">
              <LanguageSelector
                onStartTest={handleStartTest}
                onStartVideoTest={handleStartVideoTest}
                userTokenBalance={userTokenBalance}
                isLoading={isLoading}
              />
            </div>
          )}

          {pageState === 'video-test' && testSession && (
            <VideoConferenceSpeakingTest
              session={testSession}
              onCompleteTest={handleCompleteTest}
              onCancelTest={handleCancelTest}
            />
          )}

          {pageState === 'report' && testReport && (
            <SpeakingTestReport
              report={testReport}
              onRetakeTest={handleRetakeTest}
              onShareReport={handleShareReport}
              onDownloadReport={handleDownloadReport}
              onBackToSelection={handleBackToSelection}
            />
          )}

          {/* Enhanced Error State */}
          {!currentUser && !isLoading && (
            <Card className="border-0 shadow-xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-red-700 dark:text-red-300 text-xl">
                  <AlertCircle className="h-6 w-6" />
                  Authentication Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-red-600 dark:text-red-400 text-lg">
                  Please log in to access our advanced language testing features.
                </p>
                <Button 
                  onClick={() => router.push('/login')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
