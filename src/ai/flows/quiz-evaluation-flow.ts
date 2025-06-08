'use server';
/**
 * @fileOverview Evaluates a completed quiz, providing overall feedback and scores.
 * It uses the provided PDF to determine correct answers and scores 1 for correct, 0 for incorrect.
 * Implements a cascading API key fallback: User Gemini -> Platform Default.
 *
 * - evaluateQuiz - A function that takes quiz questions, user answers, and PDF URI, and returns evaluation.
 * - QuizEvaluationInput - The input type for the evaluateQuiz function.
 * - QuizEvaluationOutput - The return type for the evaluateQuiz function.
 */

import { genkit as baseGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ai } from '@/ai/genkit'; // Global AI instance
import { z } from 'genkit';

const QuizEvaluationInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "The content of the PDF document used for the quiz, as a data URI that must include a MIME type (application/pdf) and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  questions: z.array(z.string()).describe("The original list of quiz questions."),
  userAnswers: z.array(z.string()).describe("The list of answers provided by the user, corresponding to each question."),
  geminiApiKey: z.string().optional().describe('Optional Google Gemini API key to use for this request.'),
});
export type QuizEvaluationInput = z.infer<typeof QuizEvaluationInputSchema>;

const QAResultDetailSchema = z.object({
    questionText: z.string().describe("The original text of the question."),
    userAnswer: z.string().optional().describe("The answer provided by the user for this question."),
    isCorrect: z.boolean().describe("Whether the AI determined the answer to be correct (user answer scored 1) or incorrect (user answer scored 0)."),
    score: z.number().min(0).max(1).describe("A numerical score for the user's answer to this specific question (1 for correct, 0 for incorrect)."),
    correctAnswer: z.string().describe("The correct answer to the question, derived from the provided document."),
    aiFeedback: z.string().describe("Constructive feedback. If the user was incorrect, this should explain why and reiterate the correct answer. If correct, a brief affirmation."),
});

const QuizEvaluationOutputSchema = z.object({
  overallScore: z.number().describe("An overall score for the candidate's performance on the quiz (sum of individual question scores, where each question is 0 or 1)."),
  overallFeedback: z.string().describe("A concise overall summary of the candidate's performance on the quiz, based on their answers to the PDF content."),
  detailedFeedback: z.array(QAResultDetailSchema).describe("An array of specific feedback for each question-answer pair from the quiz, including the correct answer and a 0/1 score."),
});
export type QuizEvaluationOutput = z.infer<typeof QuizEvaluationOutputSchema>;

const QAPairSchema = z.object({
  question: z.string(),
  userAnswer: z.string(),
});

const PromptDataTypeSchema = z.object({
    pdfDataUri: z.string(),
    qaPairs: z.array(QAPairSchema),
});

const QUIZ_EVALUATION_PROMPT_TEMPLATE = `You are an AI Quiz Evaluator. Your task is to evaluate a user's answers to a quiz based on the content of a provided PDF document.
For each question and the user's corresponding answer, you must:
1.  Thoroughly understand the question.
2.  Consult the provided PDF document to determine the correct and comprehensive answer to the question.
3.  Compare the user's answer to the correct answer derived from the PDF.
4.  Determine if the user's answer is correct or incorrect.
    - If the user's answer accurately and completely addresses the question based on the PDF, mark it as correct (score: 1, isCorrect: true).
    - Otherwise, mark it as incorrect (score: 0, isCorrect: false). Be strict: partial, vague, or answers that miss key details from the PDF should be marked incorrect.
5.  Generate specific feedback ('aiFeedback'):
    - If correct: Provide a brief affirmation (e.g., "Correct.", "Well done.", "That's right based on the document.").
    - If incorrect: Clearly state that the answer is incorrect. Provide the correct answer as found in the PDF. Briefly explain why the user's answer was insufficient or incorrect, and guide them towards the correct understanding based on the PDF.
6.  For the 'correctAnswer' field, provide the factual answer derived from the PDF.

After evaluating all question-answer pairs:
1.  Calculate the 'overallScore' by summing the individual scores (0 or 1 for each question).
2.  Provide 'overallFeedback' as a concise summary of the user's performance, highlighting general strengths or areas where they struggled, based on their answers to the PDF content.

Document Content: {{pdfDataUri}}

Quiz Questions and User's Answers:
{{qaPairsText}}

Respond strictly in the specified JSON output format. Ensure each 'score' is either 0 or 1, and 'isCorrect' reflects this.
The 'overallScore' must be the sum of these individual scores.
`;

async function generateEvaluationLogic(input: QuizEvaluationInput): Promise<QuizEvaluationOutput> {
  const qaPairs = input.questions.map((q, i) => ({
    question: q,
    userAnswer: input.userAnswers[i] || "No answer provided",
  }));

  const qaPairsText = qaPairs.map((pair, index) => 
    `Question ${index + 1}: ${pair.question}\nUser's Answer: ${pair.userAnswer}\n---`
  ).join('\n');

  const promptData: z.infer<typeof PromptDataTypeSchema> = { 
    pdfDataUri: input.pdfDataUri,
    qaPairs: qaPairs,
  };

  // Try user-provided Gemini API key first
  if (input.geminiApiKey) {
    console.log(`Attempting to use user-provided Gemini API key for quiz evaluation.`);
    try {
      const tempAi = baseGenkit({
        plugins: [googleAI({ apiKey: input.geminiApiKey })],
      });
      
      const tempGenerate = tempAi.defineFlow(
        {
          name: `tempEvalFlow_${Date.now()}`,
          inputSchema: PromptDataTypeSchema,
          outputSchema: QuizEvaluationOutputSchema,
        },
        async (data) => {
          const qaPairsText = data.qaPairs.map((pair, index) => 
            `Question ${index + 1}: ${pair.question}\nUser's Answer: ${pair.userAnswer}\n---`
          ).join('\n');
          
          const prompt = QUIZ_EVALUATION_PROMPT_TEMPLATE
            .replace(/\{\{pdfDataUri\}\}/g, data.pdfDataUri)
            .replace(/\{\{qaPairsText\}\}/g, qaPairsText);
          
          const result = await tempAi.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt: prompt,
            output: { schema: QuizEvaluationOutputSchema },
          });
          
          if (!result.output) {
            throw new Error('Model returned no output');
          }
          
          return result.output;
        }
      );

      const response = await tempGenerate(promptData);
      if (!response || typeof response.overallScore !== 'number') {
        throw new Error(`Model (Gemini) returned invalid or empty output for evaluation.`);
      }
      
      console.log(`Successfully used user-provided Gemini API key for quiz evaluation. Score: ${response.overallScore}`);
      return response;
    } catch (e: any) {
      console.warn(`Error using user-provided Gemini API key for quiz evaluation:`, e.message);
      const errorMessage = (e.message || "").toLowerCase();
      const errorStatus = e.status || e.code;
      const isKeyError =
        errorMessage.includes("api key") ||
        errorMessage.includes("permission denied") ||
        errorMessage.includes("quota exceeded") ||
        errorMessage.includes("authentication failed") ||
        errorMessage.includes("billing") ||
        errorMessage.includes("insufficient_quota") ||
        errorStatus === 401 || errorStatus === 403 || errorStatus === 429 ||
        (e.cause && typeof e.cause === 'object' && 'code' in e.cause && e.cause.code === 7);

      if (!isKeyError) throw e;
      console.log(`User's Gemini API key failed due to key-related issue. Falling back to platform default.`);
    }
  }

  console.log("Falling back to platform's default API key for quiz evaluation.");
  try {
    const prompt = QUIZ_EVALUATION_PROMPT_TEMPLATE
      .replace(/\{\{pdfDataUri\}\}/g, promptData.pdfDataUri)
      .replace(/\{\{qaPairsText\}\}/g, qaPairsText);
    
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      output: { schema: QuizEvaluationOutputSchema },
    });

    if (!result.output || typeof result.output.overallScore !== 'number') {
      throw new Error("The AI model did not return the expected evaluation output after all attempts.");
    }
    console.log(`Generated evaluation using platform key. Score: ${result.output.overallScore}`);
    return result.output;
  } catch (fallbackError: any) {
    console.error("Error during platform fallback for quiz evaluation:", fallbackError);
    throw new Error(`Platform fallback for quiz evaluation failed: ${fallbackError.message || 'Unknown error during fallback'}`);
  }
}

const quizEvaluationFlow = ai.defineFlow(
  {
    name: 'quizEvaluationFlow',
    inputSchema: QuizEvaluationInputSchema,
    outputSchema: QuizEvaluationOutputSchema,
  },
  generateEvaluationLogic
);

export async function evaluateQuiz(input: QuizEvaluationInput): Promise<QuizEvaluationOutput> {
  console.log(`evaluateQuiz flow called with ${input.questions.length} questions.`);
  if (!input.pdfDataUri) {
    throw new Error("pdfDataUri is required for quiz evaluation.");
  }
  return quizEvaluationFlow(input);
}