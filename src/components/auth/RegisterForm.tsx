"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { OAuthButtons } from "./OAuthButtons";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  Sparkles, 
  BrainCircuit, 
  Shield, 
  Check 
} from "lucide-react";

const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).max(128, { message: "Username cannot exceed 128 characters."}),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (typeof window === 'undefined') return;
    
    if (!acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept our Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    form.clearErrors(); 

    try {
      const response = await fetch('/api/custom-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      let result;
      let responseTextForError = "";
      try {
        if (!response.ok) {
          responseTextForError = await response.text();
        }
        result = JSON.parse(responseTextForError || await response.text());
      } catch (jsonError: any) {
        console.error("API response was not valid JSON. Status:", response.status, "Raw response snippet:", responseTextForError.substring(0, 500) || "Response body was empty or unreadable.");
        toast({
          title: "Registration Failed",
          description: `Received an invalid response from the server (status ${response.status}). ${responseTextForError ? `Details: ${responseTextForError.substring(0,100)}...` : 'Please check server logs.'}`,
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        toast({
          title: "Registration Failed",
          description: result.message || "An unknown error occurred during registration.",
          variant: "destructive",
        });
        if (result.type === 'user_email_already_exists' || result.message?.toLowerCase().includes('email already exists')) {
            form.setError("email", {message: "This email address is already in use."});
        } else if (result.type === 'user_already_exists' || result.message?.toLowerCase().includes('user already exists')) {
             form.setError("username", {message: "This username is already taken."});
        }
        return;
      }
      
      toast({
        title: "🎉 Account Created!",
        description: `Welcome to EduVoice AI! Your account for ${values.email} has been created successfully.`,
      });
      router.push("/login");

    } catch (error: any) {
      console.error("Network or unexpected error during registration:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected network error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Brand Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-2xl mb-4">
              <BrainCircuit className="h-12 w-12 text-white mx-auto" />
            </div>
          </div>
          <h1 className="font-headline text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
            Join EduVoice AI
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Create your account and start learning with AI
          </p>
        </div>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200/50 dark:border-green-800/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              <CardTitle className="font-headline text-xl font-bold text-slate-900 dark:text-white">
                Create Account
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Start your personalized AI learning experience today
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Username
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Choose a unique username" 
                            {...field} 
                            className="h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
                          />
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter your email address" 
                            {...field} 
                            className="h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
                          />
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password" 
                            {...field} 
                            className="h-12 pl-12 pr-12 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
                          />
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Must be at least 8 characters long
                      </p>
                    </FormItem>
                  )}
                />

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-3">
                  <div className="flex items-center h-5">
                    <input 
                      id="terms" 
                      type="checkbox" 
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="terms" className="text-slate-600 dark:text-slate-400">
                      I agree to the{" "}
                      <Link href="/terms" className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium underline">
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
                  disabled={form.formState.isSubmitting || !acceptTerms}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                  Or sign up with
                </span>
              </div>
            </div>
            
            <OAuthButtons />
          </CardContent>
          
          <CardFooter className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/30 dark:to-slate-600/30 border-t border-slate-200/50 dark:border-slate-600/50 p-6">
            <div className="w-full text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-semibold hover:underline"
                >
                  Sign in here
                </Link>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                Join thousands of learners enhancing their skills with AI
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Benefits Section */}
        <div className="mt-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 dark:border-slate-600/50">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Free account with 60000 AI tokens
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                <BrainCircuit className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Access to all AI learning features
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Secure & privacy-focused platform
              </span>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-600/50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Your data is protected with enterprise-grade security
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}