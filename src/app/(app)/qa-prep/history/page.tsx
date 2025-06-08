"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { account, databases, Query, APPWRITE_DATABASE_ID, QA_REPORTS_COLLECTION_ID, AppwriteException } from "@/lib/appwrite";
import type { QAReport } from "@/types/qaReport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { History, AlertTriangle, Loader2, PlusCircle, PlayCircle, FileText, Eye, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Brain, Target, Sparkles, Calendar, Trophy, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from 'date-fns';
import { useRouter } from "next/navigation";

export default function QAPrepHistoryPage() {
  const [reports, setReports] = useState<QAReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, [router, toast]);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await account.get();
      if (!user?.$id) {
        throw new AppwriteException("User not authenticated.", 401, "user_unauthorized");
      }

      if (!APPWRITE_DATABASE_ID || !QA_REPORTS_COLLECTION_ID) {
        setError("Appwrite database/collection IDs are not configured for Q&A reports.");
        setIsLoading(false);
        return;
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        QA_REPORTS_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(50) 
        ]
      );
      setReports(response.documents as QAReport[]);
    } catch (err: any) {
      console.error("Q&A Prep history auth/data fetch error:", err);
      if (err instanceof AppwriteException && 
          (err.code === 401 || 
           err.type === 'user_unauthorized' || 
           err.type === 'general_unauthorized_scope')) {
        toast({ title: "Session Expired", description: "Please log in to view Q&A Prep history.", variant: "default" });
        router.push('/login');
      } else {
          let errorMessage = "Could not fetch your saved Q&A Prep reports.";
          if (err.message) {
              errorMessage = err.message;
          }
          setError(errorMessage);
          toast({
            title: "Error Fetching Reports",
            description: errorMessage.substring(0,150),
            variant: "destructive",
          });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string, reportTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${reportTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(reportId));
    
    try {
      await databases.deleteDocument(APPWRITE_DATABASE_ID, QA_REPORTS_COLLECTION_ID, reportId);
      setReports(prev => prev.filter(report => report.$id !== reportId));
      toast({
        title: "Quiz Deleted",
        description: `"${reportTitle}" has been successfully deleted.`,
        variant: "default",
      });
    } catch (err: any) {
      console.error("Error deleting report:", err);
      toast({
        title: "Delete Failed",
        description: `Failed to delete "${reportTitle}". Please try again.`,
        variant: "destructive",
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const getStatusInfo = (status: QAReport['status']) => {
    switch (status) {
      case 'generated': 
        return { 
          text: 'Ready to Take', 
          color: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0',
          icon: <PlayCircle className="h-3 w-3" />
        };
      case 'in_progress': 
        return { 
          text: 'In Progress', 
          color: 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0',
          icon: <Clock className="h-3 w-3" />
        };
      case 'in_progress_evaluation': 
        return { 
          text: 'Evaluating...', 
          color: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0',
          icon: <RefreshCw className="h-3 w-3 animate-spin" />
        };
      case 'completed': 
        return { 
          text: 'Completed', 
          color: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'error_generating': 
        return { 
          text: 'Error Generating', 
          color: 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-0',
          icon: <XCircle className="h-3 w-3" />
        };
      case 'error_evaluating': 
        return { 
          text: 'Error Evaluating', 
          color: 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-0',
          icon: <AlertCircle className="h-3 w-3" />
        };
      case 'aborted': 
        return { 
          text: 'Aborted', 
          color: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white border-0',
          icon: <XCircle className="h-3 w-3" />
        };
      default: 
        return { 
          text: 'Unknown', 
          color: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white border-0',
          icon: <AlertCircle className="h-3 w-3" />
        };
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400 font-bold';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400 font-bold';
    return 'text-red-600 dark:text-red-400 font-bold';
  };

  const getScoreGradient = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  // Calculate stats
  const completedQuizzes = reports.filter(r => r.status === 'completed');
  const averageScore = completedQuizzes.length > 0 
    ? completedQuizzes.reduce((acc, r) => acc + (r.overallScore || 0), 0) / completedQuizzes.length 
    : 0;
  const totalQuestions = reports.reduce((acc, r) => acc + r.numQuestionsGenerated, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-full">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                🧠 Loading Your Quizzes...
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Fetching your AI-generated quiz history
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                  <History className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Quiz History
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                🎯 Review and take your AI-generated quizzes • Total: {reports.length} quiz{reports.length !== 1 ? 'es' : ''}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchReports} disabled={isLoading} className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border-2">
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl shadow-lg">
                <Link href="/qa-prep">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generate New Quiz
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{reports.length}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Quizzes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedQuizzes.length}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {averageScore > 0 ? Math.round(averageScore) : '0'}%
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Alert */}
        {error && !isLoading && (
          <Alert variant="destructive" className="border-0 bg-red-50 dark:bg-red-950/50 backdrop-blur-xl rounded-2xl shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Loading Error</AlertTitle>
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && reports.length === 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl text-center py-16">
            <CardHeader>
              <div className="mx-auto mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-full">
                    <Brain className="h-16 w-16 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="font-headline text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                No Quizzes Generated Yet
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 dark:text-slate-400 mt-4">
                🚀 Ready to start your AI-powered learning journey? Create your first quiz now!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl shadow-lg px-8 py-4 text-lg">
                <Link href="/qa-prep">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Your First Quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quiz Cards Grid */}
        {!isLoading && !error && reports.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => {
              const statusInfo = getStatusInfo(report.status);
              const isDeleting = deletingIds.has(report.$id);
              const scorePercentage = report.overallScore && (report.maxScore || report.numQuestionsGenerated) 
                ? (report.overallScore / (report.maxScore || report.numQuestionsGenerated)) * 100 
                : 0;
              
              return (
                <Card key={report.$id} className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:scale-[1.02]">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="font-headline text-lg font-bold line-clamp-2 text-slate-900 dark:text-white" title={report.quizTitle}>
                          {report.quizTitle}
                        </CardTitle>
                      </div>
                      <Badge className={`${statusInfo.color} flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full shadow-lg`}>
                        {statusInfo.icon}
                        {statusInfo.text}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-slate-700 dark:text-slate-300 truncate">{report.pdfFileName || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-500" />
                            <span className="text-slate-700 dark:text-slate-300">{report.numQuestionsGenerated} Questions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span className="text-slate-700 dark:text-slate-300">{report.durationMinutes} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <span className="text-slate-700 dark:text-slate-300">{formatDistanceToNow(new Date(report.$createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {report.completedAt && (
                        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <span>Completed {format(new Date(report.completedAt), 'MMM d, yyyy HH:mm')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow pt-0 space-y-4">
                    {report.status === 'completed' && report.overallScore !== null && report.overallScore !== undefined && (
                      <div className={`bg-gradient-to-r ${getScoreGradient(report.overallScore, report.maxScore || report.numQuestionsGenerated)} rounded-xl p-4 text-white`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium opacity-90">Final Score</p>
                            <p className="text-2xl font-bold">
                              {report.overallScore} / {report.maxScore || report.numQuestionsGenerated}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold">{Math.round(scorePercentage)}%</div>
                            <div className="text-sm opacity-90">
                              {scorePercentage >= 80 ? '🏆 Excellent' : scorePercentage >= 60 ? '👍 Good' : '📚 Keep Learning'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {report.status === 'error_generating' && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <p className="text-sm text-red-700 dark:text-red-300">Quiz generation failed. Please try creating a new quiz.</p>
                        </div>
                      </div>
                    )}
                    
                    {report.status === 'error_evaluating' && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">Evaluation failed. You can still retake this quiz.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex w-full gap-2">
                      {report.status === 'generated' && (
                        <Button variant="default" className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl" asChild>
                          <Link href={`/qa-prep/exam/${report.$id}`}>
                            <PlayCircle className="mr-2 h-4 w-4" /> Take Exam
                          </Link>
                        </Button>
                      )}
                      
                      {report.status === 'in_progress' && (
                        <Button variant="secondary" className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-xl" asChild>
                          <Link href={`/qa-prep/exam/${report.$id}`}>
                            <Clock className="mr-2 h-4 w-4" /> Continue Exam
                          </Link>
                        </Button>
                      )}
                      
                      {report.status === 'completed' && (
                        <Button variant="outline" className="flex-1 rounded-xl border-2" asChild>
                          <Link href={`/qa-prep/exam/${report.$id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Report
                          </Link>
                        </Button>
                      )}
                      
                      {(report.status === 'error_evaluating' || report.status === 'aborted') && (
                        <Button variant="secondary" className="flex-1 rounded-xl" asChild>
                          <Link href={`/qa-prep/exam/${report.$id}`}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Retake Quiz
                          </Link>
                        </Button>
                      )}
                      
                      {report.status === 'in_progress_evaluation' && (
                        <Button variant="secondary" className="flex-1 rounded-xl" disabled>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Evaluating...
                        </Button>
                      )}
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                      onClick={() => handleDeleteReport(report.$id, report.quizTitle)}
                      disabled={isDeleting || report.status === 'in_progress_evaluation'}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete Quiz
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}