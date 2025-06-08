"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { 
  Users, 
  BookOpenText, 
  MessageSquareText, 
  Ticket, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Clock, 
  DollarSign,
  BarChart3,
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Crown,
  AlertTriangle,
  Shield,
  Loader2,
  Menu,
  ClipboardList,
  Target,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { account, databases, APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, LECTURES_COLLECTION_ID, INTERVIEWS_COLLECTION_ID, VOUCHERS_COLLECTION_ID, TRANSACTIONS_COLLECTION_ID, QA_REPORTS_COLLECTION_ID, Query } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { QAReport } from "@/types/qaReport";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  totalLectures: number;
  lecturesThisMonth: number;
  totalInterviews: number;
  interviewsThisMonth: number;
  totalVouchers: number;
  activeVouchers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalReports: number;
  reportsThisWeek: number;
  // QA Report specific stats
  totalQAReports: number;
  completedQAReports: number;
  inProgressQAReports: number;
  averageQAScore: number;
  qaReportsThisWeek: number;
  totalQuestionsGenerated: number;
}

interface ActivityItem {
  id: string;
  type: 'user' | 'lecture' | 'interview' | 'voucher' | 'payment' | 'report' | 'qa_report';
  message: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    proUsers: 0,
    totalLectures: 0,
    lecturesThisMonth: 0,
    totalInterviews: 0,
    interviewsThisMonth: 0,
    totalVouchers: 0,
    activeVouchers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalReports: 0,
    reportsThisWeek: 0,
    totalQAReports: 0,
    completedQAReports: 0,
    inProgressQAReports: 0,
    averageQAScore: 0,
    qaReportsThisWeek: 0,
    totalQuestionsGenerated: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const fetchDashboardData = async (showRefreshLoader = false) => {
    if (showRefreshLoader) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const currentUser = await account.get();
      if (!currentUser.labels || !currentUser.labels.includes("admin")) {
        router.push("/dashboard");
        return;
      }

      // Fetch all data in parallel
      const [
        usersResponse,
        lecturesResponse,
        interviewsResponse,
        vouchersResponse,
        transactionsResponse,
        reportsResponse,
        qaReportsResponse
      ] = await Promise.all([
        // Users
        databases.listDocuments(APPWRITE_DATABASE_ID, USERS_COLLECTION_ID, [
          Query.limit(2000)
        ]).catch(() => ({ documents: [], total: 0 })),
        
        // Lectures
        databases.listDocuments(APPWRITE_DATABASE_ID, LECTURES_COLLECTION_ID, [
          Query.orderDesc('$createdAt'),
          Query.limit(1000)
        ]).catch(() => ({ documents: [], total: 0 })),
        
        // Interviews
        databases.listDocuments(APPWRITE_DATABASE_ID, INTERVIEWS_COLLECTION_ID, [
          Query.orderDesc('$createdAt'),
          Query.limit(1000)
        ]).catch(() => ({ documents: [], total: 0 })),
        
        // Vouchers
        databases.listDocuments(APPWRITE_DATABASE_ID, VOUCHERS_COLLECTION_ID, [
          Query.orderDesc('$createdAt'),
          Query.limit(500)
        ]).catch(() => ({ documents: [], total: 0 })),
        
        // Transactions
        databases.listDocuments(APPWRITE_DATABASE_ID, TRANSACTIONS_COLLECTION_ID, [
          Query.orderDesc('$createdAt'),
          Query.limit(1000)
        ]).catch(() => ({ documents: [], total: 0 })),
        
        // QA Reports (legacy)
        databases.listDocuments(APPWRITE_DATABASE_ID, QA_REPORTS_COLLECTION_ID, [
          Query.orderDesc('$createdAt'),
          Query.limit(500)
        ]).catch(() => ({ documents: [], total: 0 })),

        // QA Reports (new detailed collection)
        databases.listDocuments(APPWRITE_DATABASE_ID, QA_REPORTS_COLLECTION_ID, [
          Query.orderDesc('$createdAt'),
          Query.limit(1000)
        ]).catch(() => ({ documents: [], total: 0 }))
      ]);

      // Calculate statistics
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = subDays(now, 7);
      const last24Hours = subDays(now, 1);

      // Users stats
      const totalUsers = usersResponse.documents.length;
      const recentUsers = usersResponse.documents.filter(user => 
        new Date(user.$createdAt) > last24Hours
      );
      const proUsers = usersResponse.documents.filter(user => 
        user.plan === 'pro' || user.subscription === 'pro'
      ).length;

      // Lectures stats
      const totalLectures = lecturesResponse.documents.length;
      const lecturesThisMonth = lecturesResponse.documents.filter(lecture => 
        new Date(lecture.$createdAt) > startOfMonth
      ).length;

      // Interviews stats
      const totalInterviews = interviewsResponse.documents.length;
      const interviewsThisMonth = interviewsResponse.documents.filter(interview => 
        new Date(interview.$createdAt) > startOfMonth
      ).length;

      // Vouchers stats
      const totalVouchers = vouchersResponse.documents.length;
      const activeVouchers = vouchersResponse.documents.filter(voucher => 
        new Date(voucher.ExpiryDate) > now && voucher.status !== 'Inactive'
      ).length;

      // Revenue stats (from transactions)
      const transactions = transactionsResponse.documents;
      const totalRevenue = transactions.reduce((sum, transaction) => 
        sum + (transaction.amount || 0), 0
      );
      const monthlyRevenue = transactions
        .filter(transaction => new Date(transaction.$createdAt) > startOfMonth)
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

      // Reports stats (legacy)
      const totalReports = reportsResponse.documents.length;
      const reportsThisWeek = reportsResponse.documents.filter(report => 
        new Date(report.$createdAt) > startOfWeek
      ).length;

      // QA Reports stats (new detailed)
      const qaReports = qaReportsResponse.documents as QAReport[];
      const totalQAReports = qaReports.length;
      const completedQAReports = qaReports.filter(report => report.status === 'completed').length;
      const inProgressQAReports = qaReports.filter(report => report.status === 'in_progress').length;
      const qaReportsThisWeek = qaReports.filter(report => 
        new Date(report.$createdAt) > startOfWeek
      ).length;

      // Calculate average QA score
      const completedReportsWithScores = qaReports.filter(report => 
        report.status === 'completed' && report.overallScore !== null && report.overallScore !== undefined
      );
      const averageQAScore = completedReportsWithScores.length > 0 
        ? completedReportsWithScores.reduce((sum, report) => sum + (report.overallScore || 0), 0) / completedReportsWithScores.length
        : 0;

      // Calculate total questions generated
      const totalQuestionsGenerated = qaReports.reduce((sum, report) => 
        sum + (report.numQuestionsGenerated || 0), 0
      );

      setStats({
        totalUsers,
        activeUsers: recentUsers.length,
        proUsers,
        totalLectures,
        lecturesThisMonth,
        totalInterviews,
        interviewsThisMonth,
        totalVouchers,
        activeVouchers,
        totalRevenue,
        monthlyRevenue,
        totalReports,
        reportsThisWeek,
        totalQAReports,
        completedQAReports,
        inProgressQAReports,
        averageQAScore,
        qaReportsThisWeek,
        totalQuestionsGenerated,
      });

      // Generate recent activity
      const activities: ActivityItem[] = [];

      // Recent user registrations
      recentUsers.slice(0, 2).forEach(user => {
        activities.push({
          id: user.$id,
          type: 'user',
          message: `New user registration: ${user.email || 'Unknown user'}`,
          time: format(new Date(user.$createdAt), 'pp'),
          status: 'success',
          timestamp: new Date(user.$createdAt)
        });
      });

      // Recent lectures
      lecturesResponse.documents.slice(0, 2).forEach(lecture => {
        activities.push({
          id: lecture.$id,
          type: 'lecture',
          message: `New lecture generated: "${lecture.title || 'Untitled'}"`,
          time: format(new Date(lecture.$createdAt), 'pp'),
          status: 'info',
          timestamp: new Date(lecture.$createdAt)
        });
      });

      // Recent interviews
      interviewsResponse.documents.slice(0, 2).forEach(interview => {
        activities.push({
          id: interview.$id,
          type: 'interview',
          message: `Mock interview completed for ${interview.position || 'Unknown position'}`,
          time: format(new Date(interview.$createdAt), 'pp'),
          status: 'info',
          timestamp: new Date(interview.$createdAt)
        });
      });

      // Recent QA Reports
      qaReports.slice(0, 3).forEach(qaReport => {
        const statusMessage = qaReport.status === 'completed' 
          ? `QA Quiz completed: "${qaReport.quizTitle}" - Score: ${qaReport.overallScore || 0}/${qaReport.maxScore || 0}`
          : qaReport.status === 'in_progress'
          ? `QA Quiz in progress: "${qaReport.quizTitle}"`
          : `QA Quiz generated: "${qaReport.quizTitle}" - ${qaReport.numQuestionsGenerated} questions`;
        
        activities.push({
          id: qaReport.$id,
          type: 'qa_report',
          message: statusMessage,
          time: format(new Date(qaReport.$createdAt), 'pp'),
          status: qaReport.status === 'completed' ? 'success' : 
                 qaReport.status === 'in_progress' ? 'warning' : 'info',
          timestamp: new Date(qaReport.$createdAt)
        });
      });

      // Recent voucher usage
      vouchersResponse.documents
        .filter(voucher => voucher.uses && voucher.uses > 0)
        .slice(0, 1)
        .forEach(voucher => {
          activities.push({
            id: voucher.$id,
            type: 'voucher',
            message: `Voucher "${voucher.key}" used ${voucher.uses} times`,
            time: format(new Date(voucher.$updatedAt || voucher.$createdAt), 'pp'),
            status: 'info',
            timestamp: new Date(voucher.$updatedAt || voucher.$createdAt)
          });
        });

      // Recent transactions
      transactions.slice(0, 2).forEach(transaction => {
        activities.push({
          id: transaction.$id,
          type: 'payment',
          message: `Payment received: $${transaction.amount || 0} - ${transaction.description || 'Subscription'}`,
          time: format(new Date(transaction.$createdAt), 'pp'),
          status: 'success',
          timestamp: new Date(transaction.$createdAt)
        });
      });

      // Sort by timestamp and take the most recent
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 6);

      setRecentActivity(sortedActivities);

      if (showRefreshLoader) {
        toast({
          title: "✅ Dashboard Updated",
          description: "Latest data has been loaded successfully.",
          className: "bg-green-50 border-green-200 text-green-800"
        });
      }

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "❌ Update Failed", 
        description: "Could not load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1">
          <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Loading Admin Dashboard</h3>
              <p className="text-muted-foreground">Fetching real-time platform analytics...</p>
            </div>
          </div>
        </main>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {/* Mobile Header with Sidebar Trigger */}
          <div className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:hidden">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </SidebarTrigger>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold">Admin Dashboard</h1>
            </div>
          </div>

          <div className="p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="hidden lg:flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                      <ShieldAlert className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      Admin Dashboard
                    </h1>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-lg">
                    Real-time overview of EduVoice AI platform performance and analytics
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="px-3 py-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live Data
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl"
                    onClick={() => fetchDashboardData(true)}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-b border-blue-200/50 dark:border-blue-800/50 pb-2 lg:pb-3">
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300">Total Users</CardTitle>
                      <div className="p-1.5 lg:p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                        <Users className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 lg:pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                        {stats.totalUsers.toLocaleString()}
                      </div>
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <ArrowUpRight className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                        <span className="text-xs lg:text-sm font-medium">
                          {stats.activeUsers > 0 ? `+${stats.activeUsers}` : '0'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 lg:mt-2">
                      {stats.activeUsers} new in last 24h
                    </p>
                  </CardContent>
                </Card>

                {/* QA Reports */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b border-indigo-200/50 dark:border-indigo-800/50 pb-2 lg:pb-3">
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300">QA Reports</CardTitle>
                      <div className="p-1.5 lg:p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                        <ClipboardList className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 lg:pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                        {stats.totalQAReports.toLocaleString()}
                      </div>
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <ArrowUpRight className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                        <span className="text-xs lg:text-sm font-medium">
                          +{stats.qaReportsThisWeek}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 lg:mt-2">
                      {stats.completedQAReports} completed
                    </p>
                  </CardContent>
                </Card>

                {/* AI Lectures */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b border-purple-200/50 dark:border-purple-800/50 pb-2 lg:pb-3">
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300">AI Lectures</CardTitle>
                      <div className="p-1.5 lg:p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                        <BookOpenText className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 lg:pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                        {stats.totalLectures.toLocaleString()}
                      </div>
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <ArrowUpRight className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                        <span className="text-xs lg:text-sm font-medium">
                          +{stats.lecturesThisMonth}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 lg:mt-2">
                      {stats.lecturesThisMonth} this month
                    </p>
                  </CardContent>
                </Card>

                {/* Revenue */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200/50 dark:border-green-800/50 pb-2 lg:pb-3">
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300">Revenue</CardTitle>
                      <div className="p-1.5 lg:p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                        <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 lg:pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                        ${stats.monthlyRevenue.toLocaleString()}
                      </div>
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <ArrowUpRight className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                        <span className="text-xs lg:text-sm font-medium">
                          {stats.totalRevenue > 0 ? `${Math.round((stats.monthlyRevenue / stats.totalRevenue) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 lg:mt-2">
                      {stats.proUsers} Pro subscribers
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Stats */}
              <div className="grid gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base lg:text-lg font-semibold">Mock Interviews</CardTitle>
                      <MessageSquareText className="h-4 w-4 lg:h-5 lg:w-5 text-slate-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {stats.totalInterviews.toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {stats.interviewsThisMonth} completed this month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base lg:text-lg font-semibold">QA Performance</CardTitle>
                      <Target className="h-4 w-4 lg:h-5 lg:w-5 text-slate-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {stats.averageQAScore.toFixed(1)}%
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Average quiz score ({stats.completedQAReports} completed)
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base lg:text-lg font-semibold">Questions Generated</CardTitle>
                      <CheckCircle2 className="h-4 w-4 lg:h-5 lg:w-5 text-slate-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {stats.totalQuestionsGenerated.toLocaleString()}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Total AI-generated questions
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base lg:text-lg font-semibold">System Health</CardTitle>
                      <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-base lg:text-lg font-semibold text-green-600 dark:text-green-400">Operational</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      All systems running smoothly
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-blue-500" />
                        <CardTitle className="font-headline text-lg lg:text-xl">Real-time Activity Feed</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <Eye className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">View All</span>
                      </Button>
                    </div>
                    <CardDescription>
                      Live monitoring of platform activities and user interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 lg:space-y-4">
                      {recentActivity.length > 0 ? recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                          <div className={`p-1 rounded-full ${
                            activity.status === 'success' ? 'bg-green-100 dark:bg-green-950' :
                            activity.status === 'warning' ? 'bg-orange-100 dark:bg-orange-950' :
                            activity.status === 'error' ? 'bg-red-100 dark:bg-red-950' :
                            'bg-blue-100 dark:bg-blue-950'
                          }`}>
                            {activity.type === 'user' && <Users className="h-3 w-3 text-green-600" />}
                            {activity.type === 'lecture' && <BookOpenText className="h-3 w-3 text-blue-600" />}
                            {activity.type === 'interview' && <MessageSquareText className="h-3 w-3 text-purple-600" />}
                            {activity.type === 'qa_report' && <ClipboardList className="h-3 w-3 text-indigo-600" />}
                            {activity.type === 'payment' && <Crown className="h-3 w-3 text-green-600" />}
                            {activity.type === 'voucher' && <Ticket className="h-3 w-3 text-blue-600" />}
                            {activity.type === 'report' && <AlertTriangle className="h-3 w-3 text-orange-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 dark:text-white font-medium">
                              {activity.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No recent activity to display</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5 text-purple-500" />
                      <CardTitle className="font-headline text-lg lg:text-xl">Quick Actions</CardTitle>
                    </div>
                    <CardDescription>
                      Common administrative tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button asChild className="w-full justify-start h-10 lg:h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-xl text-sm lg:text-base">
                      <Link href="/admindashboard/users">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Users ({stats.totalUsers})
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start h-10 lg:h-12 rounded-xl border-2 text-sm lg:text-base">
                      <Link href="/qa-reports">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        QA Reports ({stats.totalQAReports})
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start h-10 lg:h-12 rounded-xl border-2 text-sm lg:text-base">
                      <Link href="/vouchers">
                        <Ticket className="h-4 w-4 mr-2" />
                        Manage Vouchers ({stats.totalVouchers})
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start h-10 lg:h-12 rounded-xl border-2 text-sm lg:text-base">
                      <Link href="/admindashboard/analytics">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Analytics
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Footer Note */}
              <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-950/20 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                      <Shield className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1 text-sm lg:text-base">
                        Admin Dashboard - Live Data Connected
                      </h3>
                      <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                        This dashboard displays real-time data from your Appwrite database including QA Reports. 
                        Last updated: {format(new Date(), 'PPp')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}