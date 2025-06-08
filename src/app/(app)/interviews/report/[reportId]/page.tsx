"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { account, databases, APPWRITE_DATABASE_ID, INTERVIEWS_COLLECTION_ID, AppwriteException } from "@/lib/appwrite";
import type { InterviewReport } from "@/types/interviewReport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, FileText, ArrowLeft, ThumbsUp, ThumbsDown, Sparkles, Award, MessageSquare, Calendar, Clock, TrendingUp, Target, Download, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import type { FinalInterviewFeedbackOutput } from "@/ai/flows/final-interview-feedback-flow";

type DetailedFeedbackItem = FinalInterviewFeedbackOutput['detailedFeedback'][0];

export default function ViewInterviewReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [detailedFeedback, setDetailedFeedback] = useState<DetailedFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setError("Report ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await account.get();

        const document = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          INTERVIEWS_COLLECTION_ID,
          reportId
        );
        const fetchedReport = document as InterviewReport;
        setReport(fetchedReport);

        if (fetchedReport.detailedFeedback) {
          try {
            const parsedFeedback = JSON.parse(fetchedReport.detailedFeedback) as DetailedFeedbackItem[];
            setDetailedFeedback(parsedFeedback);
          } catch (parseError) {
            console.error("Failed to parse detailedFeedback JSON:", parseError);
            setError("Error parsing detailed feedback from the report.");
            setDetailedFeedback([]);
          }
        }

      } catch (err: any) {
        console.error("Error fetching interview report:", err);
        if (err instanceof AppwriteException) {
          if (err.code === 401 || err.type === 'user_unauthorized' || err.type === 'general_unauthorized_scope') {
            toast({ title: "Authentication Error", description: "Please log in to view this report.", variant: "destructive" });
            router.push('/login');
            return;
          } else if (err.code === 404 || err.type === 'document_not_found') {
            setError("Interview report not found. It may have been deleted or you may not have permission to view it.");
          } else if (err.code === 403 || err.type === 'user_forbidden' ) {
             setError("You do not have permission to view this report.");
          } else {
            setError(`Could not load report: ${err.message}`);
          }
        } else {
          setError("An unexpected error occurred while fetching the report.");
        }
        toast({ title: "Error Loading Report", description: error || "Failed to load interview report.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportId, router, toast, error]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <div className="text-center space-y-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full">
                  <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  📊 Loading Your Report...
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  Retrieving your interview performance analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Modern Header */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    Error Loading Report
                  </h1>
                </div>
              </div>
              <Button variant="outline" asChild className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>

          <Alert variant="destructive" className="border-0 bg-red-50 dark:bg-red-950/50 backdrop-blur-xl rounded-2xl shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Something went wrong</AlertTitle>
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
            <div className="flex justify-between items-center">
              <h1 className="font-headline text-3xl font-bold text-slate-800 dark:text-white">Report Not Found</h1>
              <Button variant="outline" asChild className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
          
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
            <CardContent className="text-center py-16">
              <div className="p-6 bg-slate-100 dark:bg-slate-700 rounded-2xl w-fit mx-auto mb-6">
                <FileText className="h-16 w-16 text-slate-400 mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold mb-2">Oops! Report not available</CardTitle>
              <CardDescription className="text-lg">We couldn't find the interview report you were looking for.</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Interview Report
                </h1>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Target className="h-4 w-4" />
                  <p className="text-sm">
                    <span className="font-medium">Position:</span> {report.jobDescription.substring(0,100)}{report.jobDescription.length > 100 ? '...' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <p className="text-xs">
                    Created {formatDistanceToNow(new Date(report.$createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" asChild className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <CardTitle className="font-headline text-3xl font-bold flex items-center">
                  <Award className="mr-4 h-8 w-8" /> 
                  Performance Overview
                </CardTitle>
                {report.closingRemark && (
                  <CardDescription className="text-blue-100 text-lg italic">
                    "{report.closingRemark}"
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Enhanced Score Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-0 rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl w-fit mx-auto">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Overall Score</p>
                    <p className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {report.overallScore}
                      <span className="text-2xl text-slate-400">/100</span>
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    report.overallScore >= 80 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : report.overallScore >= 50 
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {report.overallScore >= 80 ? '🌟 Excellent' : report.overallScore >= 50 ? '👍 Good' : '📈 Needs Improvement'}
                  </div>
                </div>
              </Card>
              
              <Card className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border-0 rounded-2xl p-6">
                <h3 className="font-headline text-xl font-bold mb-4 flex items-center">
                  {report.overallScore >= 80 ? (
                    <ThumbsUp className="mr-3 text-green-500 h-6 w-6" />
                  ) : report.overallScore >= 50 ? (
                    <Sparkles className="mr-3 text-yellow-500 h-6 w-6" />
                  ) : (
                    <ThumbsDown className="mr-3 text-red-500 h-6 w-6" />
                  )}
                  Performance Summary
                </h3>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {report.overallSummary}
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
              
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {detailedFeedback && detailedFeedback.length > 0 ? (
                    detailedFeedback.map((item, index) => (
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
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-6 bg-slate-100 dark:bg-slate-700 rounded-2xl w-fit mx-auto mb-4">
                        <MessageSquare className="h-12 w-12 text-slate-400 mx-auto" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-lg">
                        No detailed feedback available for individual questions.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Target className="mr-2 h-5 w-5 text-blue-500" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl">
                Practice Another Interview
              </Button>
              <Button variant="outline" className="w-full rounded-xl">
                Review Similar Questions
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-green-500" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Questions Answered</span>
                <span className="font-semibold">{detailedFeedback.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Report Generated</span>
                <span className="font-semibold">{formatDistanceToNow(new Date(report.$createdAt), { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}