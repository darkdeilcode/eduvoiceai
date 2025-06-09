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
  Headphones, 
  PenTool,
  Download,
  Share2,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react";

interface TestReportProps {
  report: LanguageTestReport;
  onRetakeTest: () => void;
  onShareReport: () => void;
  onDownloadReport: () => void;
  onBackToSelection: () => void;
}

export function TestReport({ 
  report, 
  onRetakeTest, 
  onShareReport, 
  onDownloadReport, 
  onBackToSelection 
}: TestReportProps) {
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
    speaking: <Mic className="h-4 w-4" />,
    listening: <Headphones className="h-4 w-4" />,
    reading: <BookOpen className="h-4 w-4" />,
    writing: <PenTool className="h-4 w-4" />,
    pronunciation: <Mic className="h-4 w-4" />,
    fluency: <Brain className="h-4 w-4" />,
    grammar: <BookOpen className="h-4 w-4" />,
    vocabulary: <Brain className="h-4 w-4" />,
    coherence: <TrendingUp className="h-4 w-4" />
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
                Language Test Report
              </CardTitle>
              <CardDescription>
                {report.language} • {report.difficulty} • {report.testType}
              </CardDescription>
            </div>
            <Badge variant="outline" className={`${cefrLevel.color} border-current`}>
              {cefrLevel.level} - {cefrLevel.label}
            </Badge>
          </div>
        </CardHeader>
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

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(report.overallScore)}`}>
              {report.overallScore}%
            </div>
            <p className="text-muted-foreground mt-1">Overall Score</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold">{report.completedPrompts}</div>
              <p className="text-sm text-muted-foreground">Prompts Completed</p>
            </div>
            <div>
              <div className="text-2xl font-semibold">{report.testDuration}m</div>
              <p className="text-sm text-muted-foreground">Duration</p>
            </div>
            <div>
              <div className="text-2xl font-semibold">{report.cefrLevel}</div>
              <p className="text-sm text-muted-foreground">CEFR Level</p>
            </div>
            <div>
              <div className="text-2xl font-semibold">{Math.round((report.completedPrompts / report.totalPrompts) * 100)}%</div>
              <p className="text-sm text-muted-foreground">Completion</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round((report.completedPrompts / report.totalPrompts) * 100)}%</span>
            </div>
            <Progress value={(report.completedPrompts / report.totalPrompts) * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Skills Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Skill Breakdown</CardTitle>
              <CardDescription>
                Your performance across different language skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.entries(report.skillScores).map(([skill, score]) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {skillIcons[skill as keyof typeof skillIcons]}
                        <span className="font-medium capitalize">{skill}</span>
                      </div>
                      <span className={`font-semibold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Evaluation Results</CardTitle>
              <CardDescription>
                Comprehensive feedback on your language performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.evaluations.map((evaluation, index) => (
                  <div key={evaluation.promptId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Response {index + 1}</span>
                      <Badge 
                        variant={
                          Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / Object.keys(evaluation.scores).length >= 70 
                            ? "default" 
                            : Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / Object.keys(evaluation.scores).length >= 50 
                            ? "secondary" 
                            : "destructive"
                        }
                      >
                        {Math.round(Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / Object.keys(evaluation.scores).length)}%
                      </Badge>
                    </div>
                    
                    {evaluation.prompt && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Prompt:</p>
                        <p className="text-sm">{evaluation.prompt}</p>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground mb-3">
                      {evaluation.feedback}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                      {Object.entries(evaluation.scores).map(([skill, score]) => (
                        <div key={skill} className="text-center p-2 bg-muted rounded">
                          <div className="text-sm font-semibold">{score}%</div>
                          <div className="text-xs text-muted-foreground capitalize">{skill}</div>
                        </div>
                      ))}
                    </div>

                    {evaluation.suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-orange-600 mb-1">Suggestions for Improvement:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {evaluation.suggestions.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>
                Suggestions to improve your language skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Overall Feedback
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {report.generalFeedback}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Recommended Study Areas:</h4>
                <div className="grid gap-3">
                  {report.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Next Steps
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Based on your {report.cefrLevel} level, consider focusing on 
                      {report.overallScore < 70 ? " fundamental grammar and vocabulary building" : 
                       report.overallScore < 85 ? " advanced conversation practice and cultural nuances" :
                       " specialized terminology and professional language use"}.
                    </p>
                  </div>
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
