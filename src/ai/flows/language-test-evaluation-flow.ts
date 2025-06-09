/**
 * Language Test Evaluation Flow
 * Evaluates user responses for language tests and provides detailed feedback
 */

import { z } from 'zod';
import { genkit } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';

// Input schema for language test evaluation
const UserResponseSchema = z.object({
  questionId: z.string().describe("ID of the question being answered"),
  questionType: z.enum(['speaking', 'listening', 'reading', 'writing']).describe("Type of question"),
  prompt: z.string().describe("The original question prompt"),
  expectedResponse: z.string().optional().describe("Expected or sample correct response"),
  userResponse: z.string().describe("User's actual response"),
  responseTime: z.number().describe("Time taken to respond in seconds"),
  skillsAssessed: z.array(z.string()).describe("Skills this question was meant to assess"),
  maxPoints: z.number().describe("Maximum points for this question"),
});

const LanguageTestEvaluationInputSchema = z.object({
  language: z.string().describe("The target language being tested"),
  languageCode: z.string().describe("The ISO language code"),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe("Test difficulty level"),
  testType: z.enum(['conversation', 'pronunciation', 'comprehension', 'mixed']).describe("Type of test"),
  responses: z.array(UserResponseSchema).describe("Array of user responses to evaluate"),
  geminiApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
});

export type LanguageTestEvaluationInput = z.infer<typeof LanguageTestEvaluationInputSchema>;

// Output schema for evaluation results
const QuestionEvaluationSchema = z.object({
  questionId: z.string().describe("ID of the evaluated question"),
  score: z.number().min(0).max(100).describe("Score for this question (0-100)"),
  pointsEarned: z.number().describe("Points earned out of maximum possible"),
  maxPoints: z.number().describe("Maximum points for this question"),
  feedback: z.string().describe("Detailed feedback on the response"),
  strengths: z.array(z.string()).describe("What the user did well"),
  improvements: z.array(z.string()).describe("Areas for improvement"),
  skillScores: z.object({
    grammar: z.number().min(0).max(100),
    vocabulary: z.number().min(0).max(100),
    pronunciation: z.number().min(0).max(100),
    fluency: z.number().min(0).max(100),
    comprehension: z.number().min(0).max(100),
    accuracy: z.number().min(0).max(100),
  }).describe("Breakdown of scores by language skill"),
  examples: z.array(z.string()).optional().describe("Example corrections or improvements"),
});

const LanguageTestEvaluationOutputSchema = z.object({
  overallScore: z.number().min(0).max(100).describe("Overall test score (0-100)"),
  totalPointsEarned: z.number().describe("Total points earned"),
  totalPointsPossible: z.number().describe("Total points possible"),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).describe("CEFR level assessment"),
  skillBreakdown: z.object({
    speaking: z.number().min(0).max(100),
    listening: z.number().min(0).max(100),
    reading: z.number().min(0).max(100),
    writing: z.number().min(0).max(100),
    pronunciation: z.number().min(0).max(100),
    fluency: z.number().min(0).max(100),
    grammar: z.number().min(0).max(100),
    vocabulary: z.number().min(0).max(100),
  }).describe("Detailed skill breakdown"),
  questionEvaluations: z.array(QuestionEvaluationSchema).describe("Individual question evaluations"),
  overallFeedback: z.string().describe("General feedback on performance"),
  strengths: z.array(z.string()).describe("Overall strengths demonstrated"),
  areasForImprovement: z.array(z.string()).describe("Key areas needing improvement"),
  recommendations: z.array(z.string()).describe("Specific study recommendations"),
  nextSteps: z.array(z.string()).describe("Suggested next steps for language learning"),
});

export type LanguageTestEvaluationOutput = z.infer<typeof LanguageTestEvaluationOutputSchema>;

const LANGUAGE_TEST_EVALUATION_PROMPT = `You are an expert language assessment specialist. Evaluate the user's language test responses and provide comprehensive feedback.

**Test Details:**
- Language: {{language}} ({{languageCode}})
- Difficulty: {{difficulty}}
- Test Type: {{testType}}

**User Responses to Evaluate:**
{{#each responses}}
---
**Question {{@index}}** (ID: {{questionId}})
Type: {{questionType}}
Skills Assessed: {{#each skillsAssessed}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
Max Points: {{maxPoints}}
Response Time: {{responseTime}} seconds

**Prompt:** {{prompt}}
{{#if expectedResponse}}**Expected Response:** {{expectedResponse}}{{/if}}
**User's Response:** {{userResponse}}

{{/each}}

**Evaluation Criteria:**

1. **Accuracy**: How correct is the response in terms of grammar, vocabulary, and content?
2. **Fluency**: How natural and smooth is the language use?
3. **Comprehension**: How well did the user understand the question/task?
4. **Appropriateness**: How suitable is the response for the context and level?
5. **Pronunciation** (for speaking tasks): Based on written response patterns and complexity
6. **Vocabulary Range**: Variety and appropriateness of vocabulary used
7. **Grammar Complexity**: Correct use of grammatical structures appropriate for the level

**CEFR Level Guidelines:**
- **A1 (Beginner)**: Basic phrases, simple grammar, everyday vocabulary
- **A2 (Elementary)**: Simple conversations, present/past tense, familiar topics
- **B1 (Intermediate)**: Clear main points, some complex grammar, wider vocabulary
- **B2 (Upper-Intermediate)**: Complex ideas, varied grammar, good vocabulary range
- **C1 (Advanced)**: Fluent expression, complex grammar, rich vocabulary
- **C2 (Proficient)**: Native-like fluency, sophisticated language use

**Scoring Guidelines:**
- 90-100: Excellent performance, near-native level for the difficulty
- 80-89: Very good performance, strong command of the language
- 70-79: Good performance, some areas for improvement
- 60-69: Satisfactory performance, noticeable gaps
- 50-59: Basic performance, significant improvement needed
- Below 50: Insufficient performance for the level

For each response, provide:
1. Detailed evaluation with specific examples
2. Constructive feedback highlighting both strengths and areas for improvement
3. Skill-specific scores (grammar, vocabulary, pronunciation, fluency, comprehension, accuracy)
4. Specific recommendations for improvement

Provide an overall assessment including:
- CEFR level determination
- Comprehensive skill breakdown
- Actionable recommendations for continued learning
- Specific next steps for improvement`;

async function evaluateLanguageTestLogic(input: LanguageTestEvaluationInput): Promise<LanguageTestEvaluationOutput> {
  // Try user's custom API key first if provided
  if (input.geminiApiKey) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const tempAi = genkit({
        plugins: [googleAI()],
        model: 'googleai/gemini-1.5-flash',
      });

      const tempGenerate = tempAi.generate({
        apiKey: input.geminiApiKey,
      });

      const promptData = {
        language: input.language,
        languageCode: input.languageCode,
        difficulty: input.difficulty,
        testType: input.testType,
        responses: input.responses,
      };

      let prompt = LANGUAGE_TEST_EVALUATION_PROMPT
        .replace(/\{\{language\}\}/g, promptData.language)
        .replace(/\{\{languageCode\}\}/g, promptData.languageCode)
        .replace(/\{\{difficulty\}\}/g, promptData.difficulty)
        .replace(/\{\{testType\}\}/g, promptData.testType);

      // Handle responses loop
      let responsesText = '';
      promptData.responses.forEach((response, index) => {
        responsesText += `---\n**Question ${index + 1}** (ID: ${response.questionId})\n`;
        responsesText += `Type: ${response.questionType}\n`;
        responsesText += `Skills Assessed: ${response.skillsAssessed.join(', ')}\n`;
        responsesText += `Max Points: ${response.maxPoints}\n`;
        responsesText += `Response Time: ${response.responseTime} seconds\n\n`;
        responsesText += `**Prompt:** ${response.prompt}\n`;
        if (response.expectedResponse) {
          responsesText += `**Expected Response:** ${response.expectedResponse}\n`;
        }
        responsesText += `**User's Response:** ${response.userResponse}\n\n`;
      });
      prompt = prompt.replace(/\{\{#each responses\}\}[\s\S]*?\{\{\/each\}\}/g, responsesText);

      const result = await tempGenerate({
        model: 'googleai/gemini-1.5-flash',
        prompt: prompt,
        output: { schema: LanguageTestEvaluationOutputSchema },
      });

      if (!result.output) {
        throw new Error('Model returned no output');
      }

      return result.output;
    } catch (e: any) {
      const isKeyError = 
        e.message?.includes('API key') ||
        e.message?.includes('invalid') ||
        e.message?.includes('credential') ||
        (e.cause && typeof e.cause === 'object' && 'code' in e.cause && e.cause.code === 7) ||
        (e.response && e.response.data && e.response.data.error && /api key/i.test(e.response.data.error.message));

      if (!isKeyError) throw e;
      console.log(`User's Gemini API key failed. Falling back to platform default.`);
    }
  }

  console.log("Falling back to platform's default API key for language test evaluation.");
  try {
    const ai = genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-1.5-flash',
    });

    let prompt = LANGUAGE_TEST_EVALUATION_PROMPT
      .replace(/\{\{language\}\}/g, input.language)
      .replace(/\{\{languageCode\}\}/g, input.languageCode)
      .replace(/\{\{difficulty\}\}/g, input.difficulty)
      .replace(/\{\{testType\}\}/g, input.testType);

    // Handle responses loop
    let responsesText = '';
    input.responses.forEach((response, index) => {
      responsesText += `---\n**Question ${index + 1}** (ID: ${response.questionId})\n`;
      responsesText += `Type: ${response.questionType}\n`;
      responsesText += `Skills Assessed: ${response.skillsAssessed.join(', ')}\n`;
      responsesText += `Max Points: ${response.maxPoints}\n`;
      responsesText += `Response Time: ${response.responseTime} seconds\n\n`;
      responsesText += `**Prompt:** ${response.prompt}\n`;
      if (response.expectedResponse) {
        responsesText += `**Expected Response:** ${response.expectedResponse}\n`;
      }
      responsesText += `**User's Response:** ${response.userResponse}\n\n`;
    });
    prompt = prompt.replace(/\{\{#each responses\}\}[\s\S]*?\{\{\/each\}\}/g, responsesText);

    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      output: { schema: LanguageTestEvaluationOutputSchema },
    });

    if (!result.output) {
      throw new Error("AI model did not return the expected output for language test evaluation.");
    }

    return result.output;
  } catch (fallbackError: any) {
    console.error("Error during platform fallback:", fallbackError);
    throw new Error(`Platform fallback for language test evaluation failed: ${fallbackError.message || 'Unknown error during fallback'}`);
  }
}

/**
 * Public function to evaluate language test responses
 */
export async function evaluateLanguageTest(input: LanguageTestEvaluationInput): Promise<LanguageTestEvaluationOutput> {
  console.log("Evaluating language test with input:", {
    language: input.language,
    difficulty: input.difficulty,
    testType: input.testType,
    responseCount: input.responses.length,
    hasCustomKey: !!input.geminiApiKey,
  });

  try {
    const result = await evaluateLanguageTestLogic(input);
    console.log("Language test evaluation completed successfully");
    return result;
  } catch (error) {
    console.error("Language test evaluation failed:", error);
    throw error;
  }
}
