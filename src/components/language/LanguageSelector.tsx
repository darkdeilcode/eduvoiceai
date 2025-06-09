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
  Zap,
  Sparkles,
  Globe
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
      {/* AI Conversation Mode Info */}
      <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950 dark:via-purple-950 dark:to-blue-950 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
              AI Conversational Language Test
            </span>
          </CardTitle>
          <CardDescription className="text-base text-gray-600 dark:text-gray-300">
            Experience natural conversation with Tavus AI avatar in your target language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Experience a natural conversation with an AI avatar powered by Tavus CVI technology. 
              This 10-minute interactive session provides real-time feedback and evaluates your 
              speaking skills in a conversational context.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0 hover:from-purple-600 hover:to-blue-700">
                <Sparkles className="h-3 w-3 mr-1" />
                Tavus CVI
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 hover:from-blue-600 hover:to-cyan-700">
                <Clock className="h-3 w-3 mr-1" />
                10 Minutes
              </Badge>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700">
                <MessageSquare className="h-3 w-3 mr-1" />
                Natural Conversation
              </Badge>
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 hover:from-violet-600 hover:to-purple-700">
                <Video className="h-3 w-3 mr-1" />
                AI Avatar
              </Badge>
            </div>
            
            <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800 dark:text-orange-300">Requirements</AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                Camera and microphone access required for video conversation with AI avatar.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Language and Test Configuration */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-blue-800 dark:text-blue-200 font-semibold">Test Configuration</span>
            </CardTitle>
            <CardDescription className="text-blue-600 dark:text-blue-300">
              Select your target language and difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="language" className="text-blue-800 dark:text-blue-200 font-medium">Target Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="border-blue-200 dark:border-blue-700 bg-white/70 dark:bg-blue-950/70 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Choose a language to test" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-blue-800 dark:text-blue-200 font-medium">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                <SelectTrigger className="border-blue-200 dark:border-blue-700 bg-white/70 dark:bg-blue-950/70 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span>Beginner (A1-A2)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-yellow-500" />
                      <span>Intermediate (B1-B2)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-red-500" />
                      <span>Advanced (C1-C2)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 p-2 rounded-md">
                {getDifficultyDescription(difficulty)}
              </p>
            </div>

            {/* Fixed duration notice */}
            <div className="space-y-2">
              <Label className="text-blue-800 dark:text-blue-200 font-medium">Test Duration</Label>
              <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Fixed: 10 minutes
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Natural conversation with AI avatar
                </p>
              </div>
            </div>
            
            {/* CVI Configuration */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Advanced CVI Options
              </h4>
              <div className="space-y-2">
                <Label htmlFor="cviPersonaId" className="text-purple-700 dark:text-purple-300">Persona ID (Optional)</Label>
                <Input
                  id="cviPersonaId"
                  placeholder="Enter Tavus Persona ID"
                  value={cviPersonaId}
                  onChange={(e) => setCviPersonaId(e.target.value)}
                  className="border-purple-200 dark:border-purple-700 bg-white/70 dark:bg-purple-950/30 focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-xs text-purple-600 dark:text-purple-300">
                  Specify a custom Tavus persona for the conversation
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cviReplicaId" className="text-purple-700 dark:text-purple-300">Replica ID (Optional)</Label>
                <Input
                  id="cviReplicaId"
                  placeholder="Enter Tavus Replica ID"
                  value={cviReplicaId}
                  onChange={(e) => setCviReplicaId(e.target.value)}
                  className="border-purple-200 dark:border-purple-700 bg-white/70 dark:bg-purple-950/30 focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-xs text-purple-600 dark:text-purple-300">
                  Specify a custom Tavus replica for the AI avatar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tavus Configuration and Test Summary */}
        <div className="space-y-6">
          {/* Tavus API Configuration */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <span className="text-purple-800 dark:text-purple-200 font-semibold">AI Avatar Configuration</span>
              </CardTitle>
              <CardDescription className="text-purple-600 dark:text-purple-300">
                Configure Tavus.io API for AI video avatars
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="space-y-0.5">
                  <Label className="text-purple-800 dark:text-purple-200 font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Enable AI Video Avatars
                  </Label>
                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    Use Tavus.io video avatars for conversation
                  </p>
                </div>
                <Switch 
                  checked={enableTavusVideos} 
                  onCheckedChange={setEnableTavusVideos}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              {enableTavusVideos && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg border border-blue-200 dark:border-blue-700 mt-4">
                  <div className="space-y-0.5">
                    <Label className="text-blue-800 dark:text-blue-200 font-medium">Use Custom Tavus API Key</Label>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Use your own Tavus API key instead of the default
                    </p>
                  </div>
                  <Switch 
                    checked={useCustomTavusKey} 
                    onCheckedChange={setUseCustomTavusKey}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              )}

              {useCustomTavusKey && (
                <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="space-y-2">
                    <Label htmlFor="tavusKey" className="text-blue-800 dark:text-blue-200 font-medium">Tavus API Key</Label>
                    <Input
                      id="tavusKey"
                      type="password"
                      placeholder="Enter your Tavus API key"
                      value={customTavusKey}
                      onChange={(e) => setCustomTavusKey(e.target.value)}
                      className="border-blue-200 dark:border-blue-700 bg-white/70 dark:bg-blue-950/30 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="replicaId" className="text-blue-800 dark:text-blue-200 font-medium">Replica ID (Optional)</Label>
                    <Input
                      id="replicaId"
                      placeholder="Enter specific replica ID"
                      value={customReplicaId}
                      onChange={(e) => setCustomReplicaId(e.target.value)}
                      className="border-blue-200 dark:border-blue-700 bg-white/70 dark:bg-blue-950/30 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Leave empty to use the default replica
                    </p>
                  </div>
                </div>
              )}

              {!useCustomTavusKey && enableTavusVideos && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Using default Tavus configuration with system API key
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Summary */}
          <Card className="bg-gradient-to-br from-indigo-50 to-cyan-100 dark:from-indigo-950 dark:to-cyan-900 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-600">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <span className="text-indigo-800 dark:text-indigo-200 font-semibold">Test Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-700 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Language
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {selectedLangData ? `${selectedLangData.flag} ${selectedLangData.name}` : "Not selected"}
                    </p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-700 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Difficulty
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-300 capitalize">{difficulty}</p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-700 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Test Type
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">AI Conversation</p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-700 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Duration
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-300">10 minutes</p>
                  </div>
                </Card>
              </div>

              <div className="border-t border-indigo-200 dark:border-indigo-700 pt-4">
                <div className="flex items-center justify-between mb-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <span className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Token Cost
                  </span>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 hover:from-yellow-600 hover:to-amber-700">
                    <Coins className="h-3 w-3 mr-1" />
                    {LANGUAGE_TEST_TOKEN_COST.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/50 dark:to-blue-950/50 rounded-lg border border-cyan-200 dark:border-cyan-700">
                  <span className="text-sm font-medium text-cyan-800 dark:text-cyan-200">Your Balance</span>
                  <span className={`text-sm font-semibold ${hasEnoughTokens ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {userTokenBalance.toLocaleString()} tokens
                  </span>
                </div>

                {!hasEnoughTokens && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 p-4 rounded-lg mb-4 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Insufficient tokens. You need {LANGUAGE_TEST_TOKEN_COST.toLocaleString()} tokens to start this test.
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleStartTest}
                  disabled={!selectedLanguage || !hasEnoughTokens || isLoading || (useCustomTavusKey && !customTavusKey)}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-12"
                >
                  {isLoading ? (
                    <>
                      <div className="relative">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30"></div>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white absolute top-0 left-0 [animation-duration:1.5s]"></div>
                      </div>
                      <span className="ml-3">Starting Test...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Start AI Conversation Test</span>
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