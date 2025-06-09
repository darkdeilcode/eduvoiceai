"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  History, 
  Languages, 
  Calendar, 
  Clock, 
  Trophy, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Info,
  Eye,
  ExternalLink,
  BookOpen,
  Sparkles,
  Brain,
  Target,
  Award,
  BarChart3,
  Zap
} from "lucide-react";
import { account } from "@/lib/appwrite";
import type { Models } from "appwrite";
import type { LanguageTestReport } from "@/types/languageTest";

interface LanguageTestHistoryItem {
  id: string;
  userId: string;
  language: string;
  languageCode: string;
  difficulty: string;
  testType: string;
  status: string;
  startTime: number;
  endTime: number;
  conversationId?: string;
  cviResponse?: {
    conversation_id: string;
    conversation_url: string;
    status: string;
    created_at: string;
    [key: string]: any; // Allow for additional fields
  };
  report?: LanguageTestReport;
  createdAt: string;
  updatedAt: string;
  overallScore?: number;
  cefrLevel?: string;
  isPassed?: boolean;
  testDuration?: number;
  // Tavus conversation details
  conversationDetails?: {
    conversation_id: string;
    conversation_url: string;
    status: string;
    created_at: string;
    updated_at: string;
    daily_room_url?: string;
    recording_url?: string;
    duration?: number;
    participants?: any[];
  };
}

interface HistoryResponse {
  success: boolean;
  history: LanguageTestHistoryItem[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export default function LanguageTestHistoryPage() {
  const [currentUser, setCurrentUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [testHistory, setTestHistory] = useState<LanguageTestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const { toast } = useToast();
  const router = useRouter();

  const limit = 10; // Items per page

  // Initialize user
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await account.get();
        setCurrentUser(user);
        
        // Load test history
        await loadTestHistory(user.$id, 0, true);
      } catch (error) {
        console.error('Failed to initialize user:', error);
        toast({
          title: "Authentication Error",
          description: "Please log in to view your test history.",
          variant: "destructive",
        });
        router.push('/');
      }
    };

    initializeUser();
  }, [router, toast]);

  const loadTestHistory = async (userId: string, currentOffset: number = 0, isInitial: boolean = false) => {
    try {
      if (!isInitial) {
        setIsLoadingMore(true);
      }

      const response = await fetch(`/api/language-test/history?userId=${userId}&limit=${limit}&offset=${currentOffset}`);
      const data: HistoryResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch test history');
      }

      // Enrich history items with Tavus conversation details
      const enrichedHistory = await Promise.all(
        data.history.map(async (item) => {
          if (item.conversationId) {
            try {
              const conversationResponse = await fetch(`/api/language-test/conversation/${item.conversationId}`);
              if (conversationResponse.ok) {
                const conversationData = await conversationResponse.json();
                return {
                  ...item,
                  conversationDetails: conversationData.conversation
                };
              }
            } catch (error) {
              console.warn('Failed to fetch conversation details for', item.conversationId, error);
            }
          }
          return item;
        })
      );

      if (isInitial) {
        setTestHistory(enrichedHistory);
        setOffset(enrichedHistory.length);
      } else {
        setTestHistory(prev => [...prev, ...enrichedHistory]);
        setOffset(prev => prev + enrichedHistory.length);
      }

      setHasMore(data.hasMore);
      setTotal(data.total);

    } catch (error) {
      console.error('Error loading test history:', error);
      toast({
        title: "Error",
        description: "Failed to load test history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (currentUser && hasMore && !isLoadingMore) {
      loadTestHistory(currentUser.$id, offset);
    }
  };

  const refreshHistory = () => {
    if (currentUser) {
      setIsLoading(true);
      setOffset(0);
      loadTestHistory(currentUser.$id, 0, true);
    }
  };

  const formatDate = (timestamp: number | string) => {
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCEFRLevel = (score?: number) => {
    if (!score) return { level: "N/A", label: "Unknown", color: "text-gray-600" };
    if (score >= 90) return { level: "C2", label: "Mastery", color: "text-purple-600" };
    if (score >= 80) return { level: "C1", label: "Proficiency", color: "text-blue-600" };
    if (score >= 70) return { level: "B2", label: "Upper Intermediate", color: "text-green-600" };
    if (score >= 60) return { level: "B1", label: "Intermediate", color: "text-yellow-600" };
    if (score >= 50) return { level: "A2", label: "Elementary", color: "text-orange-600" };
    return { level: "A1", label: "Beginner", color: "text-red-600" };
  };

  const getScoreIcon = (score?: number, isPassed?: boolean) => {
    if (isPassed === undefined || score === undefined) {
      return <Info className="h-4 w-4 text-gray-400" />;
    }
    if (isPassed) {
      if (score >= 90) return <Trophy className="h-4 w-4 text-purple-600" />;
      if (score >= 80) return <Star className="h-4 w-4 text-blue-600" />;
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const copyConversationId = async (data: string) => {
    try {
      await navigator.clipboard.writeText(data);
      toast({
        title: "Copied!",
        description: data.length > 50 ? "CVI Response data copied to clipboard." : "Conversation ID copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const viewTestDetails = (testItem: LanguageTestHistoryItem) => {
    if (testItem.report) {
      // Navigate to a detailed report view or show modal
      toast({
        title: "Test Details",
        description: `Viewing details for ${testItem.language} test`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Card className="border-0 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-r-4 border-purple-600 absolute top-0 left-0 [animation-duration:1.5s]"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">Loading Test History</p>
                <p className="text-gray-600 dark:text-gray-400">Retrieving your language learning journey...</p>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="h-3 w-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-3 w-3 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-3 w-3 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/language')}
              className="hover:bg-blue-50 dark:hover:bg-blue-950 border border-blue-200 dark:border-blue-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Language Tests
            </Button>
            <Button 
              onClick={refreshHistory} 
              variant="outline" 
              size="sm"
              className="hover:bg-blue-50 dark:hover:bg-blue-950 border-blue-200 dark:border-blue-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Language Test History
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Track your language learning progress and review detailed performance analytics
            </p>
          </div>
        </div>        {/* Enhanced Stats Summary */}
        {testHistory.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950 dark:via-purple-950 dark:to-blue-950 border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
                  Performance Overview
                </span>
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                Your language learning achievements and progress statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{total}</div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Tests</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-green-800 dark:text-green-200">
                    {testHistory.filter(t => t.isPassed).length}
                  </div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-300">Passed</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                    {testHistory.filter(t => t.overallScore && t.overallScore >= 80).length}
                  </div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-300">High Scores (80+)</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800">
                  <div className="flex items-center justify-center mb-2">
                    <Languages className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                    {new Set(testHistory.map(t => t.language)).size}
                  </div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-300">Languages Tested</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}        {/* Enhanced Empty State */}
        {testHistory.length === 0 ? (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-0 shadow-xl">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                    <Brain className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Start Your Language Journey
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                    Take your first AI-powered language test to unlock personalized feedback and track your progress across multiple languages.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
                    <Target className="h-3 w-3 mr-1" />
                    CEFR Certified
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                    <Zap className="h-3 w-3 mr-1" />
                    AI-Powered
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                    <Award className="h-3 w-3 mr-1" />
                    Instant Results
                  </Badge>
                </div>
                <Button 
                  onClick={() => router.push('/language')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Take Your First Test
                </Button>
              </div>
            </CardContent>
          </Card>        ) : (
          <div className="space-y-6">
            {testHistory.map((test) => {
              const cefrLevel = getCEFRLevel(test.overallScore);
              
              return (
                <Card key={test.id} className="bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                            {getScoreIcon(test.overallScore, test.isPassed)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">
                              {test.language} Speaking Test
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-200 border-0 capitalize font-medium">
                                {test.difficulty}
                              </Badge>
                              {test.isPassed !== undefined && (
                                <Badge 
                                  className={test.isPassed 
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0" 
                                    : "bg-gradient-to-r from-red-500 to-pink-600 text-white border-0"
                                  }
                                >
                                  {test.isPassed ? "✓ PASSED" : "✗ FAILED"}
                                </Badge>
                              )}
                              {test.overallScore && (
                                <Badge className={`bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 ${cefrLevel.color} border-0 font-semibold`}>
                                  {cefrLevel.level} - {cefrLevel.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Date</p>
                              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                {formatDate(test.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          {test.testDuration && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                              <Clock className="h-4 w-4 text-purple-600" />
                              <div>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Duration</p>
                                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                  {test.testDuration} minutes
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {test.overallScore && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/50">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Score</p>
                                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                  {test.overallScore}%
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {test.conversationId && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/50">
                              <MessageSquare className="h-4 w-4 text-orange-600" />
                              <div>
                                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">AI Chat</p>
                                <p className="text-xs font-mono text-orange-800 dark:text-orange-200">
                                  {test.conversationId.substring(0, 8)}...
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {test.conversationId && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/50 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Conversation ID
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono bg-white dark:bg-gray-900 px-3 py-1 rounded-lg border text-gray-800 dark:text-gray-200">
                                  {test.conversationId}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                                  onClick={() => copyConversationId(test.conversationId!)}
                                >
                                  <Info className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {test.cviResponse && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Brain className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                  AI Conversation Data
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                                onClick={() => copyConversationId(JSON.stringify(test.cviResponse, null, 2))}
                                title="Copy CVI Response JSON"
                              >
                                <Info className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-2 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Conversation URL:</span>
                                <a 
                                  href={test.cviResponse.conversation_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs max-w-48 truncate flex items-center gap-1 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded"
                                  title={test.cviResponse.conversation_url}
                                >
                                  {test.cviResponse.conversation_url.split('/').pop()}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Status:</span>
                                <span className={`font-medium text-xs px-2 py-1 rounded-full ${
                                  test.cviResponse.status === 'active' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {test.cviResponse.status}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Created:</span>
                                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                                  {new Date(test.cviResponse.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}                      </div>

                      <div className="flex flex-col gap-3 ml-6">
                        {test.report && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewTestDetails(test)}
                            className="hover:bg-blue-50 dark:hover:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Enhanced Load More Button */}
            {hasMore && (
              <div className="text-center pt-6">
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <p className="text-gray-600 dark:text-gray-300">
                        {total - testHistory.length} more tests available
                      </p>
                      <Button 
                        onClick={loadMore} 
                        disabled={isLoadingMore}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Loading More Tests...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Load More Tests
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
