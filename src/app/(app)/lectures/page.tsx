"use client";

import { useState } from "react";
import Link from "next/link";
import { TopicSelectionForm } from "@/components/lectures/TopicSelectionForm";
import { generateTopicLecture } from "@/ai/flows/topic-lecture-flow";
import type { TopicLectureInput, TopicLectureOutput } from "@/ai/flows/topic-lecture-flow";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Save, AlertTriangle, Loader2, Youtube, Video, ExternalLink, Play, Download, Clock, User, Eye, PlayCircle, Brain, Sparkles, BookOpen, FileText, Zap } from "lucide-react"; 
import { account, databases, ID, Permission, Role, APPWRITE_DATABASE_ID, LECTURES_COLLECTION_ID } from "@/lib/appwrite";
import { AppwriteException, Models } from "appwrite";
import type { Lecture } from "@/types/lecture";
import Image from "next/image";

const LECTURE_TOKEN_COST = 500;

// Enhanced LectureDisplay component with modern design
function LectureDisplay({ lecture, topic }: { lecture: TopicLectureOutput; topic: string }) {
  const handleDownloadPlaylist = () => {
    if (!lecture.playlistM3U) return;
    
    const blob = new Blob([lecture.playlistM3U], { type: 'application/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_playlist.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper functions to safely parse data
  const getVideosArray = () => {
    if (!lecture.youtubeVideos) return [];
    if (Array.isArray(lecture.youtubeVideos)) {
      return lecture.youtubeVideos;
    }
    if (typeof lecture.youtubeVideos === 'string') {
      try {
        const parsed = JSON.parse(lecture.youtubeVideos);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const getSearchQueriesArray = () => {
    if (!lecture.videoSearchQueries) return [];
    if (Array.isArray(lecture.videoSearchQueries)) {
      return lecture.videoSearchQueries;
    }
    if (typeof lecture.videoSearchQueries === 'string') {
      try {
        const parsed = JSON.parse(lecture.videoSearchQueries);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    // Parse ISO 8601 duration (PT4M13S format)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (viewCount: string) => {
    if (!viewCount) return '';
    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  const videosArray = getVideosArray();
  const searchQueriesArray = getSearchQueriesArray();

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Lecture Generated Successfully!</h3>
              <p className="text-green-100">Your AI-powered lecture is ready with curated content</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Generated
          </Badge>
        </div>
      </div>

      {/* Lecture Content */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-xl">
        <CardHeader className="border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 dark:from-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
                  {topic}
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Comprehensive lecture content generated by AI
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
              <FileText className="w-3 h-3 mr-1" />
              Main Content
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="prose max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
              {lecture.lectureContent}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100">Key Takeaways</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-purple-700 dark:text-purple-300">
            {lecture.summary}
          </p>
        </CardContent>
      </Card>

      {/* YouTube Videos Section */}
      {videosArray && videosArray.length > 0 && (
        <Card className="border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Youtube className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold flex items-center">
                    Curated Video Content
                    <Badge className="ml-3 bg-red-500/20 text-red-600 border-red-500/30">
                      {videosArray.length} videos
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Handpicked YouTube videos to enhance your learning experience
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {lecture.playlistUrl && (
                  <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" size="sm" asChild>
                    <a href={lecture.playlistUrl} target="_blank" rel="noopener noreferrer">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch Playlist
                    </a>
                  </Button>
                )}
                {lecture.playlistM3U && (
                  <Button variant="outline" size="sm" onClick={handleDownloadPlaylist}>
                    <Download className="h-4 w-4 mr-2" />
                    Download M3U
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid gap-6">
                {videosArray.map((video, index) => (
                  <Card key={video.id} className="group border-0 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {/* Video Thumbnail */}
                        <div className="flex-shrink-0 relative">
                          <div className="relative w-48 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group-hover:shadow-lg transition-all duration-300">
                            <Image
                              src={video.thumbnail}
                              alt={video.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://placehold.co/320x240/gray/white?text=Video+${index + 1}`;
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-300">
                              <div className="bg-red-600 text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                                <Play className="h-5 w-5 fill-current" />
                              </div>
                            </div>
                            {video.duration && (
                              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md">
                                {formatDuration(video.duration)}
                              </div>
                            )}
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              #{index + 1}
                            </div>
                          </div>
                        </div>

                        {/* Video Details */}
                        <div className="flex-grow min-w-0 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
                              <a href={video.url} target="_blank" rel="noopener noreferrer">
                                {video.title}
                              </a>
                            </h3>
                            <Button size="sm" variant="ghost" className="flex-shrink-0" asChild>
                              <a href={video.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{video.channelTitle}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(video.publishedAt)}</span>
                            </div>
                            {video.viewCount && (
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{formatViewCount(video.viewCount)}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>

                          <div className="flex gap-3 pt-2">
                            <Button size="sm" className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" asChild>
                              <a href={video.url} target="_blank" rel="noopener noreferrer">
                                <Play className="h-3 w-3 mr-1" />
                                Watch Now
                              </a>
                            </Button>
                            <Badge variant="outline" className="text-xs">
                              Video {index + 1}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Search Queries Used */}
      {searchQueriesArray && searchQueriesArray.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Video className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-amber-900 dark:text-amber-100">Video Search Queries</CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  Search terms used to find relevant educational content
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {searchQueriesArray.map((query, index) => (
                <Badge key={index} className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/30 cursor-pointer transition-all duration-200 hover:scale-105">
                  <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-1 px-2"
                  >
                    {query}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function LecturesPage() {
  const [lectureOutput, setLectureOutput] = useState<TopicLectureOutput | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmitTopic = async (data: { topic: string }) => { 
    setIsGenerating(true);
    setError(null);
    setLectureOutput(null);
    setCurrentTopic(data.topic);

    let currentUser: Models.User<Models.Preferences> | null = null;
    try {
      currentUser = await account.get();
    } catch (authError) {
      toast({ title: "Authentication Error", description: "Could not verify user. Please log in again.", variant: "destructive" });
      setIsGenerating(false);
      return;
    }

    if (!currentUser?.$id) {
      toast({ title: "Authentication Error", description: "User ID not found.", variant: "destructive" });
      setIsGenerating(false);
      return;
    }
    const userId = currentUser.$id;

    try {
      const tokenResponse = await fetch('/api/user/deduct-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amountToDeduct: LECTURE_TOKEN_COST,
          description: `Lecture generation: ${data.topic}`
        }),
      });

      const tokenResult = await tokenResponse.json();

      if (!tokenResponse.ok) {
        if (tokenResponse.status === 402 && tokenResult.canSubscribe) {
          toast({
            title: "Insufficient Tokens",
            description: `${tokenResult.message || `You need ${LECTURE_TOKEN_COST} tokens to generate a lecture.`} You have ${tokenResult.currentTokenBalance || 0}.`,
            variant: "destructive",
            action: <Button variant="outline" size="sm" asChild><Link href="/settings/subscription">Get More Tokens</Link></Button>,
            duration: 7000,
          });
        } else {
          throw new Error(tokenResult.message || "Failed to deduct tokens.");
        }
        setIsGenerating(false);
        return;
      }
      
      toast({
        title: tokenResult.message.includes("skipped") ? "Pro User" : "Tokens Deducted",
        description: tokenResult.message.includes("skipped") ? `Lecture generation for "${data.topic}" started.` : `Successfully deducted ${tokenResult.deductedAmount} tokens. New balance: ${tokenResult.newTokenBalance}. Generating lecture...`,
      });

    } catch (tokenError: any) {
      setError(`Token deduction failed: ${tokenError.message}`);
      toast({
        title: "Token Error",
        description: `Could not process token deduction for lecture generation: ${tokenError.message}`,
        variant: "destructive",
      });
      setIsGenerating(false);
      return;
    }

    let userGeminiApiKey: string | undefined = undefined;
    let userOpenaiApiKey: string | undefined = undefined;
    let userClaudeApiKey: string | undefined = undefined;
    try {
      const savedKeysRaw = localStorage.getItem("eduvoice_api_keys");
      if (savedKeysRaw) {
        const savedKeys = JSON.parse(savedKeysRaw);
        userGeminiApiKey = savedKeys.geminiApiKey;
        userOpenaiApiKey = savedKeys.openaiApiKey;
        userClaudeApiKey = savedKeys.claudeApiKey;
      }
    } catch (e) {
      console.warn("Could not read API keys from localStorage", e);
    }

    const lectureInput: TopicLectureInput = {
      topic: data.topic,
      ...(userGeminiApiKey && { geminiApiKey: userGeminiApiKey }),
      ...(userOpenaiApiKey && { openaiApiKey: userOpenaiApiKey }),
      ...(userClaudeApiKey && { claudeApiKey: userClaudeApiKey }),
    };

    let generatedLecture: TopicLectureOutput | null = null;
    let attemptDetails = "";
    if (userGeminiApiKey) attemptDetails += "(Used your Gemini key). ";
    if (userOpenaiApiKey && !userGeminiApiKey) attemptDetails += "(Used your OpenAI key). ";
    if (userClaudeApiKey && !userGeminiApiKey && !userOpenaiApiKey) attemptDetails += "(Used your Claude key). ";

    try {
      generatedLecture = await generateTopicLecture(lectureInput);
      setLectureOutput(generatedLecture);
      
      const videoCount = generatedLecture.youtubeVideos?.length || 0;
      toast({
        title: "Lecture Generated!",
        description: `Your lecture on "${data.topic}" is ready with ${videoCount} related videos. ${attemptDetails}You can now save it.`,
        action: videoCount > 0 ? <Youtube className="h-5 w-5 text-red-500" /> : undefined,
      });
    } catch (err) {
      console.error("Error generating lecture:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during generation.";
      setError(`Failed to generate lecture: ${errorMessage}`);
      toast({
        title: "Generation Failed",
        description: `Could not generate lecture for "${data.topic}". ${attemptDetails}Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveLecture = async () => {
    if (!lectureOutput || !currentTopic) {
      toast({ title: "No lecture to save", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const user = await account.get();
      if (!user || !user.$id) {
        throw new Error("User not authenticated.");
      }
      const userId = user.$id;

      // Prepare data for Appwrite - ensure all array fields are JSON strings
      const lectureDataToSave = {
        userId: userId,
        topic: currentTopic,
        lectureContent: lectureOutput.lectureContent,
        summary: lectureOutput.summary,
        youtubeVideoLinks: JSON.stringify(lectureOutput.youtubeVideoLinks || []),
        youtubeVideos: JSON.stringify(lectureOutput.youtubeVideos || []),
        playlistUrl: lectureOutput.playlistUrl || '',
        playlistM3U: lectureOutput.playlistM3U || '',
        videoSearchQueries: JSON.stringify(lectureOutput.videoSearchQueries || []),
      };

      // Debug log to check what we're sending
      console.log('Saving lecture data:', {
        ...lectureDataToSave,
        youtubeVideos: `JSON string with ${lectureOutput.youtubeVideos?.length || 0} videos`,
        youtubeVideoLinks: `JSON string with ${lectureOutput.youtubeVideoLinks?.length || 0} links`,
        videoSearchQueries: `JSON string with ${lectureOutput.videoSearchQueries?.length || 0} queries`,
      });

      if (!APPWRITE_DATABASE_ID || !LECTURES_COLLECTION_ID) {
        throw new Error("Appwrite database/collection IDs are not configured. Check .env file.");
      }

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        LECTURES_COLLECTION_ID,
        ID.unique(),
        lectureDataToSave,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );

      toast({
        title: "Lecture Saved!",
        description: `Your lecture on "${currentTopic}" with ${lectureOutput.youtubeVideos?.length || 0} videos has been saved successfully.`,
        action: <Save className="h-5 w-5 text-green-500" />
      });
    } catch (err) {
      console.error("Error saving lecture:", err);
      let errorMessage = "An unknown error occurred while saving.";
      if (err instanceof AppwriteException) {
        errorMessage = `Appwrite Error: ${err.message} (Code: ${err.code}, Type: ${err.type})`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`Failed to save lecture: ${errorMessage}`);
      toast({
        title: "Save Failed",
        description: `Could not save lecture: ${errorMessage.substring(0,100)}...`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    <Brain className="w-3 h-3 mr-1" />
                    AI-Powered Learning
                  </Badge>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">
                    AI Topic-Based Lectures
                  </h1>
                  <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">
                    Let AI craft detailed lectures with curated YouTube videos on any subject you're curious about. 
                    <span className="font-semibold text-white"> Generating costs {LECTURE_TOKEN_COST} tokens</span> and includes related video content.
                  </p>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Video className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Topic Selection Form */}
        <Card className="border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Create Your Lecture
            </CardTitle>
            <CardDescription>
              Enter any topic and let AI generate comprehensive learning content for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopicSelectionForm onSubmitTopic={handleSubmitTopic} isGenerating={isGenerating || isSaving} />
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isGenerating && !lectureOutput && (
          <Card className="border-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 shadow-lg">
            <CardContent className="p-12">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                    <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-purple-500/20"></div>
                  </div>
                  <Youtube className="h-8 w-8 text-red-500 animate-pulse" />
                  <Brain className="h-8 w-8 text-blue-500 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">
                    Generating Your Lecture
                  </h3>
                  <p className="text-purple-700 dark:text-purple-300">
                    Processing token deduction and generating your lecture on "{currentTopic}"...
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    This includes AI content generation and YouTube video curation
                  </p>
                </div>
                <div className="w-64 mx-auto bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Lecture Display */}
        {lectureOutput && currentTopic && (
          <>
            <LectureDisplay lecture={lectureOutput} topic={currentTopic} />
            
            {/* Save Button */}
            <div className="text-center">
              <Card className="inline-block border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg">
                <CardContent className="p-6">
                  <Button 
                    onClick={handleSaveLecture} 
                    disabled={isSaving || isGenerating} 
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-4 text-lg font-semibold shadow-lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Saving to Library...
                      </>
                    ) : (
                      <>
                        <Save className="mr-3 h-5 w-5" /> 
                        Save Lecture to My Library
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Save this lecture to access it anytime from your dashboard
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}