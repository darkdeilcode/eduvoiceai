"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  ExternalLink, 
  Play, 
  Download, 
  Clock, 
  User, 
  Eye, 
  PlayCircle, 
  Loader2, 
  AlertTriangle, 
  Video,
  BookOpen,
  FileText,
  Code,
  Copy,
  Check,
  Calendar,
  Hash,
  Monitor,
  Lightbulb,
  ChevronRight,
  Quote,
  List,
  CheckCircle,
  Brain,
  Sparkles,
  Youtube,
  Star,
  ThumbsUp,
  Share2,
  Bookmark
} from "lucide-react";
import { databases, APPWRITE_DATABASE_ID, LECTURES_COLLECTION_ID } from "@/lib/appwrite";
import type { Lecture, ParsedLecture } from "@/types/lecture";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function ViewLecturePage() {
  const [lecture, setLecture] = useState<ParsedLecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<number>(0);
  const params = useParams();
  const lectureId = params?.lectureId as string;
  const { toast } = useToast();

  useEffect(() => {
    const fetchLecture = async () => {
      if (!lectureId) {
        setError("No lecture ID provided");
        setLoading(false);
        return;
      }

      try {
        if (!APPWRITE_DATABASE_ID || !LECTURES_COLLECTION_ID) {
          throw new Error("Database configuration is missing");
        }

        const lectureDoc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          LECTURES_COLLECTION_ID,
          lectureId
        ) as Lecture;

        // Parse JSON strings back to objects
        const parsedLecture: ParsedLecture = {
          ...lectureDoc,
          youtubeVideoLinks: lectureDoc.youtubeVideoLinks ? JSON.parse(lectureDoc.youtubeVideoLinks) : [],
          youtubeVideos: lectureDoc.youtubeVideos ? JSON.parse(lectureDoc.youtubeVideos) : [],
          videoSearchQueries: lectureDoc.videoSearchQueries ? JSON.parse(lectureDoc.videoSearchQueries) : [],
        };

        setLecture(parsedLecture);
      } catch (err) {
        console.error("Error fetching lecture:", err);
        setError(err instanceof Error ? err.message : "Failed to load lecture");
      } finally {
        setLoading(false);
      }
    };

    fetchLecture();
  }, [lectureId]);

  // Format the lecture title with proper styling
  const formatLectureTitle = (topic: string) => {
    return `Lecture: ${topic}`;
  };

  const handleDownloadPlaylist = () => {
    if (!lecture?.playlistM3U) {
      toast({
        title: "No Playlist Available",
        description: "This lecture doesn't have a downloadable playlist.",
        variant: "destructive"
      });
      return;
    }
    
    const blob = new Blob([lecture.playlistM3U], { type: 'application/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lecture.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_playlist.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Playlist Downloaded",
      description: "M3U playlist file has been downloaded to your device.",
    });
  };

  const handleCopyContent = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
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

  // Enhanced content parser for modern blog structure
  const parseContent = (content: string) => {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = { type: 'text', content: '', title: '', level: 0, id: '' };
    
    lines.forEach((line, index) => {
      // Detect headings
      if (line.match(/^#{1,6}\s/)) {
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        const level = line.match(/^#+/)?.[0].length || 1;
        const title = line.replace(/^#+\s/, '');
        const id = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
        currentSection = {
          type: 'heading',
          content: title,
          title: title,
          level,
          id
        };
        sections.push({ ...currentSection });
        currentSection = { type: 'text', content: '', title: '', level: 0, id: '' };
      }
      // Detect code blocks
      else if (line.includes('```')) {
        if (currentSection.type === 'code') {
          sections.push({ ...currentSection });
          currentSection = { type: 'text', content: '', title: '', level: 0, id: '' };
        } else {
          if (currentSection.content.trim()) {
            sections.push({ ...currentSection });
          }
          const language = line.replace('```', '').trim();
          currentSection = { 
            type: 'code', 
            content: '', 
            title: '',
            level: 0,
            id: '',
            language: language || 'text'
          };
        }
      }
      // Detect lists
      else if (line.match(/^[-*+]\s/) || line.match(/^\d+\.\s/)) {
        if (currentSection.type !== 'list') {
          if (currentSection.content.trim()) {
            sections.push({ ...currentSection });
          }
          currentSection = { type: 'list', content: '', title: '', level: 0, id: '' };
        }
        currentSection.content += line + '\n';
      }
      // Detect quotes
      else if (line.match(/^>\s/)) {
        if (currentSection.type !== 'quote') {
          if (currentSection.content.trim()) {
            sections.push({ ...currentSection });
          }
          currentSection = { type: 'quote', content: '', title: '', level: 0, id: '' };
        }
        currentSection.content += line.replace(/^>\s/, '') + '\n';
      }
      // Regular content
      else {
        if (currentSection.type === 'list' || currentSection.type === 'quote') {
          if (line.trim() === '') {
            sections.push({ ...currentSection });
            currentSection = { type: 'text', content: '', title: '', level: 0, id: '' };
          } else {
            currentSection.content += line + '\n';
          }
        } else {
          currentSection.content += line + '\n';
        }
      }
    });
    
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  // Generate table of contents
  const generateTOC = (sections: any[]) => {
    return sections.filter(section => section.type === 'heading').map((section, index) => ({
      ...section,
      index
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto py-8">
          <div className="text-center py-20">
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-6 shadow-xl">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <div className="absolute inset-0 w-20 h-20 animate-ping rounded-full bg-purple-500/20"></div>
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Loading Your Lecture
            </h3>
            <p className="text-slate-600 dark:text-slate-400">Preparing comprehensive educational content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Lecture</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/lectures">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lectures
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto py-8">
          <Alert className="max-w-2xl mx-auto border-orange-200 bg-orange-50 dark:bg-orange-950/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Lecture Not Found</AlertTitle>
            <AlertDescription>The requested lecture could not be found.</AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/lectures">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lectures
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const contentSections = parseContent(lecture.lectureContent);
  const tableOfContents = generateTOC(contentSections);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto py-8 space-y-8">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300">
            <Link href="/lectures">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lectures
            </Link>
          </Button>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-950/30">
              <Bookmark className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-12 text-white">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center space-x-4">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 px-4 py-2">
                    <Brain className="w-4 h-4 mr-2" />
                    AI-Generated Lecture
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-100 border-green-400/30 px-4 py-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Premium Content
                  </Badge>
                </div>
                
                {/* Enhanced Title Display */}
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                    <span className="font-black">Lecture:</span>{" "}
                    <span className="bg-gradient-to-r from-yellow-200 via-white to-blue-200 bg-clip-text text-transparent">
                      {lecture.topic}
                    </span>
                  </h1>
                  <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 via-white to-blue-400 rounded-full"></div>
                </div>
                
                <p className="text-xl text-blue-100 leading-relaxed max-w-3xl">
                  Comprehensive educational content with curated video resources and detailed explanations
                </p>

                <div className="flex items-center gap-6 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>Created {formatDate(lecture.$createdAt)}</span>
                  </div>
                  {lecture.$updatedAt !== lecture.$createdAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>Updated {formatDate(lecture.$updatedAt)}</span>
                    </div>
                  )}
                  {lecture.youtubeVideos && (
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      <span>{lecture.youtubeVideos.length} videos included</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Monitor className="h-20 w-20 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="content" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-0 shadow-lg">
              <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <BookOpen className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <FileText className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                <Video className="h-4 w-4" />
                Resources
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Lecture Content Tab */}
          <TabsContent value="content" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Table of Contents - Sidebar */}
              {tableOfContents.length > 0 && (
                <div className="lg:col-span-1">
                  <Card className="sticky top-8 border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-t-xl">
                      <CardTitle className="text-lg font-bold flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <List className="h-4 w-4 text-white" />
                        </div>
                        Table of Contents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <nav className="space-y-3">
                        {tableOfContents.map((item, index) => (
                          <a
                            key={index}
                            href={`#${item.id}`}
                            className={`group block p-3 rounded-xl transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 ${
                              item.level === 1 ? 'font-semibold' : 
                              item.level === 2 ? 'pl-4 text-slate-600 dark:text-slate-400' :
                              'pl-6 text-slate-500 dark:text-slate-500'
                            } ${activeSection === item.index ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveSection(item.index);
                              document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${activeSection === item.index ? 'text-blue-500' : 'text-slate-400'}`} />
                              <span className="line-clamp-2">{item.content}</span>
                            </div>
                          </a>
                        ))}
                      </nav>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Main Content Area */}
              <div className={`${tableOfContents.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 dark:from-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
                            {formatLectureTitle(lecture.topic)}
                          </CardTitle>
                          <CardDescription className="text-lg text-blue-700 dark:text-blue-300">
                            In-depth exploration of {lecture.topic}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleCopyContent(lecture.lectureContent, -1)}
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 shadow-lg"
                      >
                        {copiedIndex === -1 ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy All
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <article className="prose prose-slate dark:prose-invert prose-lg max-w-none">
                      <div className="space-y-10 p-10">
                        {contentSections.map((section, index) => (
                          <div key={index} id={section.id} className="scroll-mt-20">
                            {section.type === 'heading' ? (
                              <div className={`group relative ${
                                section.level === 1 ? 'mb-10 pb-6 border-b-2 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800' : 
                                section.level === 2 ? 'mb-8 mt-16' : 
                                'mb-6 mt-10'
                              }`}>
                                <div className={`flex items-center gap-4 ${
                                  section.level === 1 ? 'text-4xl font-bold text-slate-900 dark:text-slate-100' : 
                                  section.level === 2 ? 'text-3xl font-bold text-slate-800 dark:text-slate-200' : 
                                  section.level === 3 ? 'text-2xl font-semibold text-slate-700 dark:text-slate-300' : 
                                  'text-xl font-medium text-slate-600 dark:text-slate-400'
                                }`}>
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                                    section.level === 1 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                                    section.level === 2 ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                                    section.level === 3 ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                                    'bg-gradient-to-br from-orange-500 to-red-500'
                                  }`}>
                                    <Hash className="h-5 w-5 text-white" />
                                  </div>
                                  <span>{section.content}</span>
                                </div>
                              </div>
                            ) : section.type === 'code' ? (
                              <div className="my-10 group relative">
                                <div className="bg-slate-900 dark:bg-slate-950 rounded-t-xl p-6 flex items-center justify-between border-b border-slate-700">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                                      <Code className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-lg font-semibold text-slate-200 capitalize">
                                      {section.language || 'Code Example'}
                                    </span>
                                    <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-600">
                                      Example
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-70 hover:opacity-100 transition-all duration-300 text-slate-300 hover:text-white hover:bg-slate-800"
                                    onClick={() => handleCopyContent(section.content.trim(), index)}
                                  >
                                    {copiedIndex === index ? (
                                      <Check className="h-4 w-4 text-green-400 mr-2" />
                                    ) : (
                                      <Copy className="h-4 w-4 mr-2" />
                                    )}
                                    <span className="text-sm">Copy Code</span>
                                  </Button>
                                </div>
                                <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-8 overflow-x-auto text-sm leading-relaxed rounded-b-xl border border-slate-700 border-t-0">
                                  <code className="language-{section.language}">{section.content.trim()}</code>
                                </pre>
                              </div>
                            ) : section.type === 'quote' ? (
                              <div className="my-8 relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-full"></div>
                                <div className="pl-8 py-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-950/40 dark:to-purple-950/40 rounded-r-xl border border-l-0 border-blue-200 dark:border-blue-800 backdrop-blur-sm">
                                  <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                      <Quote className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="text-slate-700 dark:text-slate-300 italic leading-relaxed text-lg">
                                      {section.content.trim()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : section.type === 'list' ? (
                              <div className="my-8">
                                <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-950/40 dark:to-emerald-950/40 rounded-xl p-8 border border-green-200 dark:border-green-800 backdrop-blur-sm">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                      <CheckCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-green-700 dark:text-green-300">Key Points</span>
                                  </div>
                                  <div className="space-y-4 text-slate-700 dark:text-slate-300">
                                    {section.content.split('\n').filter(line => line.trim()).map((line, lineIndex) => (
                                      <div key={lineIndex} className="flex items-start gap-4">
                                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                                          <Check className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="leading-relaxed text-lg">{line.replace(/^[-*+]\s/, '').replace(/^\d+\.\s/, '')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="my-8">
                                <div className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                  {section.content.trim()}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </article>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-8">
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
              <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-t-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-900 to-orange-900 dark:from-amber-100 dark:to-orange-100 bg-clip-text text-transparent">
                      Key Summary for {lecture.topic}
                    </CardTitle>
                    <CardDescription className="text-lg text-amber-700 dark:text-amber-300">
                      Essential points and takeaways from this lecture
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-10 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <div className="prose prose-slate dark:prose-invert prose-xl max-w-none">
                    <div className="text-xl leading-relaxed text-slate-800 dark:text-slate-200">
                      {lecture.summary}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-8">
            {/* YouTube Videos Section */}
            {lecture.youtubeVideos && lecture.youtubeVideos.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                <CardHeader className="border-b bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                        <Youtube className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-3">
                          <span className="bg-gradient-to-r from-red-900 to-pink-900 dark:from-red-100 dark:to-pink-100 bg-clip-text text-transparent">
                            Video Resources for {lecture.topic}
                          </span>
                          <Badge className="bg-red-500/20 text-red-600 border-red-500/30 px-3 py-1">
                            {lecture.youtubeVideos.length} videos
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-lg text-red-700 dark:text-red-300">
                          Handpicked YouTube videos to enhance your learning experience
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {lecture.playlistUrl && (
                        <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg" size="lg" asChild>
                          <a href={lecture.playlistUrl} target="_blank" rel="noopener noreferrer">
                            <PlayCircle className="h-5 w-5 mr-2" />
                            Watch Playlist
                          </a>
                        </Button>
                      )}
                      {lecture.playlistM3U && (
                        <Button variant="outline" size="lg" onClick={handleDownloadPlaylist} className="shadow-lg">
                          <Download className="h-5 w-5 mr-2" />
                          Download M3U
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <ScrollArea className="h-[800px] pr-4">
                    <div className="grid gap-8">
                      {lecture.youtubeVideos.map((video, index) => (
                        <Card key={video.id} className="group border-0 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-700/80 hover:shadow-xl transition-all duration-500 hover:scale-[1.02] backdrop-blur-sm">
                          <CardContent className="p-8">
                            <div className="flex gap-8">
                              {/* Video Thumbnail */}
                              <div className="flex-shrink-0 relative">
                                <div className="relative w-64 h-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group-hover:shadow-2xl transition-all duration-500 cursor-pointer">
                                  <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = `https://placehold.co/320x240/gray/white?text=Video+${index + 1}`;
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-500">
                                    <div className="bg-red-600 text-white rounded-full p-4 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-500 shadow-2xl">
                                      <Play className="h-8 w-8 fill-current" />
                                    </div>
                                  </div>
                                  {video.duration && (
                                    <div className="absolute bottom-3 right-3 bg-black/90 text-white text-sm px-3 py-1 rounded-lg font-medium">
                                      {formatDuration(video.duration)}
                                    </div>
                                  )}
                                  <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm px-3 py-1 rounded-full font-bold shadow-lg">
                                    #{index + 1}
                                  </div>
                                </div>
                              </div>

                              {/* Video Details */}
                              <div className="flex-grow min-w-0 space-y-4">
                                <div className="space-y-3">
                                  <h3 className="font-bold text-2xl leading-tight line-clamp-2 text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors cursor-pointer">
                                    <a href={video.url} target="_blank" rel="noopener noreferrer">
                                      {video.title}
                                    </a>
                                  </h3>
                                  
                                  <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                        <User className="h-3 w-3 text-white" />
                                      </div>
                                      <span className="font-semibold">{video.channelTitle}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      <span>{formatDate(video.publishedAt)}</span>
                                    </div>
                                    {video.viewCount && (
                                      <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        <span>{formatViewCount(video.viewCount)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <p className="text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed text-lg">
                                  {video.description}
                                </p>

                                <div className="flex gap-4 pt-4">
                                  <Button size="lg" className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg" asChild>
                                    <a href={video.url} target="_blank" rel="noopener noreferrer">
                                      <Play className="h-4 w-4 mr-2" />
                                      Watch Now
                                    </a>
                                  </Button>
                                  <Button size="lg" variant="outline" className="shadow-lg" asChild>
                                    <a href={video.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open in YouTube
                                    </a>
                                  </Button>
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
            {lecture.videoSearchQueries && lecture.videoSearchQueries.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Hash className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-900 to-blue-900 dark:from-purple-100 dark:to-blue-100 bg-clip-text text-transparent">
                        Search Queries Used for {lecture.topic}
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Keywords and terms used to find relevant educational content
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex flex-wrap gap-4">
                    {lecture.videoSearchQueries.map((query, index) => (
                      <Badge 
                        key={index} 
                        className="px-6 py-3 text-sm font-medium cursor-pointer bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800/50 dark:hover:to-blue-800/50 transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        <a 
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          {query}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}