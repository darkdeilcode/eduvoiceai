"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";

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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Save, Eye, EyeOff, Sparkles, Shield, AlertTriangle, Zap, CheckCircle, Brain, Lock } from "lucide-react";

const apiKeyFormSchema = z.object({
  geminiApiKey: z.string().optional().describe("Your Google AI Gemini API Key."),
  openaiApiKey: z.string().optional().describe("Your OpenAI API Key."),
  claudeApiKey: z.string().optional().describe("Your Anthropic Claude API Key."),
});

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({
    geminiApiKey: false,
    openaiApiKey: false,
    claudeApiKey: false,
  });

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      geminiApiKey: "",
      openaiApiKey: "",
      claudeApiKey: "",
    },
  });

  useEffect(() => {
    try {
      const savedKeysRaw = localStorage.getItem("eduvoice_api_keys");
      if (savedKeysRaw) {
        const savedKeys = JSON.parse(savedKeysRaw);
        form.reset({
          geminiApiKey: savedKeys.geminiApiKey || "",
          openaiApiKey: savedKeys.openaiApiKey || "",
          claudeApiKey: savedKeys.claudeApiKey || "",
        });
      }
    } catch (error) {
      console.error("Failed to load API keys from local storage:", error);
      toast({
        title: "Error",
        description: "Could not load saved API keys.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [form, toast]);

  async function onSubmit(data: ApiKeyFormValues) {
    setIsLoading(true);
    try {
      localStorage.setItem("eduvoice_api_keys", JSON.stringify(data));
      toast({
        title: "🎉 API Keys Updated",
        description: "Your API keys have been securely saved.",
        action: (
          <div className="w-full space-y-1">
            {data.geminiApiKey && <p className="text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />Gemini: ...{data.geminiApiKey.slice(-4)}</p>}
            {data.openaiApiKey && <p className="text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />OpenAI: ...{data.openaiApiKey.slice(-4)}</p>}
            {data.claudeApiKey && <p className="text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />Claude: ...{data.claudeApiKey.slice(-4)}</p>}
          </div>
        ),
      });
    } catch (error) {
       console.error("Failed to save API keys to local storage:", error);
       toast({
        title: "Error Saving Keys",
        description: "Could not save API keys to local storage. Your changes might not persist.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  const toggleShowKey = (keyField: keyof ApiKeyFormValues) => {
    setShowKeys(prev => ({ ...prev, [keyField]: !prev[keyField] }));
  };

  const apiProviders = [
    { 
      name: "geminiApiKey" as keyof ApiKeyFormValues, 
      label: "Google AI Gemini", 
      placeholder: "Enter your Gemini API Key (starts with 'AIza...')", 
      icon: <div className="p-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg"><Sparkles className="h-4 w-4 text-white" /></div>,
      description: "Access Google's powerful Gemini models for advanced AI capabilities"
    },
    { 
      name: "openaiApiKey" as keyof ApiKeyFormValues, 
      label: "OpenAI GPT", 
      placeholder: "Enter your OpenAI API Key (starts with 'sk-...')", 
      icon: <div className="p-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg"><Brain className="h-4 w-4 text-white" /></div>,
      description: "Integrate with ChatGPT and GPT-4 for conversational AI features"
    },
    { 
      name: "claudeApiKey" as keyof ApiKeyFormValues, 
      label: "Anthropic Claude", 
      placeholder: "Enter your Claude API Key (starts with 'sk-ant-...')", 
      icon: <div className="p-1.5 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg"><Zap className="h-4 w-4 text-white" /></div>,
      description: "Leverage Claude's advanced reasoning for complex educational content"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl">
              <Key className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-headline text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                API Key Management
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg mt-2">
                🔐 Securely configure your AI provider keys for enhanced features and personalized usage limits
              </p>
            </div>
          </div>
        </div>

        {/* API Keys Configuration Card */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-headline text-2xl font-bold text-slate-900 dark:text-white">
                  Your AI Provider Keys
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  Connect your AI accounts to unlock premium features and higher rate limits
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {apiProviders.map((provider) => {
                  const hasValue = form.watch(provider.name);
                  return (
                    <FormField
                      key={provider.name}
                      control={form.control}
                      name={provider.name}
                      render={({ field }) => (
                        <FormItem>
                          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6 border border-slate-200 dark:border-slate-600">
                            <FormLabel className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white mb-3">
                              {provider.icon}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span>{provider.label}</span>
                                  {hasValue && (
                                    <div className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                      <CheckCircle className="h-3 w-3" />
                                      Connected
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-normal mt-1">
                                  {provider.description}
                                </p>
                              </div>
                            </FormLabel>
                            <div className="flex items-center gap-3">
                              <FormControl className="flex-1">
                                <Input
                                  type={showKeys[provider.name] ? "text" : "password"}
                                  placeholder={provider.placeholder}
                                  {...field}
                                  disabled={isLoading}
                                  className="text-sm bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl h-12 focus:border-blue-500 dark:focus:border-blue-400"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => toggleShowKey(provider.name)}
                                disabled={isLoading}
                                aria-label={showKeys[provider.name] ? "Hide API key" : "Show API key"}
                                className="h-12 w-12 rounded-xl border-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm hover:scale-105 transition-transform"
                              >
                                {showKeys[provider.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <FormMessage className="mt-2" />
                          </div>
                        </FormItem>
                      )}
                    />
                  );
                })}
                
                <div className="flex justify-center pt-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading || form.formState.isSubmitting} 
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-xl shadow-lg px-8 py-3 text-lg"
                    size="lg"
                  >
                    {isLoading || form.formState.isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Save API Keys
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security & Usage Information */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Security Card */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-b border-red-200/50 dark:border-red-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="font-headline text-xl font-bold text-slate-900 dark:text-white">
                  🔒 Security Notice
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Local Storage Only</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your API keys are stored locally in your browser for this prototype. In production, keys should be securely managed server-side.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Keep Keys Private</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Never share your API keys with others. They provide access to your AI provider accounts and usage quotas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage & Benefits Card */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="font-headline text-xl font-bold text-slate-900 dark:text-white">
                  ⚡ Usage & Benefits
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Enhanced Features</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Access advanced AI models for Topic Lectures, Mock Interviews, and Q&A Prep with your personal rate limits.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Usage Costs</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    API usage will incur costs on your provider accounts. Monitor your usage through their respective dashboards.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}