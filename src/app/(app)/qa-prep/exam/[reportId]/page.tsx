"use client";
console.log("ExamPage file loaded: /qa-prep/exam/[reportId]/page.tsx"); // Debug log

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { account, databases, APPWRITE_DATABASE_ID, QA_REPORTS_COLLECTION_ID, AppwriteException } from "@/lib/appwrite";
import type { QAReport, QAResultDetail } from "@/types/qaReport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, ArrowLeft, ArrowRight, Send, Timer, CheckCircle, XCircle, Info, Brain, Target, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

export default function ExamPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [report, setReport] = useState<QAReport | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examCompleted, setExamCompleted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadExamData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setExamCompleted(false); 
    setEvaluationResult(null); 
    setCurrentQuestionIndex(0);
    setUserAnswers({});

    try {
      if (!reportId) {
        throw new Error("Report ID is missing.");
      }
      await account.get(); 

      const fetchedReport = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        QA_REPORTS_COLLECTION_ID,
        reportId
      ) as QAReport;

      setReport(fetchedReport);
      const parsedQuestions = JSON.parse(fetchedReport.generatedQuestions || "[]") as string[];
      const parsedCorrectAnswers = JSON.parse(fetchedReport.generatedCorrectAnswers || "[]") as string[];
      setQuestions(parsedQuestions);
      setCorrectAnswers(parsedCorrectAnswers);

      if (fetchedReport.status === "completed") {
        setExamCompleted(true);
        const parsedDetailedFeedback = fetchedReport.userAnswersAndFeedback ? JSON.parse(fetchedReport.userAnswersAndFeedback) : [];
        setEvaluationResult({
            overallScore: fetchedReport.overallScore || 0,
            overallFeedback: fetchedReport.overallFeedback || "Overall feedback not available for this completed exam.",
            detailedFeedback: parsedDetailedFeedback,
        });
        
        const answers: Record<number, string> = {};
        parsedDetailedFeedback.forEach((item: QAResultDetail, index: number) => {
            if (item.userAnswer) answers[index] = item.userAnswer;
        });
        setUserAnswers(answers);
        setIsLoading(false);
        return; 
      }
      
      const takeableStatuses: Array<QAReport['status']> = ["generated", "in_progress", "error_evaluating"];
      if (!takeableStatuses.includes(fetchedReport.status)) {
        setError(`This exam cannot be taken. Current status: ${fetchedReport.status}. Please try generating a new quiz or contact support if this persists.`);
        setIsLoading(false);
        return;
      }
      
      if (fetchedReport.startedAt && fetchedReport.status === "in_progress") {
        const startTime = new Date(fetchedReport.startedAt).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const initialDurationSeconds = fetchedReport.durationMinutes * 60;
        const newRemainingTime = Math.max(0, initialDurationSeconds - elapsedSeconds);
        setRemainingTime(newRemainingTime);
        if (newRemainingTime <= 0 && fetchedReport.status !== "generated" && fetchedReport.status !== "error_evaluating") {
            handleFinishExam("timer_expired_on_load");
            return;
        }
      } else {
        setRemainingTime(fetchedReport.durationMinutes * 60);
      }

      if (fetchedReport.status === "generated" || fetchedReport.status === "error_evaluating") {
        const newStartedAt = new Date().toISOString();
        await databases.updateDocument(APPWRITE_DATABASE_ID, QA_REPORTS_COLLECTION_ID, reportId, {
          startedAt: newStartedAt,
          status: "in_progress"
        });
        setReport(prev => prev ? {...prev, startedAt: newStartedAt, status: "in_progress"} : null);
      }

    } catch (err: any) {
      console.error("Error fetching exam data:", err);
      let specificError = "Could not load the exam. Please try again.";
      if (err instanceof AppwriteException) {
        if (err.code === 401) {
            toast({ title: "Unauthorized", description: "Please log in.", variant: "destructive"});
            router.push('/login');
            return;
        } else if (err.code === 404) {
            specificError = "Exam not found. It might have been deleted or the link is incorrect.";
        } else {
            specificError = `Appwrite Error: ${err.message}`;
        }
      } else if (err.message) {
        specificError = err.message;
      }
      setError(specificError);
      toast({ title: "Error", description: specificError, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [reportId, router, toast]); 

  useEffect(() => {
    loadExamData();
  }, [loadExamData]); 

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (remainingTime === null || remainingTime <= 0 || examCompleted || isLoading || (report && report.status !== "in_progress")) return;

    timerRef.current = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime === null) return null;
        if (prevTime <= 1) {
          clearInterval(timerRef.current!);
          handleFinishExam("timer_expired");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }, [remainingTime, examCompleted, isLoading, report?.status]); 

  useEffect(() => {
    if (remainingTime !== null && remainingTime > 0 && !isLoading && !examCompleted && report?.status === "in_progress") {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingTime, isLoading, examCompleted, report?.status, startTimer]);

  const handleAnswerChange = (index: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [index]: answer }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Simple client-side evaluation using stored correct answers
  const evaluateAnswersClientSide = () => {
    const answersArray = questions.map((_, index) => userAnswers[index] || "");
    const detailedFeedback: QAResultDetail[] = [];
    let correctCount = 0;

    questions.forEach((question, index) => {
      const userAnswer = answersArray[index];
      const correctAnswer = correctAnswers[index] || "";
      
      // Simple comparison - you can make this more sophisticated
      const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ||
                       userAnswer.trim().toLowerCase().includes(correctAnswer.trim().toLowerCase()) ||
                       correctAnswer.trim().toLowerCase().includes(userAnswer.trim().toLowerCase());
      
      if (isCorrect) correctCount++;

      detailedFeedback.push({
        questionText: question,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        score: isCorrect ? 1 : 0,
        correctAnswer: correctAnswer,
        aiFeedback: isCorrect 
          ? "Correct! Well done." 
          : `Incorrect. The correct answer is: ${correctAnswer}`
      });
    });

    return {
      overallScore: correctCount,
      overallFeedback: `You scored ${correctCount} out of ${questions.length} questions correctly. ${correctCount >= questions.length * 0.7 ? 'Great job!' : 'Keep studying and try again!'}`,
      detailedFeedback: detailedFeedback
    };
  };

  const handleFinishExam = useCallback(async (reason: "manual" | "timer_expired" | "timer_expired_on_load") => {
    if (isSubmitting || examCompleted || !report) {
        return;
    }
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    toast({ title: "Submitting Exam...", description: "Please wait while we evaluate your answers." });

    const answersArray = questions.map((_, index) => userAnswers[index] || "");

    try {
      await databases.updateDocument(APPWRITE_DATABASE_ID, QA_REPORTS_COLLECTION_ID, reportId, {
        status: "in_progress_evaluation"
      });
      setReport(prev => prev ? { ...prev, status: 'in_progress_evaluation' } : null);

      // Use client-side evaluation since we have the correct answers
      const evaluationData = evaluateAnswersClientSide();
      console.log("ExamPage: Client-side evaluation data:", evaluationData.overallScore);
      
      setEvaluationResult(evaluationData);

      const apiPayload = {
          reportId: reportId,
          evaluationData: evaluationData, 
          userAnswers: answersArray,
      };

      const submissionResponse = await fetch('/api/qa-prep/submit-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      const submissionResultText = await submissionResponse.text();
      let submissionResult;
      try {
        submissionResult = JSON.parse(submissionResultText);
      } catch(e) {
         console.error("Failed to parse JSON from /api/qa-prep/submit-evaluation:", submissionResultText);
         throw new Error(`Server returned non-JSON response: ${submissionResultText.substring(0,100)}...`);
      }

      if (!submissionResponse.ok) {
        throw new Error(submissionResult.message || "Failed to save evaluation results to the backend.");
      }
      
      const updatedReport = await databases.getDocument(APPWRITE_DATABASE_ID, QA_REPORTS_COLLECTION_ID, reportId) as QAReport;
      setReport(updatedReport);

      setExamCompleted(true);
      toast({
        title: "Exam Finished & Evaluated!",
        description: `Your score: ${evaluationData.overallScore}/${updatedReport.maxScore || questions.length}. ${evaluationData.overallFeedback.substring(0, 100)}...`,
        className: "bg-green-100 border-green-300 text-green-800",
        duration: 8000,
      });

    } catch (err: any) {
      console.error("Error finishing exam (client-side):", err);
      setError(`Failed to submit or evaluate exam: ${err.message}`);
      toast({ title: "Submission Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, examCompleted, report, questions, userAnswers, correctAnswers, reportId, toast]);

  const formatTimeDisplay = (seconds: number | null) => {
    if (seconds === null) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                🧠 Loading Exam...
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Preparing your AI-generated quiz
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !examCompleted) { 
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Alert variant="destructive" className="border-0 bg-red-50 dark:bg-red-950/50 backdrop-blur-xl rounded-2xl shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Error Loading Exam</AlertTitle>
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
          <Button variant="outline" asChild className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
            <Link href="/qa-prep/history">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Quizzes
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  if (!report || (questions.length === 0 && !examCompleted)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 space-y-6 text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-8">
            <p className="text-slate-600 dark:text-slate-300 text-lg mb-6">Exam data could not be loaded or no questions found.</p>
            <Button variant="outline" asChild className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
              <Link href="/qa-prep/history">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Quizzes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (examCompleted && evaluationResult && report) {
    const scorePercentage = (evaluationResult.overallScore / (report.maxScore || report.numQuestionsGenerated)) * 100;
    const isExcellent = scorePercentage >= 90;
    const isGood = scorePercentage >= 70;
    const isFair = scorePercentage >= 50;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Enhanced Header Section */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isExcellent ? 'bg-gradient-to-r from-green-500 to-emerald-600' : isGood ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : isFair ? 'bg-gradient-to-r from-yellow-500 to-orange-600' : 'bg-gradient-to-r from-red-500 to-pink-600'}`}>
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Exam Results
                  </h1>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  🎯 {report.quizTitle}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Completed: {report.completedAt ? format(new Date(report.completedAt), 'PPpp') : "N/A"}
                </p>
              </div>
              
              <Button variant="outline" asChild className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
                <Link href="/qa-prep/history">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to My Quizzes
                </Link>
              </Button>
            </div>
          </div>

          {/* Score Overview Card */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className={`text-white p-8 ${isExcellent ? 'bg-gradient-to-r from-green-600 to-emerald-600' : isGood ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : isFair ? 'bg-gradient-to-r from-yellow-600 to-orange-600' : 'bg-gradient-to-r from-red-600 to-pink-600'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="font-headline text-3xl font-bold">
                    {isExcellent ? '🏆 Excellent!' : isGood ? '🎉 Well Done!' : isFair ? '👍 Good Effort!' : '📚 Keep Learning!'}
                  </CardTitle>
                  <CardDescription className="text-white/90 text-lg mt-2">
                    Your Score: {evaluationResult.overallScore} / {report.maxScore || report.numQuestionsGenerated} ({Math.round(scorePercentage)}%)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6">
                <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-white">Performance Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{evaluationResult.overallScore}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Correct Answers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{(report.maxScore || report.numQuestionsGenerated) - evaluationResult.overallScore}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Incorrect Answers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.round(scorePercentage)}%</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Overall Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Feedback Card */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-3xl">
              <CardTitle className="font-headline text-2xl flex items-center">
                <Brain className="mr-3 h-6 w-6" />
                AI Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {evaluationResult.overallFeedback || "Overall feedback not generated."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Card */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-6 rounded-t-3xl">
              <CardTitle className="font-headline text-2xl flex items-center">
                <Info className="mr-3 h-6 w-6" />
                Detailed Question Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {evaluationResult.detailedFeedback.map((item: QAResultDetail, index: number) => (
                <Card key={index} className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${item.isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {item.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-slate-800 dark:text-white">Q{index + 1}: {item.questionText}</p>
                        </div>
                      </div>
                      
                      <div className="pl-11 space-y-3">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Your Answer:</p>
                          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {item.userAnswer || <span className="italic text-slate-500">No answer provided.</span>}
                          </p>
                        </div>
                        
                        {item.isCorrect === false && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Correct Answer:</p>
                            <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">{item.correctAnswer}</p>
                          </div>
                        )}
                        
                        <div className={`rounded-xl p-4 border ${item.isCorrect ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'}`}>
                          <p className="text-sm font-medium mb-2 flex items-center">
                            <span className={item.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                              AI Feedback (Score: {item.score || 0}):
                            </span>
                          </p>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${item.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            {item.aiFeedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {evaluationResult.detailedFeedback.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">No detailed feedback available for individual questions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestionText = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timeWarning = remainingTime !== null && remainingTime <= 300; // 5 minutes warning

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 space-y-6 h-screen flex flex-col">
        {/* Enhanced Header */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    {report.quizTitle}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300">
                    Question {currentQuestionIndex + 1} of {questions.length} • Duration: {report.durationMinutes} min
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`flex items-center gap-3 p-3 border rounded-2xl backdrop-blur-sm font-mono text-lg font-bold ${timeWarning ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' : 'bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600'}`}>
              <Timer className={`h-5 w-5 ${timeWarning ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
              <span>{formatTimeDisplay(remainingTime)}</span>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <div className="relative">
              <Progress value={progressPercentage} className="h-3 bg-slate-200 dark:bg-slate-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-80" style={{width: `${progressPercentage}%`}} />
            </div>
          </div>
        </div>

        {/* Main Exam Card */}
        <Card className="flex-grow flex flex-col bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="flex-grow flex flex-col p-8 space-y-6">
            {/* Question Display */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 min-h-[120px] flex items-center">
              <div className="w-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-500 rounded-xl">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Question {currentQuestionIndex + 1}</span>
                </div>
                <p className="text-lg font-medium text-slate-800 dark:text-white leading-relaxed whitespace-pre-wrap">
                  {currentQuestionText}
                </p>
              </div>
            </div>
            
            {/* Answer Input */}
            <div className="flex-grow flex flex-col">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Your Answer
              </label>
              <Textarea
                placeholder="Type your detailed answer here... Be as specific and comprehensive as possible."
                value={userAnswers[currentQuestionIndex] || ""}
                onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                className="flex-grow text-base rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 min-h-[200px] resize-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                disabled={isSubmitting || examCompleted}
              />
            </div>
          </CardContent>

          {/* Enhanced Footer */}
          <CardFooter className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-t border-slate-200 dark:border-slate-600 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0 || isSubmitting || examCompleted}
                className="rounded-xl border-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>{Object.keys(userAnswers).length} of {questions.length} answered</span>
              </div>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  variant="outline"
                  onClick={handleNextQuestion}
                  disabled={isSubmitting || examCompleted}
                  className="rounded-xl border-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleFinishExam("manual")}
                  disabled={isSubmitting || examCompleted}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-xl shadow-lg px-8 py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Finish Exam & Get Results
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}