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
      title: "Mock Interview Practice",
      description: "Practice job interviews with AI that provides real-time feedback",
      cost: "1000 tokens",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: ClipboardList,
      title: "QA Quiz Preparation",
      description: "Generate custom quizzes from PDF materials for exam preparation",
      cost: "50 tokens per question",
      color: "from-indigo-500 to-purple-600"
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
                      <Link href={`/${index === 0 ? 'lectures' : index === 1 ? 'interviews' : 'qa-prep'}`}>
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

            {/* Mock Interview Practice */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <MessageSquareText className="h-8 w-8 text-blue-600" />
                  Mock Interview Practice
                </CardTitle>
                <CardDescription className="text-lg">
                  Practice job interviews with AI that adapts to your responses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Interview Process:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Upload your resume and job description</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>AI asks relevant questions based on your profile</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Real-time feedback on your responses</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Detailed performance report with improvement tips</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Smart Features:</h3>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <Timer className="h-5 w-5 text-blue-500" />
                        <span>10-minute timed sessions</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span>Performance scoring (0-100)</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <Target className="h-5 w-5 text-red-500" />
                        <span>Question-specific feedback</span>
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
                    Perfect your interview skills with personalized AI feedback and detailed performance analytics.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* QA Quiz Preparation */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <ClipboardList className="h-8 w-8 text-indigo-600" />
                  QA Quiz Preparation
                </CardTitle>
                <CardDescription className="text-lg">
                  Generate custom quizzes from your study materials for effective exam preparation
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Quiz Generation:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Upload PDF study materials (max 10MB)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Choose number of questions (10-50)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Set quiz duration (10-50 minutes)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>AI generates relevant questions from content</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Quiz Features:</h3>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        <span>Timed exam simulation</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span>Detailed scoring & feedback</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                        <FileText className="h-5 w-5 text-green-500" />
                        <span>Question-by-question analysis</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-6 w-6 text-indigo-600" />
                    <span className="font-semibold text-lg">Token Cost: 50 tokens per question</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Transform your study materials into personalized quizzes for effective exam preparation.
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
                        <span>Mock Interview Session</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        1000 tokens
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="h-5 w-5 text-indigo-600" />
                        <span>QA Quiz (per question)</span>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        50 tokens
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Free Credits:</h3>
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl p-6">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold text-green-600">5,000</div>
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