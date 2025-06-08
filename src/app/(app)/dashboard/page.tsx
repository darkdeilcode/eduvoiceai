"use client";

import { Greeting } from "@/components/dashboard/Greeting";
import { NavigationButtons } from "@/components/dashboard/NavigationButtons";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BookCopy, 
  FileText, 
  Loader2, 
  ShieldAlert, 
  ArrowRight, 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Crown, 
  Users, 
  BarChart3, 
  Settings, 
  Award,
  Clock,
  Target,
  Activity,
  ChevronRight,
  Coins,
  Flame,
  Star
} from "lucide-react";
import { useEffect, useState } from "react";
import { account, databases, Query, APPWRITE_DATABASE_ID, LECTURES_COLLECTION_ID, INTERVIEWS_COLLECTION_ID, AppwriteException } from "@/lib/appwrite";
import type { Lecture } from "@/types/lecture";
import type { InterviewReport } from "@/types/interviewReport";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { ADMIN_NAV_ITEMS } from "@/lib/constants";

// Add the collection ID constant
const USERS_COLLECTION_ID = "683e10f50000d93a4d9a";
const FREE_TOKEN_ALLOWANCE = 60000;

interface DashboardActivityItem {
  id: string;
  title: string;
  timestamp: string;
  href: string;
}

interface DashboardStats {
  totalLectures: number;
  totalInterviews: number;
  tokensUsed: number;
  streakDays: number;
}

export default function DashboardPage() {
  const [userNameForGreeting, setUserNameForGreeting] = useState<string | null>(null);
  const [recentLectures, setRecentLectures] = useState<DashboardActivityItem[]>([]);
  const [isLoadingLectures, setIsLoadingLectures] = useState(true);
  const [recentInterviewReports, setRecentInterviewReports] = useState<DashboardActivityItem[]>([]);
  const [isLoadingInterviewReports, setIsLoadingInterviewReports] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLectures: 0,
    totalInterviews: 0,
    tokensUsed: 0,
    streakDays: 0
  });

  const router = useRouter();
  const { toast } = useToast();

  // Calculate token usage percentage (assuming 60,000 is the monthly limit)
  const tokenLimit = 60000;
  const tokenUsagePercentage = tokenBalance !== null ? Math.max(0, ((tokenLimit - tokenBalance) / tokenLimit) * 100) : 0;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoadingLectures(true);
      setIsLoadingInterviewReports(true);
      setIsLoadingUserProfile(true);
      setIsAdmin(false);
      
      try {
        const currentUser = await account.get();
        if (!currentUser?.$id) {
          router.push("/login");
          return;
        }
        setUserNameForGreeting(currentUser.name || "User");

        const userIsAdmin = currentUser.labels && currentUser.labels.includes('admin');
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          setTokenBalance(null);
          setRecentLectures([]);
          setRecentInterviewReports([]);
          setIsLoadingUserProfile(false);
          setIsLoadingLectures(false);
          setIsLoadingInterviewReports(false);
        } else {
          const userId = currentUser.$id;
          let userTokenBalance = FREE_TOKEN_ALLOWANCE; // Default

          // Fetch User Profile Document with auto-creation
          if (APPWRITE_DATABASE_ID && USERS_COLLECTION_ID) {
            try {
              // Try to get existing user document
              const userProfileDoc = await databases.getDocument(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, userId);
              userTokenBalance = (userProfileDoc as any).token_balance ?? FREE_TOKEN_ALLOWANCE;
              setTokenBalance(userTokenBalance);
              console.log("Dashboard: Found user profile, token balance:", userTokenBalance);
            } catch (profileError: any) {
              console.error("Failed to fetch user profile for token balance:", profileError);
              
              if (profileError.code === 404) {
                // User document doesn't exist, create it
                console.log("Dashboard: User document not found, creating new one...");
                try {
                  const newUserDoc = await databases.createDocument(
                    APPWRITE_DATABASE_ID,
                    USERS_COLLECTION_ID,
                    userId,
                    {
                      email: currentUser.email,
                      username: currentUser.name || currentUser.email.split('@')[0],
                      token_balance: FREE_TOKEN_ALLOWANCE,
                      subscription_status: 'trial',
                      subscription_end_date: null
                    }
                  );
                  userTokenBalance = (newUserDoc as any).token_balance ?? FREE_TOKEN_ALLOWANCE;
                  setTokenBalance(userTokenBalance);
                  console.log("Dashboard: Created new user document, token balance:", userTokenBalance);
                  
                  // Show welcome toast
                  toast({
                    title: "Welcome to EduVoice AI! 🎉",
                    description: "Your account has been set up with 60,000 free tokens.",
                    duration: 5000,
                  });
                } catch (createError: any) {
                  console.error("Dashboard: Failed to create user document:", createError);
                  setTokenBalance(userTokenBalance); // Use default
                }
              } else {
                // Other error, set default
                setTokenBalance(userTokenBalance);
              }
            }
          } else {
            console.error("Dashboard: Missing database or collection configuration");
            console.log("Dashboard: APPWRITE_DATABASE_ID:", APPWRITE_DATABASE_ID);
            console.log("Dashboard: USERS_COLLECTION_ID:", USERS_COLLECTION_ID);
            setTokenBalance(userTokenBalance); // Use default
          }
          setIsLoadingUserProfile(false);

          // Fetch Recent Lectures
          if (APPWRITE_DATABASE_ID && LECTURES_COLLECTION_ID) {
            try {
              const lecturesResponse = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                LECTURES_COLLECTION_ID,
                [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(5)]
              );
              const lecturesData = lecturesResponse.documents.map(doc => {
                const lecture = doc as Lecture;
                return {
                  id: lecture.$id,
                  title: lecture.topic,
                  timestamp: formatDistanceToNow(new Date(lecture.$createdAt), { addSuffix: true }),
                  href: `/lectures/view/${lecture.$id}`
                };
              });
              setRecentLectures(lecturesData);
              
              // Update stats
              setStats(prev => ({ 
                ...prev, 
                totalLectures: lecturesResponse.total,
                tokensUsed: FREE_TOKEN_ALLOWANCE - userTokenBalance
              }));
            } catch (lectureError) {
              console.error("Failed to fetch recent lectures:", lectureError);
            }
          }
          setIsLoadingLectures(false);

          // Fetch Recent Interview Reports
          if (APPWRITE_DATABASE_ID && INTERVIEWS_COLLECTION_ID) {
            try {
              const interviewsResponse = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                INTERVIEWS_COLLECTION_ID,
                [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(5)]
              );
              const interviewsData = interviewsResponse.documents.map(doc => {
                const report = doc as InterviewReport;
                return {
                  id: report.$id,
                  title: `Interview: ${report.jobDescription.substring(0, 50)}${report.jobDescription.length > 50 ? '...' : ''}`,
                  timestamp: formatDistanceToNow(new Date(report.$createdAt), { addSuffix: true }),
                  href: `/interviews/report/${report.$id}`
                };
              });
              setRecentInterviewReports(interviewsData);
              
              // Update stats
              setStats(prev => ({ 
                ...prev, 
                totalInterviews: interviewsResponse.total,
                streakDays: Math.floor(Math.random() * 14) + 1 // Mock data
              }));
            } catch (interviewError) {
              console.error("Failed to fetch recent interview reports:", interviewError);
            }
          }
          setIsLoadingInterviewReports(false);
        }
      } catch (error) {
        console.error("Dashboard auth/data fetch error:", error);
        if (error instanceof AppwriteException && 
            (error.code === 401 || error.type === 'user_unauthorized' || error.type === 'general_unauthorized_scope')) {
          toast({ title: "Session Expired", description: "Please log in again.", variant: "default" });
          router.push('/login');
        } else {
          toast({ title: "Error Loading Dashboard", description: "Could not load dashboard data. Please try again later.", variant: "destructive" });
        }
        setRecentLectures([]);
        setRecentInterviewReports([]);
        setIsLoadingUserProfile(false);
        setIsLoadingLectures(false);
        setIsLoadingInterviewReports(false);
        setIsAdmin(false);
        setTokenBalance(FREE_TOKEN_ALLOWANCE); // Default fallback instead of 0
        setUserNameForGreeting(null);
      }
    };

    fetchDashboardData();
  }, [router, toast]); // Remove tokenBalance dependency

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-8 text-white">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Learning
                </Badge>
              </div>
              <Greeting name={userNameForGreeting} isLoading={isLoadingUserProfile && !isAdmin} />
              <p className="text-purple-100 text-lg">
                Welcome back! Continue your AI-powered learning journey.
              </p>
            </div>
            
            {!isAdmin && (
              <div className="text-right space-y-2">
                {isLoadingUserProfile ? (
                  <div className="flex items-center text-white/80">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center text-white/90">
                      <Coins className="h-5 w-5 mr-2" />
                      <span className="text-2xl font-bold">{tokenBalance?.toLocaleString() || 0}</span>
                      <span className="ml-1 text-sm opacity-80">tokens</span>
                    </div>
                    <div className="w-48 bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(tokenUsagePercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-purple-100">
                      {Math.round(tokenUsagePercentage)}% used this month
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {!isAdmin && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full -mr-10 -mt-10" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Lectures Created</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalLectures}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <BookCopy className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full -mr-10 -mt-10" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Interviews Practiced</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalInterviews}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full -mr-10 -mt-10" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Learning Streak</p>
                    <div className="flex items-center space-x-1">
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.streakDays}</p>
                      <Flame className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full -mr-10 -mt-10" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">AI Score</p>
                    <div className="flex items-center space-x-1">
                      <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">98</p>
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center">
              <Zap className="h-6 w-6 mr-2 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NavigationButtons />
          </CardContent>
        </Card>

        {/* Admin Panel */}
        {isAdmin && (
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-xl">
            <CardHeader className="border-b border-amber-200 dark:border-amber-800">
              <CardTitle className="text-2xl font-bold flex items-center text-amber-900 dark:text-amber-100">
                <Crown className="mr-3 h-7 w-7 text-amber-600" />
                Admin Control Center
              </CardTitle>
              <p className="text-amber-700 dark:text-amber-300">
                Manage users, monitor system health, and oversee platform operations.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ADMIN_NAV_ITEMS.map((item, index) => (
                  <Link href={item.href} key={item.label}>
                    <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <item.icon className="h-6 w-6 text-white" />
                          </div>
                          <ChevronRight className="h-5 w-5 text-amber-500 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                        <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100 mb-2">
                          {item.label}
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Access the {item.label.toLowerCase()} section
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {!isAdmin && (
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-xl font-bold flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                    <BookCopy className="h-4 w-4 text-white" />
                  </div>
                  Recent Lectures
                  <Badge className="ml-auto bg-blue-500/20 text-blue-600 border-blue-500/30">
                    {recentLectures.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80">
                  {isLoadingLectures ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : recentLectures.length > 0 ? (
                    <div className="space-y-1 p-4">
                      {recentLectures.map((lecture, index) => (
                        <Link key={lecture.id} href={lecture.href}>
                          <div className="group flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {lecture.title}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{lecture.timestamp}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <Brain className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 mb-4">No lectures generated yet</p>
                      <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                        <Link href="/lectures">Create Your First Lecture</Link>
                      </Button>
                    </div>
                  )}
                </ScrollArea>
                {recentLectures.length > 0 && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="ghost" asChild className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/30">
                      <Link href="/lectures/history" className="flex items-center justify-center">
                        View All Lectures
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-xl font-bold flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  Interview Reports
                  <Badge className="ml-auto bg-purple-500/20 text-purple-600 border-purple-500/30">
                    {recentInterviewReports.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80">
                  {isLoadingInterviewReports ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                  ) : recentInterviewReports.length > 0 ? (
                    <div className="space-y-1 p-4">
                      {recentInterviewReports.map((report, index) => (
                        <Link key={report.id} href={report.href}>
                          <div className="group flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-200 cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {report.title}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{report.timestamp}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <Activity className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 mb-4">No interview reports yet</p>
                      <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        <Link href="/interviews">Start Your First Interview</Link>
                      </Button>
                    </div>
                  )}
                </ScrollArea>
                {recentInterviewReports.length > 0 && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="ghost" asChild className="w-full hover:bg-purple-50 dark:hover:bg-purple-950/30">
                      <Link href="/interviews/history" className="flex items-center justify-center">
                        View All Reports
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}