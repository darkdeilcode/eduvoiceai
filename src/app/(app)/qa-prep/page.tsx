
"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle, Sparkles, FileText, ListOrdered, AlertTriangle, PlayCircle, RotateCcw, Clock, History, Upload, Zap, Target, Brain } from "lucide-react";
import { account, APPWRITE_DATABASE_ID, QA_REPORTS_COLLECTION_ID, databases, ID, Permission, Role } from "@/lib/appwrite";
import { Models, AppwriteException } from "appwrite";
import { generateQuizQuestions } from "@/ai/flows/quiz-generation-flow";
import type { QuizGenerationInput, QuizGenerationOutput } from "@/ai/flows/quiz-generation-flow";
import type { QAReport } from "@/types/qaReport";

const QA_PREP_TOKEN_COST_PER_QUESTION = 100;
const PDF_MAX_SIZE_MB = 2; // Reduced from 10MB to 2MB

const qaPrepFormSchema = z.object({
  pdfFile: z
    .custom<FileList>((val) => val instanceof FileList, "PDF file is required.")
    .refine((files) => files.length > 0, `PDF file is required.`)
    .refine((files) => files.length <= 1, `Only one PDF file can be uploaded.`)
    .refine(
      (files) => files.length === 0 || files[0].size <= PDF_MAX_SIZE_MB * 1024 * 1024,
      `PDF file size must be less than ${PDF_MAX_SIZE_MB}MB.`
    )
    .refine(
      (files) => files.length === 0 || files[0].type === "application/pdf",
      "File must be a PDF."
    ),
  numQuestions: z.enum(["10", "20", "30", "40", "50"], {
    required_error: "You need to select the number of questions.",
  }),
  duration: z.enum(["10", "20", "30", "40", "50"], {
    required_error: "You need to select the exam duration.",
  }),
});

type QAPrepFormValues = z.infer<typeof qaPrepFormSchema>;

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function QAPrepPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [quizReady, setQuizReady] = useState(false);
  const [currentQuizReport, setCurrentQuizReport] = useState<QAReport | null>(null);
  const [generatedQuestionsForDisplay, setGeneratedQuestionsForDisplay] = useState<string[]>([]);
  const [generatedAnswersForDisplay, setGeneratedAnswersForDisplay] = useState<string[]>([]);


  const form = useForm<QAPrepFormValues>({
    resolver: zodResolver(qaPrepFormSchema),
    defaultValues: {
      pdfFile: undefined,
      numQuestions: "10",
      duration: "10",
    },
  });

  async function onSubmit(values: QAPrepFormValues) {
    setIsLoading(true);
    setError(null);
    setQuizReady(false);
    setCurrentQuizReport(null);
    setGeneratedQuestionsForDisplay([]);
    setGeneratedAnswersForDisplay([]);

    let currentUser: Models.User<Models.Preferences>;
    try {
      currentUser = await account.get();
      if (!currentUser?.$id) {
        toast({ title: "Authentication Error", description: "User ID not found. Please ensure you are logged in.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    } catch (authError) {
      toast({ title: "Authentication Error", description: "Could not verify user. Please log in again.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    const userId = currentUser.$id; 

    const pdfFile = values.pdfFile[0];
    const numQuestionsSelected = parseInt(values.numQuestions);
    const durationSelected = parseInt(values.duration);
    const tokenCost = numQuestionsSelected * QA_PREP_TOKEN_COST_PER_QUESTION;

    try {
      const tokenResponse = await fetch('/api/user/deduct-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          amountToDeduct: tokenCost,
          description: `Q&A Prep Quiz Generation: ${pdfFile.name} (${numQuestionsSelected} questions)`
        }),
      });
      const tokenResult = await tokenResponse.json();
      if (!tokenResponse.ok) {
        if (tokenResponse.status === 402 && tokenResult.canSubscribe) {
          toast({
            title: "Insufficient Tokens",
            description: `${tokenResult.message || `You need ${tokenCost} tokens for this quiz.`} You have ${tokenResult.currentTokenBalance || 0}.`,
            variant: "destructive",
            action: <Button variant="outline" size="sm" asChild><Link href="/settings/subscription">Get More Tokens</Link></Button>,
            duration: 7000,
          });
        } else {
          throw new Error(tokenResult.message || "Failed to deduct tokens.");
        }
        setIsLoading(false);
        return;
      }
      toast({
        title: tokenResult.message.includes("skipped") ? "Pro User" : "Tokens Deducted",
        description: tokenResult.message.includes("skipped") ? `Quiz generation for "${pdfFile.name}" started.` : `Successfully deducted ${tokenResult.deductedAmount} tokens. New balance: ${tokenResult.newTokenBalance}. Generating quiz...`,
      });
    } catch (tokenError: any) {
      setError(`Token deduction failed: ${tokenError.message}`);
      toast({ title: "Token Error", description: `Could not process token deduction: ${tokenError.message}`, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    let pdfDataUri: string;
    try {
      pdfDataUri = await fileToDataUri(pdfFile);
    } catch (fileError: any) {
      setError(`Failed to read PDF file: ${fileError.message}`);
      toast({ title: "File Error", description: "Could not process the uploaded PDF.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    let userGeminiApiKey: string | undefined = undefined;
    try {
      const savedKeysRaw = localStorage.getItem("eduvoice_api_keys");
      if (savedKeysRaw) {
        const savedKeys = JSON.parse(savedKeysRaw);
        userGeminiApiKey = savedKeys.geminiApiKey;
      }
    } catch (e) { console.warn("Could not read API keys from localStorage", e); }

    const quizInput: QuizGenerationInput = {
      pdfDataUri,
      numQuestions: numQuestionsSelected,
      ...(userGeminiApiKey && { geminiApiKey: userGeminiApiKey }),
    };

    try {
      const generatedQuizOutput: QuizGenerationOutput = await generateQuizQuestions(quizInput);
      if (!generatedQuizOutput || !generatedQuizOutput.questions || generatedQuizOutput.questions.length === 0 || !generatedQuizOutput.correctAnswers || generatedQuizOutput.correctAnswers.length === 0) {
        throw new Error("The AI did not return any questions or answers. The PDF might be empty, unreadable, or the topic too narrow. If the AI service is overloaded, please try again later.");
      }
      if (generatedQuizOutput.questions.length !== generatedQuizOutput.correctAnswers.length) {
        console.warn("Mismatch between number of generated questions and answers. AI might have had an issue. Proceeding with available data.");
      }
      
      setGeneratedQuestionsForDisplay(generatedQuizOutput.questions); 
      setGeneratedAnswersForDisplay(generatedQuizOutput.correctAnswers);

      if (!APPWRITE_DATABASE_ID || !QA_REPORTS_COLLECTION_ID) {
        throw new Error("Appwrite DB/Collection ID for QA reports is not configured.");
      }

      const quizReportDataToSave: Omit<QAReport, keyof Models.Document | '$permissions' | '$databaseId' | '$collectionId'> = {
        userId: userId,
        pdfFileName: pdfFile.name,
        pdfDataUri: pdfDataUri, 
        quizTitle: generatedQuizOutput.extractedTopicGuess || `Quiz from ${pdfFile.name}`,
        numQuestionsSet: numQuestionsSelected,
        numQuestionsGenerated: generatedQuizOutput.questions.length,
        durationMinutes: durationSelected,
        generatedQuestions: JSON.stringify(generatedQuizOutput.questions),
        generatedCorrectAnswers: JSON.stringify(generatedQuizOutput.correctAnswers),
        status: "generated",
      };

      const createdDocument = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        QA_REPORTS_COLLECTION_ID,
        ID.unique(),
        quizReportDataToSave,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
      
      setCurrentQuizReport(createdDocument as QAReport);
      setQuizReady(true);
      form.reset(); 

      toast({
        title: "Quiz Generated & Saved!",
        description: `${generatedQuizOutput.questions.length} questions and answers generated for "${pdfFile.name}" and saved. Ready to start.`,
      });

    } catch (err) {
      console.error("Error generating or saving quiz:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during quiz processing.";
      setError(`Quiz generation/saving failed: ${errorMessage}`);
      toast({
        title: "Quiz Preparation Failed",
        description: `Could not prepare quiz. ${userGeminiApiKey ? "(Used your Gemini key). " : ""}Details: ${errorMessage.substring(0,150)}... If the error mentions service overload, please try again in a few moments.`,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleGenerateNewQuiz = () => {
    setQuizReady(false);
    setCurrentQuizReport(null);
    setError(null);
    setGeneratedQuestionsForDisplay([]);
    setGeneratedAnswersForDisplay([]);
  };
return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  AI Quiz Generator
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                🧠 Transform any PDF into an intelligent quiz with AI-powered questions and answers
              </p>
            </div>
            
            {!quizReady && (
              <Button variant="outline" asChild className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl">
                <Link href="/qa-prep/history">
                  <History className="mr-2 h-4 w-4" />
                  Quiz History
                </Link>
              </Button>
            )}
          </div>

          {/* Feature highlights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/40 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-xl">
                  <Upload className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-purple-800 dark:text-purple-200 font-semibold text-sm">Smart Upload</p>
                  <p className="text-purple-600 dark:text-purple-300 text-xs">PDF to Quiz in seconds</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/40 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-blue-800 dark:text-blue-200 font-semibold text-sm">Adaptive Questions</p>
                  <p className="text-blue-600 dark:text-blue-300 text-xs">AI generates relevant Q&A</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/40 rounded-2xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-xl">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-green-800 dark:text-green-200 font-semibold text-sm">Instant Results</p>
                  <p className="text-green-600 dark:text-green-300 text-xs">Real-time scoring</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-0 bg-red-50 dark:bg-red-950/50 backdrop-blur-xl rounded-2xl shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Quiz Generation Failed</AlertTitle>
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center space-y-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-full">
                  <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  🧠 AI is Working...
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  Analyzing your PDF and generating intelligent questions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Generation Form */}
        {!quizReady && !isLoading && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="font-headline text-3xl font-bold">Generate Your Quiz</CardTitle>
                  <CardDescription className="text-purple-100 text-lg mt-2">
                    Upload your PDF and let AI create personalized questions for you
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <p className="font-semibold text-purple-800 dark:text-purple-200">Token Pricing</p>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Cost: <span className="font-bold">{QA_PREP_TOKEN_COST_PER_QUESTION} tokens per question</span> • 
                  Max file size: <span className="font-bold">{PDF_MAX_SIZE_MB}MB</span>
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="pdfFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Upload PDF Document</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => field.onChange(e.target.files)}
                              disabled={isLoading}
                              className="h-16 text-lg border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-2xl bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-500">
                              <Upload className="h-6 w-6" />
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-base">
                          📄 Upload your study material (max {PDF_MAX_SIZE_MB}MB). Ensure the PDF contains selectable text for best results.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="numQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">Number of Questions</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                              <SelectTrigger className="h-14 text-base rounded-xl border-2">
                                <SelectValue placeholder="Select number of questions" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[10, 20, 30, 40, 50].map(num => (
                                <SelectItem key={num} value={String(num)} className="text-base py-3">
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{num} Questions</span>
                                    <span className="text-xs text-muted-foreground">
                                      Cost: {(num * QA_PREP_TOKEN_COST_PER_QUESTION).toLocaleString()} tokens
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">Exam Duration</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                              <SelectTrigger className="h-14 text-base rounded-xl border-2">
                                <SelectValue placeholder="Select exam duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[10, 20, 30, 40, 50].map(num => (
                                <SelectItem key={num} value={String(num)} className="text-base py-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-semibold">{num} Minutes</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl shadow-lg font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Generating Quiz...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-3 h-6 w-6" />
                        Generate AI Quiz & Answers
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

           
                {/* Quiz Ready State */}
                {quizReady && currentQuizReport && (
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                          <ListOrdered className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="font-headline text-3xl font-bold">🎉 Quiz Ready!</CardTitle>
                          <CardDescription className="text-green-100 text-lg mt-2">
                            Your AI-generated quiz is prepared and ready to take
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-8 space-y-6">
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6">
                        <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-white">Quiz Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{currentQuizReport.quizTitle}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Quiz Title</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{currentQuizReport.numQuestionsGenerated}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Questions Generated</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{currentQuizReport.durationMinutes} min</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Time Limit</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild size="lg" className="flex-1 h-14 text-lg bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 rounded-xl shadow-lg">
                          <Link href={`/qa-prep/exam/${currentQuizReport.$id}`}>
                            <PlayCircle className="mr-3 h-6 w-6" />
                            Start Exam Now
                          </Link>
                        </Button>
                        <Button onClick={handleGenerateNewQuiz} variant="outline" className="flex-1 h-14 text-lg rounded-xl border-2">
                          <RotateCcw className="mr-3 h-5 w-5" />
                          Generate New Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        }