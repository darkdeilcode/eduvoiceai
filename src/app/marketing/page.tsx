"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  BookOpen, 
  Mic, 
  MessageSquare, 
  Languages, 
  Sparkles, 
  Users, 
  Settings, 
  ShieldCheck,
  ArrowRight,
  Star,
  Zap,
  Brain,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Play,
  Globe,
  Code,
  Headphones,
  Trophy,
  Clock,
  Infinity,
  FileText
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: <Brain className="h-8 w-8" />,
    title: "AI-Powered Lectures",
    description: "Generate comprehensive lectures on any topic with advanced AI that understands context and creates engaging content.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: <Mic className="h-8 w-8" />,
    title: "Voice Interview Practice",
    description: "Practice real interviews with our AI agent that provides instant feedback and improvement suggestions.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: <MessageSquare className="h-8 w-8" />,
    title: "Smart Q&A Assistant",
    description: "Get instant answers and explanations on any subject with our intelligent question-answering system.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: <Languages className="h-8 w-8" />,
    title: "Multi-Language Support",
    description: "Learn and practice in multiple languages with native-level pronunciation and grammar correction.",
    gradient: "from-orange-500 to-red-500"
  },
];

const screenshots = [
    {
    id: 1,
    title: "Dashboard Overview",
    description: "Create comprehensive lectures on any topic",
    image: "/screenshots/1.png", // Fixed: was "/screenshorts/"
    alt: "AI generating a lecture on machine learning"
  },
  {
    id: 2,
    title: "AI Lecture Generation",
    description: "Create comprehensive lectures on any topic",
    image: "/screenshots/2.png", // Fixed: was "/screenshorts/"
    alt: "AI generating a lecture on machine learning"
  },
  {
    id: 3,
    title: "Voice Interview Practice",
    description: "Practice interviews with AI feedback", 
    image: "/screenshots/3.png", // Fixed: was "/screenshorts/"
    alt: "User practicing interview with AI agent"
  },
  {
    id: 4,
    title: "Smart Q&A Sessions",
    description: "Get instant answers to complex questions",
    image: "/screenshots/4.png", // Fixed: was "/screenshorts/"
    alt: "AI answering student questions"
  },
  {
    id: 5,
    title: "Interview History",
    description: "Interactive language practice sessions",
    image: "/screenshots/5.png", // Fixed: was "/language-learning.png"
    alt: "Language learning interface with AI tutor"
  },
    {
    id: 6,
    title: "Interview Report",
    description: "Interactive language practice sessions",
    image: "/screenshots/6.png", // Fixed: was "/language-learning.png"
    alt: "Language learning interface with AI tutor"
  },
    {
    id: 7,
    title: "Lecture Details",
    description: "Interactive language practice sessions",
    image: "/screenshots/7.png", // Fixed: was "/language-learning.png"
    alt: "Language learning interface with AI tutor"
  },
    {
    id: 8,
    title: "Subscription Page",
    description: "Interactive language practice sessions",
    image: "/screenshots/9.png", // Fixed: was "/language-learning.png"
    alt: "Language learning interface with AI tutor"
  },
    {
    id: 9,
    title: "Profile",
    description: "Interactive language practice sessions",
    image: "/screenshots/10.png", // Fixed: was "/language-learning.png"
    alt: "Language learning interface with AI tutor"
  }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Computer Science Student",
    content: "EduVoice AI transformed my study routine. The AI-generated lectures are incredibly detailed and the interview practice helped me land my dream job!",
    avatar: "SC",
    rating: 5
  },
  {
    name: "Michael Rodriguez",
    role: "Data Analyst",
    content: "The voice interaction feels so natural. It's like having a personal tutor available 24/7. Best investment in my career development.",
    avatar: "MR", 
    rating: 5
  },
  {
    name: "Emily Johnson",
    role: "Marketing Manager",
    content: "I used EduVoice AI to prepare for my recent promotion interview. The feedback was spot-on and helped me identify areas for improvement.",
    avatar: "EJ",
    rating: 5
  }
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col space-y-8">
              <div className="space-y-6">
                <Badge className="w-fit bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Powered by Advanced AI
                </Badge>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                  Your Personal
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"> AI Learning </span>
                  Agent
                </h1>
                
                <p className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-2xl">
                  Transform your education with AI-powered voice interactions. Generate lectures, practice interviews, and master any subject with your personal AI tutor.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/40">
                  <Link href="/register" className="flex items-center">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                 <Button size="lg" variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-white px-8 py-4 text-lg backdrop-blur-sm">
    <Link href="/docs" className="flex items-center">
      <FileText className="mr-2 h-5 w-5" />
      Documentation
    </Link>
  </Button>
                
              </div>

              <div className="flex items-center space-x-8 text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>60,000 free tokens</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl transform rotate-6" />
              <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                <Image
                  src="/eduvoiceai.png"
                  alt="AI-powered education with robot tutor and student learning together"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-2xl shadow-lg"
                  priority
                />
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-3 shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

         {/* Screenshot Slider Section */}
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">
            <Code className="w-3 h-3 mr-1" />
            See It In Action
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Experience the Power of AI Learning
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Discover how our AI agent transforms traditional learning with interactive, personalized experiences
          </p>
        </div>
    
        <div className="relative max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {screenshots.map((screenshot, index) => (
                <div key={screenshot.id} className="w-full flex-shrink-0">
                  <div className="relative aspect-video">
                    <Image
                      src={screenshot.image}
                      alt={screenshot.alt}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                              <div class="text-center space-y-4 p-8">
                                <div class="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                                  <svg class="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <h3 class="text-2xl font-bold text-slate-800 dark:text-white">${screenshot.title}</h3>
                                <p class="text-slate-600 dark:text-slate-300 max-w-md mx-auto">${screenshot.description}</p>
                                <div class="bg-slate-200 dark:bg-slate-700 rounded-lg p-4 text-sm text-slate-500 dark:text-slate-400">
                                  Image not found: ${screenshot.image}
                                </div>
                              </div>
                            </div>
                          `;
                        }
                      }}
                    />
                    
                    {/* Overlay with title and description */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{screenshot.title}</h3>
                      <p className="text-slate-200">{screenshot.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
    
          {/* Navigation */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
    
          {/* Dots indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {screenshots.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-purple-500 scale-125' 
                    : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
              <Zap className="w-3 h-3 mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Our AI-powered platform offers cutting-edge tools designed to accelerate your learning journey
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <CardHeader className="space-y-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto mt-20">
            <div className="text-center space-y-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Admin Dashboard</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive user management and analytics</p>
            </div>
            
            <div className="text-center space-y-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">API Integration</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Connect your own OpenAI, Gemini, or Claude keys</p>
            </div>
            
            <div className="text-center space-y-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Secure Platform</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Enterprise-grade security with OAuth support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">
              <Rocket className="w-3 h-3 mr-1" />
              Simple Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Start Free, Scale as You Grow
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Begin your AI learning journey with generous free credits, then continue with our affordable monthly plan
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Free Trial */}
            <Card className="relative overflow-hidden border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-xl">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-2 text-sm font-semibold">
                🎉 Perfect for Getting Started
              </div>
              <CardHeader className="pt-12 space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Free Trial</h3>
                  <p className="text-slate-600 dark:text-slate-400">First month completely free</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-600 dark:text-green-400">60,000</div>
                  <div className="text-slate-600 dark:text-slate-400">tokens included</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Full access to all AI features</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Generate 100+ lectures</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Unlimited voice interactions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Interview practice sessions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Multi-language support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">No credit card required</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 shadow-lg" size="lg">
                  <Link href="/register" className="flex items-center justify-center w-full">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="relative overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 shadow-xl">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-center py-2 text-sm font-semibold">
                ⭐ Most Popular Choice
              </div>
              <CardHeader className="pt-12 space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Monthly Plan</h3>
                  <p className="text-slate-600 dark:text-slate-400">Continue your learning journey</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-purple-600 dark:text-purple-400">$10</div>
                  <div className="text-slate-600 dark:text-slate-400">per month</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Everything in Free Trial</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Infinity className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Unlimited token usage</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Priority support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Headphones className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Advanced voice features</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">API key integration</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Cancel anytime</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 shadow-lg" size="lg">
                  <Link href="/register" className="flex items-center justify-center w-full">
                    Get Started
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12 space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Questions about pricing? <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline">Contact our team</Link>
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center space-x-1">
                <Headphones className="h-4 w-4" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
              <Star className="w-3 h-3 mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Loved by Learners Worldwide
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              See how EduVoice AI is transforming education for students and professionals
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative container mx-auto px-4 text-center">
          <div className="space-y-8 max-w-4xl mx-auto">
            <Badge className="bg-white/20 text-white border-white/30">
              <Rocket className="w-3 h-3 mr-1" />
              Ready to Transform Your Learning?
            </Badge>
            
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Join Thousands of Learners Using
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"> EduVoice AI</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              Start your free trial today with 60,000 tokens and experience the future of AI-powered education.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 text-lg font-semibold shadow-xl">
                <Link href="/register" className="flex items-center">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 hover:bg-white/20 text-white px-8 py-4 text-lg backdrop-blur-sm">
                <MessageSquare className="mr-2 h-5 w-5" />
                Contact Sales
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>60,000 free tokens</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}