"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LanguageTestReport } from "@/types/languageTest";
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Clock, 
  Brain, 
  BookOpen, 
  Mic, 
  Volume2, 
  MessageSquare,
  Download,
  Share2,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Target,
  Lightbulb
} from "lucide-react";

interface SpeakingTestReportProps {
  report: LanguageTestReport;
  onRetakeTest: () => void;
  onShareReport: () => void;
  onDownloadReport: () => void;
  onBackToSelection: () => void;
}

export function SpeakingTestReport({ 
  report, 
  onRetakeTest, 
  onShareReport, 
  onDownloadReport, 
  onBackToSelection 
}: SpeakingTestReportProps) {
  const [selectedTab, setSelectedTab] = useState("overview");

  const getCEFRLevel = (score: number) => {
    if (score >= 90) return { level: "C2", label: "Mastery", color: "text-purple-600" };
    if (score >= 80) return { level: "C1", label: "Proficiency", color: "text-blue-600" };
    if (score >= 70) return { level: "B2", label: "Upper Intermediate", color: "text-green-600" };
    if (score >= 60) return { level: "B1", label: "Intermediate", color: "text-yellow-600" };
    if (score >= 50) return { level: "A2", label: "Elementary", color: "text-orange-600" };
    return { level: "A1", label: "Beginner", color: "text-red-600" };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeIcon = (score: number) => {
    if (score >= 90) return <Trophy className="h-5 w-5 text-purple-600" />;
    if (score >= 80) return <Star className="h-5 w-5 text-blue-600" />;
    if (score >= 70) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <CheckCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-orange-600" />;
  };

  const skillIcons = {
    pronunciation: <Mic className="h-4 w-4" />,
    fluency: <Volume2 className="h-4 w-4" />,
    grammar: <BookOpen className="h-4 w-4" />,
    vocabulary: <Brain className="h-4 w-4" />,
    coherence: <MessageSquare className="h-4 w-4" />
  };

  const skillDescriptions = {
    pronunciation: "Clarity and accuracy of speech sounds",
    fluency: "Smoothness and pace of speech delivery",
    grammar: "Correct use of language structures",
    vocabulary: "Range and appropriateness of word choice",
    coherence: "Logical flow and organization of ideas"
  };

  const cefrLevel = getCEFRLevel(report.overallScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getGradeIcon(report.overallScore)}
                Speaking Test Report
              </CardTitle>
              <CardDescription>
                {report.language} • {report.difficulty} • AI Video Conversation Test
              </CardDescription>
            </div>
            <Badge variant="outline" className={`${cefrLevel.color} border-current`}>
              {cefrLevel.level} - {cefrLevel.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {report.completedPrompts}/{report.totalPrompts}
              </div>
              <p className="text-sm text-muted-foreground">Prompts Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 flex items-center justify-center gap-1">
                <Clock className="h-6 w-6" />
                {report.testDuration}m
              </div>
              <p className="text-sm text-muted-foreground">Test Duration</p>
            </div>
          </div>
          
          {/* Conversation ID Display */}
          {report.conversationId && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Conversation ID:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded border">
                    {report.conversationId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => navigator.clipboard.writeText(report.conversationId || '')}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use this ID to reference your AI video conversation session
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pass/Fail Status */}
      <Card className={`border-2 ${report.isPassed ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            <div className={`p-3 rounded-full ${report.isPassed ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
              {report.isPassed ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              )}
            </div>
            <div className="text-center">
              <h2 className={`text-2xl font-bold ${report.isPassed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {report.isPassed ? 'PASSED' : 'NOT PASSED'}
              </h2>
              <p className={`text-sm ${report.isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                Required: {report.passThreshold}% | Your Score: {report.overallScore}%
              </p>
            </div>
          </div>
          <div className={`mt-4 p-4 rounded-lg ${report.isPassed ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            <p className={`text-center ${report.isPassed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {report.resultMessage}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Speaking Skills</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Speaking Skill Breakdown</CardTitle>
              <CardDescription>
                Your performance across core speaking competencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {Object.entries(report.skillScores).map(([skill, score]) => {
                  if (skill === 'overall') return null;
                  return (
                    <div key={skill} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {skillIcons[skill as keyof typeof skillIcons]}
                          <div>
                            <span className="font-medium capitalize">{skill}</span>
                            <p className="text-xs text-muted-foreground">
                              {skillDescriptions[skill as keyof typeof skillDescriptions]}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold text-lg ${getScoreColor(score)}`}>
                          {score}%
                        </span>
                      </div>
                      <Progress value={score} className="h-3" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Analysis</CardTitle>
              <CardDescription>
                Detailed feedback for each speaking prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {report.evaluations.map((evaluation, index) => (
                  <div key={evaluation.promptId} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-lg">Prompt {index + 1}</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {evaluation.prompt}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {Math.round(Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / Object.values(evaluation.scores).length)}%
                      </Badge>
                    </div>
                    
                    {evaluation.userResponse && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Your Response:</p>
                        <p className="text-sm italic">"{evaluation.userResponse}"</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(evaluation.scores).map(([skill, score]) => (
                        <div key={skill} className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                            {score}%
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{skill}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                              Feedback
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              {evaluation.feedback}
                            </p>
                          </div>
                        </div>
                      </div>

                      {evaluation.suggestions.length > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Target className="h-4 w-4 text-orange-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-orange-900 dark:text-orange-100 text-sm mb-2">
                                Improvement Suggestions
                              </p>
                              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                                {evaluation.suggestions.map((suggestion, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-orange-500">•</span>
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Learning Path</CardTitle>
              <CardDescription>
                AI-powered recommendations to enhance your speaking skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Overall Assessment
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      {report.generalFeedback}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Recommended Learning Activities
                </h4>
                <div className="grid gap-4">
                  {report.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-green-700 dark:text-green-300">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      Next Level Goals
                    </p>
                    <p className="text-purple-700 dark:text-purple-300">
                      Based on your {cefrLevel.level} level performance, focus on 
                      {report.overallScore < 70 ? 
                        " building foundational speaking confidence through regular conversation practice and basic grammar reinforcement." : 
                        report.overallScore < 85 ? 
                        " advancing to more complex discussions, idiomatic expressions, and cultural nuances in speech." :
                        " mastering specialized vocabulary, professional communication skills, and near-native fluency patterns."
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">Estimated Study Time</h5>
                  <p className="text-sm text-muted-foreground">
                    {report.overallScore < 60 ? "2-3 hours daily" : 
                     report.overallScore < 80 ? "1-2 hours daily" : "30-60 minutes daily"}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">Next Test Recommendation</h5>
                  <p className="text-sm text-muted-foreground">
                    {report.overallScore < 50 ? "2-4 weeks" : 
                     report.overallScore < 80 ? "2-3 weeks" : "1-2 weeks"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBackToSelection}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Test
          </Button>
          <Button variant="outline" onClick={onRetakeTest}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Test
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onShareReport}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={onDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}