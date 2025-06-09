"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpenText, 
  MessageSquareText, 
  ClipboardList,
  Zap,
  Clock,
  DollarSign,
  Star,
  PlayCircle,
  FileText,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Award,
  ExternalLink,
  User,
  Code,
  Heart,
  Globe,
  Sparkles,
  Youtube,
  Brain,
  Timer,
  CreditCard,
  Key,
  Settings,
  Shield,
  Users,
  TrendingUp,
  ChevronRight,
  Info,
  Home,
  BrainCircuit
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function DocumentationPage() {
  const features = [
    {
      icon: BookOpenText,
      title: "AI Lecture Generation",
      description: "Generate comprehensive lectures on any topic with AI-curated YouTube videos",
      cost: "500 tokens",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: MessageSquareText,
      title: "AI Mock Interview",
      description: "Practice job interviews with AI voice-based feedback and personalized questions",
      cost: "1000 tokens",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: ClipboardList,
      title: "AI Quiz Generator",
      description: "Generate custom quizzes from PDF materials for exam preparation",
      cost: "100 tokens per question",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: Globe,
      title: "Language Assessment Hub",
      description: "Comprehensive language testing with video assessments in 13+ languages",
      cost: "10000 tokens",
      color: "from-green-500 to-emerald-600"
    }
  ];

  const workflowSteps = [
    {
      step: "1",
      title: "Create Account",
      description: "Sign up and get 5000 free tokens to start your learning journey",
      icon: User
    },
    {
      step: "2", 
      title: "Choose Feature",
      description: "Select from AI Lectures, Mock Interviews, or QA Preparation",
      icon: Target
    },
    {
      step: "3",
      title: "Generate Content",
      description: "Our AI creates personalized educational content for you",
      icon: Sparkles
    },
    {
      step: "4",
      title: "Learn & Practice",
      description: "Engage with content, practice skills, and track your progress",
      icon: TrendingUp
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Header */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-20 animate-pulse group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl group-hover:scale-105 transition-transform">
                  <BrainCircuit className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-headline font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  EduVoice AI
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  🚀 AI-Powered Learning
                </span>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl">
                <Link href="/lectures">
                  <BookOpenText className="h-4 w-4 mr-2" />
                  Try Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="hidden lg:flex justify-center">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                <FileText className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="font-headline text-4xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                EduVoice AI Documentation
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Your complete guide to mastering AI-powered learning with personalized lectures, mock interviews, and intelligent quiz preparation.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <Brain className="h-4 w-4 mr-2" />
                AI-Powered Learning
              </Badge>
              <Badge className="px-4 py-2 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
                <Shield className="h-4 w-4 mr-2" />
                Secure & Private
              </Badge>
              <Badge className="px-4 py-2 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                <Zap className="h-4 w-4 mr-2" />
                Token-Based System
              </Badge>
            </div>
          </div>

          {/* Quick Start Guide */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl lg:text-3xl font-bold flex items-center justify-center gap-3">
                <Lightbulb className="h-8 w-8 text-yellow-500" />
                How EduVoice AI Works
              </CardTitle>
              <CardDescription className="text-lg">
                Get started with our AI-powered educational platform in 4 simple steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 border-2 border-blue-200">
                        {step.step}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Core Features */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Core Features</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Explore our three powerful AI-driven learning tools
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden group hover:scale-105 transition-all duration-300">
                  <CardHeader className={`bg-gradient-to-r ${feature.color} text-white`}>
                    <div className="flex items-center justify-between">
                      <feature.icon className="h-8 w-8" />
                      <Badge className="bg-white/20 text-white border-white/30">
                        {feature.cost}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      {feature.description}
                    </p>
                    <Button 
                      asChild 
                      className="w-full bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 rounded-xl"
                    >
                      <Link href={`/${index === 0 ? 'lectures' : index === 1 ? 'interviews' : index === 2 ? 'qa-prep' : 'language'}`}>
                        Try Now <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed Feature Explanations */}
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-center">Feature Deep Dive</h2>

            {/* AI Lecture Generation */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <BookOpenText className="h-8 w-8 text-purple-600" />
                  AI Lecture Generation
                </CardTitle>
                <CardDescription className="text-lg">
                  Create comprehensive educational content on any topic with AI assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">How it works:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Enter any topic you want to learn about</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>AI generates detailed lecture content with explanations</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Curated YouTube videos enhance your learning experience</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Save lectures for future reference and review</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Key Features:</h3>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <Youtube className="h-5 w-5 text-red-500" />
                        <span>Integrated YouTube videos</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <span>Comprehensive summaries</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <PlayCircle className="h-5 w-5 text-green-500" />
                        <span>Downloadable playlists</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-6 w-6 text-purple-600" />
                    <span className="font-semibold text-lg">Token Cost: 500 tokens per lecture</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Generate unlimited educational content on any subject with our AI-powered lecture system.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Mock Interview */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <MessageSquareText className="h-8 w-8 text-blue-600" />
                  AI Mock Interview
                </CardTitle>
                <CardDescription className="text-lg">
                  Practice job interviews with AI in voice-only mode with personalized questions based on your CV
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Interview Process:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Describe the job position you're applying for</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Submit your CV/resume for personalized questions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>AI generates relevant interview questions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Conduct interview in voice-only mode</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Receive detailed feedback and performance analysis</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Key Features:</h3>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <MessageSquareText className="h-5 w-5 text-blue-500" />
                        <span>Voice-only interview mode</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <FileText className="h-5 w-5 text-green-500" />
                        <span>CV-based question generation</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <Timer className="h-5 w-5 text-orange-500" />
                        <span>Customizable duration</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span>Comprehensive feedback method</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-lg">Token Cost: 1000 tokens per interview</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Perfect your interview skills with voice-based AI interviews that provide personalized questions based on your CV and comprehensive feedback to help you improve.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Quiz Generator */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <ClipboardList className="h-8 w-8 text-indigo-600" />
                  AI Quiz Generator
                </CardTitle>
                <CardDescription className="text-lg">
                  Generate custom quizzes from your study materials with 5 different quiz methods for effective exam preparation
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Quiz Generation Process:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Upload PDF study materials (max 10MB)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Choose from 5 different quiz methods</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Set number of questions and duration</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>AI generates questions from your content</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Take quiz and receive detailed feedback</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">5 Quiz Methods Available:</h3>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-indigo-500" />
                        <span>Multiple Choice Questions</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-indigo-500" />
                        <span>True/False Questions</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-indigo-500" />
                        <span>Fill in the Blanks</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-indigo-500" />
                        <span>Short Answer Questions</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-indigo-500" />
                        <span>Essay Questions</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-6 w-6 text-indigo-600" />
                    <span className="font-semibold text-lg">Token Cost: 5 tokens per question</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Transform your study materials into personalized quizzes with 5 different question types for comprehensive exam preparation.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Language Assessment Hub */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Globe className="h-8 w-8 text-green-600" />
                  Language Assessment Hub
                </CardTitle>
                <CardDescription className="text-lg">
                  Comprehensive language testing with video assessments supporting 13+ languages
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Assessment Process:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Choose from 13+ supported languages</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Take comprehensive video-based language test</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>AI evaluates speaking, pronunciation, and fluency</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Receive detailed CEFR-based assessment report</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Get personalized improvement recommendations</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Supported Languages:</h3>
                    <div className="grid gap-2 grid-cols-2">
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>English</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Spanish</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>French</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>German</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Italian</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Portuguese</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Chinese</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Japanese</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Korean</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Arabic</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Russian</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Hindi</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Dutch</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>+ More</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-6 w-6 text-green-600" />
                    <span className="font-semibold text-lg">Token Cost: 10,000 tokens per assessment</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Get professional-grade language assessment with video-based testing, CEFR scoring, and detailed feedback to track your language proficiency across multiple languages.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Token System */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <CreditCard className="h-8 w-8 text-green-600" />
                Token System & Pricing
              </CardTitle>
              <CardDescription className="text-lg">
                Understand how our token-based system works for fair and flexible usage
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Token Costs:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <BookOpenText className="h-5 w-5 text-purple-600" />
                        <span>AI Lecture Generation</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        500 tokens
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquareText className="h-5 w-5 text-blue-600" />
                        <span>AI Mock Interview</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        1000 tokens
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="h-5 w-5 text-indigo-600" />
                        <span>AI Quiz Generator (per question)</span>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        100 tokens
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-green-600" />
                        <span>Language Assessment Hub</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        10000 tokens
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Free Credits:</h3>
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl p-6">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold text-green-600">60,000</div>
                      <div className="text-lg font-semibold">Free Tokens</div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Get started with generous free credits upon registration
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl">
                      <Link href="/settings/subscription">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Upgrade for More Tokens
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription & API Key Section */}
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
              <CardTitle className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                <CreditCard className="h-8 w-8" />
                Subscription & API Integration
              </CardTitle>
              <CardDescription className="text-lg text-orange-100">
                Flexible pricing plans and seamless API integration for developers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                    Subscription Plans
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-green-600">Free Plan</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">60,000 tokens upon registration</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Access to all features with token limits</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-blue-600">Premium Plans</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Additional token packages available</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Priority support and advanced features</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Key className="h-5 w-5 text-orange-600" />
                    API Key Integration
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold mb-2">How to Use Your API Key:</h4>
                      <ol className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                        <li>1. Navigate to Settings → API Keys</li>
                        <li>2. Generate or copy your personal API key</li>
                        <li>3. Include the key in your application headers</li>
                        <li>4. Make requests to our endpoints with authentication</li>
                      </ol>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        <strong>Security Note:</strong> Keep your API key secure and never expose it in client-side code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center pt-4">
                <Button asChild className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl">
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Subscription & API Keys
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Developer Section */}
          <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-white/10 rounded-2xl">
                    <Code className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl lg:text-4xl font-bold">About the Developer</h2>
                  <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    EduVoice AI was founded and developed by{" "}
                    <span className="font-semibold text-white">Md Jobayer Arafat</span>,
                    a passionate developer dedicated to revolutionizing education through artificial intelligence.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  <Badge className="px-4 py-2 bg-white/10 text-white border-white/20">
                    <User className="h-4 w-4 mr-2" />
                    Founder & Developer
                  </Badge>
                  <Badge className="px-4 py-2 bg-white/10 text-white border-white/20">
                    <Heart className="h-4 w-4 mr-2" />
                    Education Enthusiast
                  </Badge>
                  <Badge className="px-4 py-2 bg-white/10 text-white border-white/20">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Innovation
                  </Badge>
                </div>
                <div className="pt-4">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl"
                  >
                    <Link 
                      href="https://www.linkedin.com/in/md-jobayer-arafat-a14b61284/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect on LinkedIn
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started CTA */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-white/10 rounded-2xl">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold">Ready to Start Learning?</h2>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                  Join thousands of learners who are already using EduVoice AI to enhance their education and career prospects.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold px-8 py-3"
                >
                  <Link href="/lectures">
                    <BookOpenText className="h-5 w-5 mr-2" />
                    Generate Your First Lecture
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="border-white/30 text-white hover:bg-white/10 rounded-xl font-semibold px-8 py-3"
                >
                  <Link href="/dashboard">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support Info */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
              <Info className="h-5 w-5" />
              <span>Need help? Check out our dashboard or contact support through the platform.</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-slate-500">
              <span>✨ AI-Powered Learning</span>
              <span>🔒 Secure & Private</span>
              <span>💰 Fair Token Pricing</span>
              <span>📚 Unlimited Content</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}