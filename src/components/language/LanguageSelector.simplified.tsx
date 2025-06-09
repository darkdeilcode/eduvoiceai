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
import { Languages, MessageSquare, Video, Coins, AlertCircle } from "lucide-react";

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
      {/* AI Conversation Mode Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            AI Conversational Language Test
          </CardTitle>
          <CardDescription>
            Natural conversation with Tavus AI avatar in your target language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Experience a natural conversation with an AI avatar powered by Tavus CVI technology. 
              This 10-minute interactive session provides real-time feedback and evaluates your 
              speaking skills in a conversational context.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Tavus CVI</Badge>
              <Badge variant="outline">10 Minutes</Badge>
              <Badge variant="outline">Natural Conversation</Badge>
              <Badge variant="outline">AI Avatar</Badge>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Requirements</AlertTitle>
              <AlertDescription>
                Camera and microphone access required for video conversation with AI avatar.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Language and Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Select your target language and difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="language">Target Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
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
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                  <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {getDifficultyDescription(difficulty)}
              </p>
            </div>

            {/* Fixed duration notice */}
            <div className="space-y-2">
              <Label>Test Duration</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Fixed: 10 minutes</p>
                <p className="text-xs text-muted-foreground">
                  Natural conversation with AI avatar
                </p>
              </div>
            </div>
            
            {/* CVI Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cviPersonaId">Persona ID (Optional)</Label>
                <Input
                  id="cviPersonaId"
                  placeholder="Enter Tavus Persona ID"
                  value={cviPersonaId}
                  onChange={(e) => setCviPersonaId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Specify a custom Tavus persona for the conversation
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cviReplicaId">Replica ID (Optional)</Label>
                <Input
                  id="cviReplicaId"
                  placeholder="Enter Tavus Replica ID"
                  value={cviReplicaId}
                  onChange={(e) => setCviReplicaId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Specify a custom Tavus replica for the AI avatar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tavus Configuration and Test Summary */}
        <div className="space-y-6">
          {/* Tavus API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                AI Avatar Configuration
              </CardTitle>
              <CardDescription>
                Configure Tavus.io API for AI video avatars
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable AI Video Avatars</Label>
                  <p className="text-sm text-muted-foreground">
                    Use Tavus.io video avatars for conversation
                  </p>
                </div>
                <Switch 
                  checked={enableTavusVideos} 
                  onCheckedChange={setEnableTavusVideos}
                />
              </div>

              {enableTavusVideos && (
                <div className="flex items-center justify-between mt-4">
                  <div className="space-y-0.5">
                    <Label>Use Custom Tavus API Key</Label>
                    <p className="text-sm text-muted-foreground">
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tavusKey">Tavus API Key</Label>
                    <Input
                      id="tavusKey"
                      type="password"
                      placeholder="Enter your Tavus API key"
                      value={customTavusKey}
                      onChange={(e) => setCustomTavusKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="replicaId">Replica ID (Optional)</Label>
                    <Input
                      id="replicaId"
                      placeholder="Enter specific replica ID"
                      value={customReplicaId}
                      onChange={(e) => setCustomReplicaId(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Leave empty to use the default replica
                    </p>
                  </div>
                </div>
              )}

              {!useCustomTavusKey && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Using default Tavus configuration with system API key
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Test Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Language</p>
                  <p className="text-muted-foreground">
                    {selectedLangData ? `${selectedLangData.flag} ${selectedLangData.name}` : "Not selected"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Difficulty</p>
                  <p className="text-muted-foreground capitalize">{difficulty}</p>
                </div>
                <div>
                  <p className="font-medium">Test Type</p>
                  <p className="text-muted-foreground">AI Conversation</p>
                </div>
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-muted-foreground">10 minutes</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Token Cost</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    {LANGUAGE_TEST_TOKEN_COST.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Your Balance</span>
                  <span className={`text-sm ${hasEnoughTokens ? 'text-green-600' : 'text-red-600'}`}>
                    {userTokenBalance.toLocaleString()} tokens
                  </span>
                </div>

                {!hasEnoughTokens && (
                  <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg mb-4">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Insufficient tokens. You need {LANGUAGE_TEST_TOKEN_COST.toLocaleString()} tokens to start this test.
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleStartTest}
                  disabled={!selectedLanguage || !hasEnoughTokens || isLoading || (useCustomTavusKey && !customTavusKey)}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting Test...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start AI Conversation Test
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
