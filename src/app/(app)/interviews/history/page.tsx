"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { account, databases, Query, APPWRITE_DATABASE_ID, INTERVIEWS_COLLECTION_ID, AppwriteException } from "@/lib/appwrite";
import type { InterviewReport } from "@/types/interviewReport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, AlertTriangle, Loader2, PlusCircle, History, Eye, Calendar, TrendingUp, Award, Clock, Filter, Search, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from "next/navigation";

export default function InterviewHistoryPage() {
  const [reports, setReports] = useState<InterviewReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchInterviewReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await account.get();
        if (!user?.$id) {
          throw new AppwriteException("User not authenticated.", 401, "user_unauthorized");
        }

        if (!APPWRITE_DATABASE_ID || !INTERVIEWS_COLLECTION_ID) {
          setError("Appwrite database/collection IDs are not configured for interviews.");
          setIsLoading(false);
          return;
        }

        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          INTERVIEWS_COLLECTION_ID,
          [
            Query.equal("userId", user.$id),
            Query.orderDesc("$createdAt"),
            Query.limit(50)
          ]
        );
        setReports(response.documents as InterviewReport[]);
      } catch (err: any) {
        console.error("Interview history auth/data fetch error:", err);
        if (err instanceof AppwriteException && 
            (err.code === 401 || 
             err.type === 'user_unauthorized' || 
             err.type === 'general_unauthorized_scope')) {
          toast({ title: "Session Expired", description: "Please log in to view interview history.", variant: "default" });
          router.push('/login');
        } else {
            let errorMessage = "Could not fetch your saved interview reports.";
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

    fetchInterviewReports();
  }, [router, toast]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '🏆';
    if (score >= 60) return '👍';
    return '📈';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <History className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Interview History
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                📊 Track your progress and review past interview performances
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg">
                <Link href="/interviews">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Interview
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          {!isLoading && !error && reports.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/40 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-xl">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200 font-semibold text-lg">{reports.length}</p>
                    <p className="text-blue-600 dark:text-blue-300 text-sm">Total Interviews</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/40 rounded-2xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-xl">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
                      {reports.length > 0 ? Math.round(reports.reduce((acc, r) => acc + r.overallScore, 0) / reports.length) : 0}
                    </p>
                    <p className="text-green-600 dark:text-green-300 text-sm">Average Score</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/40 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-xl">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-purple-800 dark:text-purple-200 font-semibold text-lg">
                      {reports.filter(r => r.overallScore >= 80).length}
                    </p>
                    <p className="text-purple-600 dark:text-purple-300 text-sm">Excellent Scores</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && !isLoading && (
          <Alert variant="destructive" className="border-0 bg-red-50 dark:bg-red-950/50 backdrop-blur-xl rounded-2xl shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Something went wrong</AlertTitle>
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center space-y-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full">
                  <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  📊 Loading Your Reports...
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  Retrieving your interview history
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && reports.length === 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
            <CardContent className="text-center py-16">
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse"></div>
                  <div className="relative p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-3xl w-fit mx-auto">
                    <FileText className="h-16 w-16 text-blue-500 mx-auto" />
                  </div>
                </div>
                <div className="space-y-3">
                  <CardTitle className="font-headline text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Start Your Journey! 🚀
                  </CardTitle>
                  <CardDescription className="text-lg text-slate-600 dark:text-slate-300">
                    You haven't completed any mock interviews yet. Take your first interview to unlock powerful AI insights and feedback.
                  </CardDescription>
                </div>
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg px-8 py-4 text-lg">
                  <Link href="/interviews">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Take Your First Interview
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports Grid */}
        {!isLoading && !error && reports.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.$id} className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                {/* Card Header with Gradient */}
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border-b border-slate-200/50 dark:border-slate-600/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow space-y-2">
                      <CardTitle className="font-headline text-lg line-clamp-2 text-slate-800 dark:text-white" title={`Interview for: ${report.jobDescription}`}>
                        🎯 {report.jobDescription.substring(0, 60)}{report.jobDescription.length > 60 ? '...' : ''}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <CardDescription className="text-xs">
                          {formatDistanceToNow(new Date(report.$createdAt), { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Score Display */}
                <div className="px-6 py-4">
                  <div className={`${getScoreBgColor(report.overallScore)} rounded-2xl p-4 text-center`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl">{getScoreIcon(report.overallScore)}</span>
                      <span className={`text-3xl font-bold ${getScoreColor(report.overallScore)}`}>
                        {report.overallScore}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-lg">/100</span>
                    </div>
                    <p className={`text-sm font-medium ${getScoreColor(report.overallScore)}`}>
                      {report.overallScore >= 80 ? 'Excellent Performance' : 
                       report.overallScore >= 60 ? 'Good Performance' : 
                       'Room for Improvement'}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <CardContent className="flex-grow px-6 pb-4">
                  <div className="space-y-2">
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Summary</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {report.overallSummary || "No summary provided."}
                    </p>
                  </div>
                </CardContent>

                {/* Action Button */}
                <CardFooter className="px-6 pb-6">
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-blue-50 group-hover:border-blue-200 dark:group-hover:bg-blue-950/30 dark:group-hover:border-blue-700 transition-all duration-300 rounded-xl" 
                    asChild
                  >
                    <Link href={`/interviews/report/${report.$id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Report
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Placeholder */}
        {!isLoading && !error && reports.length >= 50 && (
          <div className="flex justify-center">
            <Button variant="outline" className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
              Load More Reports
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}