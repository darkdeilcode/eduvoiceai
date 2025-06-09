"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { SUPPORTED_LANGUAGES, LANGUAGE_TEST_TOKEN_COST } from "@/types/languageTest";
import type { LanguageTestConfig, TavusAPIConfig } from "@/types/languageTest";
import { 
  Languages, 
  MessageSquare, 
  Video, 
  Coins, 
  AlertCircle, 
  Brain,
  Clock,
  Target,
  Zap
} from "lucide-react";

interface LanguageSelectorProps {
  onStartTest: (config: LanguageTestConfig, tavusConfig?: TavusAPIConfig) => void;
  onStartVideoTest?: (
    config: LanguageTestConfig, 
    tavusConfig?: TavusAPIConfig, 
    useConversationalMode?: boolean, 
    cviOptions?: { replicaId?: string; personaId?: string }
  ) => void;
  userTokenBalance: number;
  isLoading?: boolean;
}

export function LanguageSelector({ onStartTest, onStartVideoTest, userTokenBalance, isLoading = false }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [useCustomTavusKey, setUseCustomTavusKey] = useState(false);
  const [customTavusKey, setCustomTavusKey] = useState("");
  const [customReplicaId, setCustomReplicaId] = useState("");
  const [enableTavusVideos, setEnableTavusVideos] = useState(true);
  const [cviPersonaId, setCviPersonaId] = useState("");
  const [cviReplicaId, setCviReplicaId] = useState("");

  const selectedLangData = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);
  const hasEnoughTokens = userTokenBalance >= LANGUAGE_TEST_TOKEN_COST;

  const handleStartTest = () => {
    if (!selectedLangData || !hasEnoughTokens) return;

    const config: LanguageTestConfig = {
      language: selectedLangData.name,
      languageCode: selectedLangData.code,
      difficulty,
      testType: 'conversation', // Always use conversation for AI mode
      duration: 10 // Fixed 10 minutes for conversational mode
    };

    const tavusConfig: TavusAPIConfig | undefined = enableTavusVideos ? {
      enable_recording: true,
      language: selectedLangData.code,
      apiKey: useCustomTavusKey ? customTavusKey : undefined,
      replicaId: useCustomTavusKey && customReplicaId ? customReplicaId : undefined,
      personaId: cviPersonaId ? cviPersonaId : undefined
    } : undefined;

    const cviOptions = {
      replicaId: cviReplicaId || undefined,
      personaId: cviPersonaId || undefined
    };

    // Always use conversational mode with onStartVideoTest
    if (onStartVideoTest) {
      onStartVideoTest(config, tavusConfig, true, cviOptions);
    } else {
      onStartTest(config, tavusConfig);
    }
  };

  const getDifficultyDescription = (level: string) => {
    switch (level) {
      case "beginner":
        return "Basic vocabulary and simple sentences (A1-A2 CEFR)";
      case "intermediate":
        return "Conversational fluency and complex topics (B1-B2 CEFR)";
      case "advanced":
        return "Native-like proficiency and nuanced communication (C1-C2 CEFR)";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced AI Conversation Mode Info */}
      <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950 dark:via-purple-950 dark:to-blue-950 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-blue-900 dark:text-blue-100">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            AI Conversational Language Assessment
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300 text-base">
            Engage in natural conversation with advanced AI avatars powered by Tavus technology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              Experience a revolutionary 10-minute interactive session that evaluates your speaking skills through 
              natural conversation. Our AI avatar provides real-time feedback and comprehensive CEFR-aligned assessment.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700">
              <Video className="h-3 w-3 mr-1" />
              Tavus CVI
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700">
              <Clock className="h-3 w-3 mr-1" />
              10 Minutes
            </Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700">
              <Brain className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700">
              <Target className="h-3 w-3 mr-1" />
              CEFR Aligned
            </Badge>
          </div>
          
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">System Requirements</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              Camera and microphone access required for seamless video conversation experience with AI avatar.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enhanced Language and Test Configuration */}
        <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-900 dark:text-blue-100">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Test Configuration
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Configure your personalized language assessment experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-3">
              <Label htmlFor="language" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Choose your target language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-3">
                        <span className="text-lg">{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-3">
              <Label htmlFor="difficulty" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                <SelectTrigger className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Beginner (A1-A2)</span>
                      <span className="text-xs text-muted-foreground">Basic conversations</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Intermediate (B1-B2)</span>
                      <span className="text-xs text-muted-foreground">Complex topics</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Advanced (C1-C2)</span>
                      <span className="text-xs text-muted-foreground">Native-like fluency</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  {getDifficultyDescription(difficulty)}
                </p>
              </div>
            </div>

            {/* Duration Display */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assessment Duration</Label>
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">10 Minutes</p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Optimized for comprehensive evaluation
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CVI Configuration */}
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="cviPersonaId" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Persona ID (Optional)</Label>
                <Input
                  id="cviPersonaId"
                  placeholder="Enter Tavus Persona ID"
                  value={cviPersonaId}
                  onChange={(e) => setCviPersonaId(e.target.value)}
                  className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Specify a custom Tavus persona for the conversation
                </p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="cviReplicaId" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Replica ID (Optional)</Label>
                <Input
                  id="cviReplicaId"
                  placeholder="Enter Tavus Replica ID"
                  value={cviReplicaId}
                  onChange={(e) => setCviReplicaId(e.target.value)}
                  className="border-blue-200 dark:border-blue-800 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Specify a custom Tavus replica for the AI avatar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tavus Configuration and Test Summary */}
        <div className="space-y-6">
          {/* Tavus API Configuration */}
          <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 border-purple-200 dark:border-purple-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-purple-900 dark:text-purple-100">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                AI Avatar Configuration
              </CardTitle>
              <CardDescription className="text-purple-700 dark:text-purple-300">
                Configure Tavus.io API for premium AI video avatars
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="space-y-0.5">
                  <Label className="text-purple-800 dark:text-purple-200">Enable AI Video Avatars</Label>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Use Tavus.io video avatars for conversation
                  </p>
                </div>
                <Switch 
                  checked={enableTavusVideos} 
                  onCheckedChange={setEnableTavusVideos}
                />
              </div>

              {enableTavusVideos && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="space-y-0.5">
                    <Label className="text-blue-800 dark:text-blue-200">Use Custom Tavus API Key</Label>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Use your own Tavus API key instead of the default
                    </p>
                  </div>
                  <Switch 
                    checked={useCustomTavusKey} 
                    onCheckedChange={setUseCustomTavusKey}
                  />
                </div>
              )}

              {useCustomTavusKey && (
                <div className="space-y-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <Label htmlFor="tavusKey" className="text-sm font-semibold">Tavus API Key</Label>
                    <Input
                      id="tavusKey"
                      type="password"
                      placeholder="Enter your Tavus API key"
                      value={customTavusKey}
                      onChange={(e) => setCustomTavusKey(e.target.value)}
                      className="border-blue-200 dark:border-blue-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="replicaId" className="text-sm font-semibold">Replica ID (Optional)</Label>
                    <Input
                      id="replicaId"
                      placeholder="Enter specific replica ID"
                      value={customReplicaId}
                      onChange={(e) => setCustomReplicaId(e.target.value)}
                      className="border-blue-200 dark:border-blue-800"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Leave empty to use the default replica
                    </p>
                  </div>
                </div>
              )}

              {!useCustomTavusKey && (
                <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                      Using premium system configuration with optimized AI models
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Test Summary */}
          <Card className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-orange-950 border-orange-200 dark:border-orange-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-900 dark:text-orange-100">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Assessment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="font-semibold text-orange-800 dark:text-orange-200">Language</p>
                  <p className="text-orange-700 dark:text-orange-300 mt-1">
                    {selectedLangData ? `${selectedLangData.flag} ${selectedLangData.name}` : "Not selected"}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-800 dark:text-blue-200">Difficulty</p>
                  <p className="text-blue-700 dark:text-blue-300 capitalize mt-1">{difficulty}</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="font-semibold text-purple-800 dark:text-purple-200">Test Type</p>
                  <p className="text-purple-700 dark:text-purple-300 mt-1">AI Conversation</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="font-semibold text-green-800 dark:text-green-200">Duration</p>
                  <p className="text-green-700 dark:text-green-300 mt-1">10 minutes</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <span className="font-semibold text-amber-800 dark:text-amber-200">Token Cost</span>
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300">
                    <Coins className="h-3 w-3 mr-1" />
                    {LANGUAGE_TEST_TOKEN_COST.toLocaleString()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Your Balance</span>
                  <span className={`font-bold ${hasEnoughTokens ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {userTokenBalance.toLocaleString()} tokens
                  </span>
                </div>

                {!hasEnoughTokens && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <p className="font-semibold text-red-800 dark:text-red-200">Insufficient Tokens</p>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      You need {LANGUAGE_TEST_TOKEN_COST.toLocaleString()} tokens to start this assessment.
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleStartTest}
                  disabled={!selectedLanguage || !hasEnoughTokens || isLoading || (useCustomTavusKey && !customTavusKey)}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Starting Assessment...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-5 w-5 mr-3" />
                      Start AI Conversation Assessment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
