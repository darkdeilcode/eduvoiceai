
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Languages, Brain, Video, Zap, AlertCircle, History } from "lucide-react";
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

export default function LanguagePage() {
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

        // Get current user
        const user = await account.get();
        setCurrentUser(user);

        // Fetch user token balance
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
    return (    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold flex items-center">
            <Languages className="mr-3 h-8 w-8 text-primary" /> Language Testing
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered language proficiency assessment with CEFR level evaluation.
          </p>
        </div>
        {pageState === 'selection' && (
          <Button 
            variant="outline" 
            onClick={() => router.push('/language/history')}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Test History
          </Button>
        )}
      </div>

        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold flex items-center">
            <Languages className="mr-3 h-8 w-8 text-primary" /> AI Conversation Testing
          </h1>
          <p className="text-muted-foreground mt-1">
            Practice languages through natural AI conversations with Tavus CVI technology.
          </p>
        </div>
        {pageState === 'selection' && (
          <Button 
            variant="outline" 
            onClick={() => router.push('/language/history')}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Test History
          </Button>
        )}
      </div>

      {/* Feature Overview */}
      {pageState === 'selection' && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Brain className="h-5 w-5" />
              Comprehensive Language Assessment
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Test your language skills with AI-powered evaluation and get detailed CEFR-aligned feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">AI Video Avatars</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Interact with Tavus.io powered AI avatars</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">CEFR Assessment</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Get official CEFR level evaluation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Instant Feedback</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Detailed analysis and recommendations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {pageState === 'loading' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-center">
              <p className="font-medium">Processing Your Test</p>
              <p className="text-sm text-muted-foreground">
                {testSession ? 'Generating questions with AI...' : 'Evaluating your responses...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Based on State */}
      {pageState === 'selection' && (
        <LanguageSelector
          onStartTest={handleStartTest}
          onStartVideoTest={handleStartVideoTest}
          userTokenBalance={userTokenBalance}
          isLoading={isLoading}
        />
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

      {/* Error State */}
      {!currentUser && !isLoading && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400 mb-4">
              You need to be logged in to access the language testing feature.
            </p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
