"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { account, databases, Query, APPWRITE_DATABASE_ID, LECTURES_COLLECTION_ID, AppwriteException } from "@/lib/appwrite";
import type { Lecture } from "@/types/lecture";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, AlertTriangle, Loader2, PlusCircle, History, Eye, Brain, Sparkles, Calendar, BarChart3, RefreshCw, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from "next/navigation";

export default function LectureHistoryPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchLectures = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await account.get();
      if (!user?.$id) {
        throw new AppwriteException("User not authenticated.", 401, "user_unauthorized");
      }

      if (!APPWRITE_DATABASE_ID || !LECTURES_COLLECTION_ID) {
        setError("Appwrite database/collection IDs are not configured in your environment variables.");
        setIsLoading(false);
        return;
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        LECTURES_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(50)
        ]
      );
      setLectures(response.documents as Lecture[]);
    } catch (err: any) {
      console.error("Lecture history auth/data fetch error:", err);
      if (err instanceof AppwriteException && 
          (err.code === 401 || 
           err.type === 'user_unauthorized' || 
           err.type === 'general_unauthorized_scope')) {
        toast({ title: "Session Expired", description: "Please log in to view lecture history.", variant: "default" });
        router.push('/login');
      } else {
          let errorMessage = "Could not fetch your saved lectures.";
          if (err.message) {
              errorMessage = err.message;
          }
          setError(errorMessage);
          toast({
            title: "Error Fetching Lectures",
            description: errorMessage.substring(0,150),
            variant: "destructive",
          });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [router, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-full">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                🎓 Loading Your Lectures...
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Fetching your AI-generated lecture library
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
                  <History className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Lecture Library
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                🎓 Review and access your AI-generated lectures • Total: {lectures.length} lecture{lectures.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchLectures} disabled={isLoading} className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border-2">
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button asChild className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl shadow-lg">
                <Link href="/lectures">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Lecture
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        {lectures.length > 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{lectures.length}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Lectures</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
        {!isLoading && !error && lectures.length === 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl text-center py-16">
            <CardHeader>
              <div className="mx-auto mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full opacity-20 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-full">
                    <BookOpen className="h-16 w-16 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="font-headline text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                No Lectures Saved Yet
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 dark:text-slate-400 mt-4">
                🚀 Ready to start your AI-powered learning journey? Create your first lecture now!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl shadow-lg px-8 py-4 text-lg">
                <Link href="/lectures">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Your First Lecture
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lecture Cards Grid */}
        {!isLoading && !error && lectures.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lectures.map((lecture) => (
              <Card key={lecture.$id} className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:scale-[1.02]">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex-shrink-0">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="font-headline text-lg font-bold line-clamp-2 text-slate-900 dark:text-white" title={lecture.topic}>
                        {lecture.topic}
                      </CardTitle>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span>Saved {formatDistanceToNow(new Date(lecture.$createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow pt-0">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200">AI Summary</p>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 line-clamp-3 leading-relaxed">
                      {lecture.summary || "No summary available for this lecture."}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-slate-200 dark:border-slate-600">
                  <Button variant="outline" className="w-full rounded-xl border-2 hover:bg-slate-50 dark:hover:bg-slate-700" asChild>
                    <Link href={`/lectures/view/${lecture.$id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Lecture
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}