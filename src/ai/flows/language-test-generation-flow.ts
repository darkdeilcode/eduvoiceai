/**
 * Language Test Generation Flow
 * Generates personalized language test questions based on user's language and difficulty level
 */

import { z } from 'zod';
import { genkit, ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';

// Input schema for language test generation
const LanguageTestGenerationInputSchema = z.object({
  language: z.string().describe("The target language for the test (e.g., 'Spanish', 'French')"),
  languageCode: z.string().describe("The ISO language code (e.g., 'es', 'fr')"),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe("The difficulty level of the test"),
  testType: z.enum(['conversation', 'pronunciation', 'comprehension', 'mixed']).describe("The type of language test"),
  questionCount: z.number().min(5).max(20).describe("Number of questions to generate"),
  focusAreas: z.array(z.string()).optional().describe("Specific areas to focus on (e.g., 'grammar', 'vocabulary', 'pronunciation')"),
  geminiApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
});

export type LanguageTestGenerationInput = z.infer<typeof LanguageTestGenerationInputSchema>;

// Output schema for generated language test
const LanguageTestQuestionSchema = z.object({
  id: z.string().describe("Unique identifier for the question"),
  type: z.enum(['speaking', 'listening', 'reading', 'writing']).describe("The type of question"),
  prompt: z.string().describe("The question or instruction for the user"),
  expectedResponse: z.string().optional().describe("Expected or sample correct response"),
  context: z.string().optional().describe("Additional context or scenario for the question"),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe("Difficulty level of this specific question"),
  skillsAssessed: z.array(z.string()).describe("Language skills this question assesses"),
  timeLimit: z.number().optional().describe("Time limit for this question in seconds"),
  points: z.number().describe("Points this question is worth"),
});

const LanguageTestGenerationOutputSchema = z.object({
  testId: z.string().describe("Unique identifier for the generated test"),
  language: z.string().describe("The target language"),
  languageCode: z.string().describe("The ISO language code"),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe("Overall test difficulty"),
  testType: z.enum(['conversation', 'pronunciation', 'comprehension', 'mixed']).describe("Type of test"),
  estimatedDuration: z.number().describe("Estimated test duration in minutes"),
  instructions: z.string().describe("General instructions for the test"),
  questions: z.array(LanguageTestQuestionSchema).describe("Array of generated test questions"),
  totalPoints: z.number().describe("Total points possible for the test"),
  skillBreakdown: z.object({
    speaking: z.number().describe("Percentage of test focused on speaking"),
    listening: z.number().describe("Percentage of test focused on listening"),
    reading: z.number().describe("Percentage of test focused on reading"),
    writing: z.number().describe("Percentage of test focused on writing"),
  }).describe("Breakdown of skills covered in the test"),
});

export type LanguageTestGenerationOutput = z.infer<typeof LanguageTestGenerationOutputSchema>;

const LANGUAGE_TEST_GENERATION_PROMPT = `You are an expert language test designer. Your task is to create a comprehensive language proficiency test.

Target Language: {{language}} ({{languageCode}})
Difficulty Level: {{difficulty}}
Test Type: {{testType}}
Number of Questions: {{questionCount}}
{{#if focusAreas}}Focus Areas: {{#each focusAreas}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

Create a well-structured language test that:

1. **Assesses Multiple Skills**: Include a balanced mix of speaking, listening, reading, and writing questions appropriate for the test type
2. **Progressive Difficulty**: Questions should be appropriately challenging for the {{difficulty}} level
3. **Cultural Context**: Include culturally relevant scenarios and contexts for the target language
4. **Practical Application**: Focus on real-world language use scenarios
5. **Clear Instructions**: Provide clear, unambiguous prompts for each question

**Question Types by Test Type:**

- **Conversation**: Focus on dialogue, role-play, and interactive scenarios
- **Pronunciation**: Emphasize speaking tasks with specific phonetic challenges
- **Comprehension**: Include listening and reading comprehension with various text types
- **Mixed**: Balanced combination of all skill areas

**Difficulty Guidelines:**

- **Beginner**: Basic vocabulary, simple grammar, everyday situations
- **Intermediate**: More complex grammar, varied vocabulary, cultural contexts
- **Advanced**: Nuanced expressions, complex grammar, professional/academic contexts

**Question Design Requirements:**

1. Each question should have a clear, specific prompt
2. Include expected responses or sample answers where appropriate
3. Specify the skills being assessed for each question
4. Set appropriate time limits based on question complexity
5. Assign point values that reflect question difficulty and importance

Generate a comprehensive test that will effectively assess the user's proficiency in {{language}} at the {{difficulty}} level.`;

async function generateLanguageTestLogic(input: LanguageTestGenerationInput): Promise<LanguageTestGenerationOutput> {
  // Try user's custom API key first if provided
  if (input.geminiApiKey) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const tempAi = genkit({
        plugins: [googleAI({ apiKey: input.geminiApiKey })],
        model: 'googleai/gemini-1.5-flash',
      });

      const tempGenerate = tempAi.generate;

      const promptData = {
        language: input.language,
        languageCode: input.languageCode,
        difficulty: input.difficulty,
        testType: input.testType,
        questionCount: input.questionCount,
        focusAreas: input.focusAreas,
      };

      const result = await tempGenerate({
        model: 'googleai/gemini-1.5-flash',
        prompt: LANGUAGE_TEST_GENERATION_PROMPT
          .replace(/\{\{language\}\}/g, promptData.language)
          .replace(/\{\{languageCode\}\}/g, promptData.languageCode)
          .replace(/\{\{difficulty\}\}/g, promptData.difficulty)
          .replace(/\{\{testType\}\}/g, promptData.testType)
          .replace(/\{\{questionCount\}\}/g, promptData.questionCount.toString())
          .replace(/\{\{#if focusAreas\}\}[\s\S]*?\{\{\/if\}\}/g, 
            promptData.focusAreas ? `Focus Areas: ${promptData.focusAreas.join(', ')}` : ''),
        output: { schema: LanguageTestGenerationOutputSchema },
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

  console.log("Falling back to platform's default API key for language test generation.");
  try {
    const ai = genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-1.5-flash',
    });

    let prompt = LANGUAGE_TEST_GENERATION_PROMPT
      .replace(/\{\{language\}\}/g, input.language)
      .replace(/\{\{languageCode\}\}/g, input.languageCode)
      .replace(/\{\{difficulty\}\}/g, input.difficulty)
      .replace(/\{\{testType\}\}/g, input.testType)
      .replace(/\{\{questionCount\}\}/g, input.questionCount.toString());

    // Handle focus areas
    if (input.focusAreas && input.focusAreas.length > 0) {
      prompt = prompt.replace(/\{\{#if focusAreas\}\}[\s\S]*?\{\{\/if\}\}/g, 
        `Focus Areas: ${input.focusAreas.join(', ')}`);
    } else {
      prompt = prompt.replace(/\{\{#if focusAreas\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }

    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      output: { schema: LanguageTestGenerationOutputSchema },
    });

    if (!result.output) {
      throw new Error("AI model did not return the expected output for language test generation.");
    }

    return result.output;
  } catch (fallbackError: any) {
    console.error("Error during platform fallback:", fallbackError);
    throw new Error(`Platform fallback for language test generation failed: ${fallbackError.message || 'Unknown error during fallback'}`);
  }
}

/**
 * Public function to generate language test
 */
export async function generateLanguageTest(input: LanguageTestGenerationInput): Promise<LanguageTestGenerationOutput> {
  console.log("Generating language test with input:", {
    language: input.language,
    difficulty: input.difficulty,
    testType: input.testType,
    questionCount: input.questionCount,
    hasCustomKey: !!input.geminiApiKey,
  });

  try {
    const result = await generateLanguageTestLogic(input);
    console.log("Language test generation completed successfully");
    return result;
  } catch (error) {
    console.error("Language test generation failed:", error);
    throw error;
  }
}
