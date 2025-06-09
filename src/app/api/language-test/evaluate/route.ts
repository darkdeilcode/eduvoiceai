import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  databases, 
  clientInitialized, 
  initializationError,
  APPWRITE_DATABASE_ID, 
  LANGUAGE_TESTS_COLLECTION_ID
} from '@/lib/appwrite.node';
import type { LanguageTestReport, SpeakingEvaluation, ConversationTurn } from '@/types/languageTest';

export async function POST(request: NextRequest) {
  try {
    // Check if Appwrite client is initialized
    if (!clientInitialized) {
      console.error("API /language-test/evaluate: Appwrite client not initialized:", initializationError);
      return NextResponse.json(
        { error: 'Server configuration error', details: initializationError },
        { status: 500 }
      );
    }

    // Get session cookie
    const cookieStore = cookies();
    const sessionCookie = (await cookieStore).get('appwrite-session');
    
    if (!sessionCookie) {
      console.error("API /language-test/evaluate: No session cookie found");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const { sessionId, conversationTurns, testConfig } = await request.json();

    console.log('🔍 Evaluation API received:', {
      sessionId,
      conversationTurnsLength: conversationTurns?.length || 0,
      testConfig,
      conversationTurns
    });

    if (!conversationTurns || !Array.isArray(conversationTurns)) {
      console.error('❌ Missing or invalid conversationTurns:', conversationTurns);
      return NextResponse.json(
        { error: 'Conversation turns are required and must be an array' },
        { status: 400 }
      );
    }

    if (conversationTurns.length === 0) {
      console.error('❌ Empty conversationTurns array');
      return NextResponse.json(
        { error: 'At least one conversation turn is required' },
        { status: 400 }
      );
    }

    // Use test configuration from request or defaults
    let testSession;
    if (sessionId) {
      try {
        // Try to get existing test session if sessionId is provided
        testSession = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          LANGUAGE_TESTS_COLLECTION_ID,
          sessionId
        );
      } catch (error) {
        console.warn('Could not fetch test session, using provided config:', error);
        testSession = null;
      }
    }

    // Use test session data or fall back to provided config
    const language = testSession?.language || testConfig?.language || 'English';
    const languageCode = testSession?.languageCode || testConfig?.languageCode || 'en';
    const difficulty = testSession?.difficulty || testConfig?.difficulty || 'intermediate';
    const userId = testSession?.userId || 'anonymous';

    console.log('📝 Using test parameters:', {
      language,
      languageCode,
      difficulty,
      userId,
      source: testSession ? 'database' : 'config'
    });

    // Evaluate speaking responses
    const evaluations = await evaluateSpeakingResponses(
      conversationTurns,
      language,
      difficulty
    );

    // Calculate overall scores
    const overallScore = calculateOverallScore(evaluations);
    const cefrLevel = determineCEFRLevel(overallScore, difficulty);
    const skillScores = calculateSkillScores(evaluations);
    const passFailResult = determinePassFail(overallScore, cefrLevel, difficulty);

    // Extract conversation ID from test session
    let conversationId = null;
    if (testSession) {
      // Try multiple sources for conversation ID
      conversationId = testSession.cvi_conversation_id || testSession.conversation_id;
      
      // If not found directly, try to extract from cviResponse JSON
      if (!conversationId && testSession.cviResponse) {
        try {
          const cviResponse = typeof testSession.cviResponse === 'string' 
            ? JSON.parse(testSession.cviResponse) 
            : testSession.cviResponse;
          conversationId = cviResponse.conversation_id;
        } catch (error) {
          console.warn('Could not parse cviResponse for conversation ID:', error);
        }
      }
    }

    console.log('🔍 Extracted conversation ID:', conversationId);

    // Generate report
    const reportId = sessionId ? `report_${sessionId}` : `report_${Date.now()}`;
    const report: LanguageTestReport = {
      id: reportId,
      userId: userId,
      language: language,
      languageCode: languageCode,
      difficulty: difficulty,
      testType: 'speaking',
      totalPrompts: evaluations.length,
      completedPrompts: evaluations.length,
      overallScore,
      cefrLevel,
      isPassed: passFailResult.isPassed,
      passThreshold: passFailResult.passThreshold,
      resultMessage: passFailResult.message,
      conversationId: conversationId, // Include Tavus conversation ID
      skillScores,
      evaluations,
      generalFeedback: generateGeneralFeedback(evaluations, cefrLevel),
      recommendations: generateRecommendations(evaluations, cefrLevel),
      testDuration: testSession?.startTime ? Math.round((Date.now() - testSession.startTime) / 60000) : 0, // in minutes
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update test session as completed if sessionId exists
    if (sessionId && testSession) {
      try {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          LANGUAGE_TESTS_COLLECTION_ID,
          sessionId,
          {
            status: 'completed',
            endTime: Date.now(),
            conversationTurns: JSON.stringify(conversationTurns),
            report: JSON.stringify(report),
            conversation_id: report.conversationId || null, // Add direct conversation_id field for easier querying
            overall_score: report.overallScore,
            cefr_level: report.cefrLevel,
            is_passed: report.isPassed,
            test_duration: report.testDuration
          }
        );
        console.log('✅ Updated test session in database');
      } catch (error) {
        console.warn('⚠️ Could not update test session:', error);
      }
    } else {
      console.log('📝 No sessionId provided, skipping database update');
    }

    return NextResponse.json({ report });

  } catch (error) {
    console.error('Error evaluating language test:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate language test' },
      { status: 500 }
    );
  }
}

// Helper function to evaluate speaking responses
async function evaluateSpeakingResponses(
  conversationTurns: ConversationTurn[],
  language: string,
  difficulty: string
): Promise<SpeakingEvaluation[]> {
  const evaluations: SpeakingEvaluation[] = [];

  for (const turn of conversationTurns) {
    if (turn.speaker === 'user' && (turn.transcript || turn.message)) {
      const userText = turn.transcript || turn.message;
      const evaluation: SpeakingEvaluation = {
        promptId: turn.id,
        prompt: 'Conversation response',
        userResponse: userText,
        scores: {
          pronunciation: calculatePronunciationScore(userText),
          fluency: calculateFluencyScore(userText),
          grammar: calculateGrammarScore(userText),
          vocabulary: calculateVocabularyScore(userText),
          coherence: calculateCoherenceScore(userText)
        },
        feedback: generateSpeakingFeedback(userText),
        suggestions: generateSpeakingSuggestions(userText)
      };
      evaluations.push(evaluation);
    }
  }

  return evaluations;
}

// Helper function to calculate pronunciation score
function calculatePronunciationScore(transcript: string): number {
  // Simplified scoring - in real implementation would use speech analysis
  const length = transcript.length;
  const complexity = (transcript.match(/[aeiou]/gi)?.length || 0) / length;
  return Math.min(95, Math.max(60, 70 + (complexity * 25) + Math.random() * 10));
}

// Helper function to calculate fluency score
function calculateFluencyScore(transcript: string): number {
  // Simplified scoring based on response length and structure
  const wordCount = transcript.split(' ').length;
  const sentenceCount = transcript.split(/[.!?]+/).length;
  const avgWordsPerSentence = wordCount / sentenceCount;
  
  let score = 60;
  if (wordCount > 20) score += 10;
  if (wordCount > 50) score += 10;
  if (avgWordsPerSentence > 5) score += 10;
  if (avgWordsPerSentence > 10) score += 5;
  
  return Math.min(95, score + Math.random() * 10);
}

// Helper function to calculate grammar score
function calculateGrammarScore(transcript: string): number {
  // Simplified scoring - checks for basic grammar patterns
  const hasCapitalization = /[A-Z]/.test(transcript);
  const hasPunctuation = /[.!?]/.test(transcript);
  const hasProperStructure = transcript.split(' ').length > 3;
  
  let score = 60;
  if (hasCapitalization) score += 10;
  if (hasPunctuation) score += 10;
  if (hasProperStructure) score += 15;
  
  return Math.min(95, score + Math.random() * 10);
}

// Helper function to calculate vocabulary score
function calculateVocabularyScore(transcript: string): number {
  // Simplified scoring based on vocabulary diversity
  const words = transcript.toLowerCase().split(' ');
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / words.length;
  
  return Math.min(95, Math.max(60, 60 + (diversity * 35) + Math.random() * 10));
}

// Helper function to calculate coherence score
function calculateCoherenceScore(transcript: string): number {
  // Simplified scoring based on response structure
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const hasTransitions = /\b(and|but|however|therefore|because|since|although)\b/i.test(transcript);
  
  let score = 65;
  if (sentences.length > 1) score += 10;
  if (sentences.length > 3) score += 10;
  if (hasTransitions) score += 10;
  
  return Math.min(95, score + Math.random() * 10);
}

// Helper function to calculate overall score
function calculateOverallScore(evaluations: SpeakingEvaluation[]): number {
  if (evaluations.length === 0) return 0;
  
  const totalScore = evaluations.reduce((sum, evaluation) => {
    const avgScore = (
      evaluation.scores.pronunciation +
      evaluation.scores.fluency +
      evaluation.scores.grammar +
      evaluation.scores.vocabulary +
      evaluation.scores.coherence
    ) / 5;
    return sum + avgScore;
  }, 0);
  
  return Math.round(totalScore / evaluations.length);
}

// Helper function to determine CEFR level
function determineCEFRLevel(score: number, difficulty: string): string {
  // Adjust CEFR levels based on difficulty and score
  if (difficulty === 'beginner') {
    return score >= 85 ? 'A2' : score >= 70 ? 'A1+' : 'A1';
  } else if (difficulty === 'intermediate') {
    return score >= 90 ? 'B2' : score >= 75 ? 'B1' : score >= 60 ? 'A2+' : 'A2';
  } else { // advanced
    return score >= 95 ? 'C2' : score >= 85 ? 'C1' : score >= 75 ? 'B2+' : 'B2';
  }
}

// Helper function to determine pass/fail status
function determinePassFail(score: number, cefrLevel: string, difficulty: string): { 
  isPassed: boolean; 
  passThreshold: number; 
  message: string;
} {
  // Define pass thresholds based on difficulty level
  let passThreshold: number;
  let requiredLevel: string;
  
  switch (difficulty) {
    case 'beginner':
      passThreshold = 60;
      requiredLevel = 'A1';
      break;
    case 'intermediate':
      passThreshold = 70;
      requiredLevel = 'B1';
      break;
    case 'advanced':
      passThreshold = 80;
      requiredLevel = 'B2';
      break;
    default:
      passThreshold = 60;
      requiredLevel = 'A1';
  }
  
  const isPassed = score >= passThreshold;
  
  let message: string;
  if (isPassed) {
    message = `Congratulations! You have successfully passed the ${difficulty} level test with a score of ${score}% and achieved ${cefrLevel} level proficiency.`;
  } else {
    const pointsNeeded = passThreshold - score;
    message = `You scored ${score}% but need ${passThreshold}% to pass the ${difficulty} level. You need ${pointsNeeded} more points to achieve the required ${requiredLevel} level.`;
  }
  
  return {
    isPassed,
    passThreshold,
    message
  };
}

// Helper function to calculate skill scores
function calculateSkillScores(evaluations: SpeakingEvaluation[]) {
  if (evaluations.length === 0) {
    return {
      pronunciation: 0,
      fluency: 0,
      grammar: 0,
      vocabulary: 0,
      coherence: 0,
      overall: 0
    };
  }

  const avgScores = evaluations.reduce((acc, evaluation) => {
    acc.pronunciation += evaluation.scores.pronunciation;
    acc.fluency += evaluation.scores.fluency;
    acc.grammar += evaluation.scores.grammar;
    acc.vocabulary += evaluation.scores.vocabulary;
    acc.coherence += evaluation.scores.coherence;
    return acc;
  }, {
    pronunciation: 0,
    fluency: 0,
    grammar: 0,
    vocabulary: 0,
    coherence: 0
  });

  const count = evaluations.length;
  return {
    pronunciation: Math.round(avgScores.pronunciation / count),
    fluency: Math.round(avgScores.fluency / count),
    grammar: Math.round(avgScores.grammar / count),
    vocabulary: Math.round(avgScores.vocabulary / count),
    coherence: Math.round(avgScores.coherence / count),
    overall: Math.round((avgScores.pronunciation + avgScores.fluency + avgScores.grammar + avgScores.vocabulary + avgScores.coherence) / (count * 5))
  };
}

// Helper function to generate general feedback
function generateGeneralFeedback(evaluations: SpeakingEvaluation[], cefrLevel: string): string {
  const avgScore = calculateOverallScore(evaluations);
  
  if (avgScore >= 90) {
    return `Excellent speaking performance! You've demonstrated ${cefrLevel} level proficiency with clear pronunciation, natural fluency, and sophisticated vocabulary usage.`;
  } else if (avgScore >= 80) {
    return `Very good speaking skills! You've reached ${cefrLevel} level with effective communication and good command of the language structure.`;
  } else if (avgScore >= 70) {
    return `Good speaking ability! You've achieved ${cefrLevel} level and can communicate effectively in most situations with some areas for improvement.`;
  } else if (avgScore >= 60) {
    return `Satisfactory speaking skills at ${cefrLevel} level. You can communicate basic ideas but would benefit from more practice with pronunciation and fluency.`;
  } else {
    return `Basic speaking skills at ${cefrLevel} level. Continue practicing fundamental pronunciation patterns and building confidence in spoken communication.`;
  }
}

// Helper function to generate recommendations
function generateRecommendations(evaluations: SpeakingEvaluation[], cefrLevel: string): string[] {
  const skillScores = calculateSkillScores(evaluations);
  const recommendations: string[] = [];
  
  if (skillScores.pronunciation < 75) {
    recommendations.push("Practice pronunciation with native speaker recordings and phonetic exercises");
  }
  
  if (skillScores.fluency < 75) {
    recommendations.push("Improve fluency through regular conversation practice and speaking exercises");
  }
  
  if (skillScores.grammar < 75) {
    recommendations.push("Focus on grammar accuracy through targeted exercises and sentence construction practice");
  }
  
  if (skillScores.vocabulary < 75) {
    recommendations.push("Expand vocabulary through reading, listening, and active word learning strategies");
  }
  
  if (skillScores.coherence < 75) {
    recommendations.push("Work on organizing ideas clearly and using connecting words to improve coherence");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Continue practicing with challenging materials to maintain your excellent speaking level");
    recommendations.push("Consider advanced conversation practice with native speakers for further improvement");
  }
  
  return recommendations;
}

// Helper function to generate speaking feedback
function generateSpeakingFeedback(transcript: string): string {
  const wordCount = transcript.split(' ').length;
  
  if (wordCount < 10) {
    return "Try to provide more detailed responses to fully demonstrate your speaking ability.";
  } else if (wordCount < 30) {
    return "Good response length. Focus on adding more specific details and examples.";
  } else {
    return "Excellent response detail. Your explanations show good command of the language.";
  }
}

// Helper function to generate speaking suggestions
function generateSpeakingSuggestions(transcript: string): string[] {
  const suggestions: string[] = [];
  
  if (!/[.!?]$/.test(transcript.trim())) {
    suggestions.push("Remember to complete your sentences with proper punctuation");
  }
  
  if (transcript.split(' ').length < 20) {
    suggestions.push("Try to elaborate more on your ideas with examples and details");
  }
  
  if (!/\b(because|since|although|however|therefore)\b/i.test(transcript)) {
    suggestions.push("Use connecting words to link your ideas more clearly");
  }
  
  return suggestions;
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}