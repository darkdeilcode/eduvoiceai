'use server';
/**
 * @fileOverview Handles the progression of a mock interview, providing feedback on the user's last answer
 * and generating the next question.
 * Implements a cascading API key fallback: User Gemini -> Platform Default.
 *
 * - getFeedbackAndNextQuestion - A function that processes the user's answer and generates feedback and the next question.
 * - InterviewProgressionInput - The input type for the getFeedbackAndNextQuestion function.
 * - InterviewProgressionOutput - The return type for the getFeedbackAndNextQuestion function.
 */

import { genkit as baseGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ai } from '@/ai/genkit'; // Global AI instance
import { z } from 'genkit';

const InterviewExchangeSchema = z.object({
  question: z.string().describe("The question asked by the AI interviewer."),
  answer: z.string().describe("The user's answer to the question."),
});

const InterviewProgressionInputSchema = z.object({
  resume: z
    .string()
    .describe('The resume of the candidate, as a data URI.'),
  jobDescription: z.string().describe('The job description for the role.'),
  interviewHistory: z.array(InterviewExchangeSchema).describe('A history of questions asked and answers given so far in the interview. The last item is the most recent exchange.'),
  geminiApiKey: z.string().optional().describe('Optional Google Gemini API key to use for this request.'),
  openaiApiKey: z.string().optional().describe('Optional OpenAI API key to use for this request (currently not supported by this flow).'),
  claudeApiKey: z.string().optional().describe('Optional Anthropic Claude API key to use for this request (currently not supported).'),
});
export type InterviewProgressionInput = z.infer<typeof InterviewProgressionInputSchema>;

const InterviewProgressionOutputSchema = z.object({
  feedbackOnLastAnswer: z.string().describe("Constructive feedback on the user's most recent answer."),
  nextQuestion: z.string().describe("The next interview question to ask the user. This can be an empty string if the AI determines there are no more relevant questions."),
});
export type InterviewProgressionOutput = z.infer<typeof InterviewProgressionOutputSchema>;

const PromptDataTypeSchema = z.object({
    resume: z.string(),
    jobDescription: z.string(),
    interviewHistory: z.array(InterviewExchangeSchema),
});

const INTERVIEW_PROGRESSION_PROMPT_TEMPLATE = `You are an AI Interviewer conducting a mock interview.
The candidate's resume and the job description are provided below.
You also have the history of questions you've asked and the candidate's answers.

Job Description:
{{jobDescription}}

Candidate's Resume:
{{resume}}

Interview History (most recent exchange is last):
{{#each interviewHistory}}
Interviewer: {{question}}
Candidate: {{answer}}
---
{{/each}}

Your tasks are:
1. Provide concise, constructive feedback on the candidate's *last answer* in the interview history.
2. Generate the *next relevant interview question* to continue the interview.
   - Ensure the question builds upon the interview so far or explores new relevant areas based on the resume and job description. Do not repeat questions.
   - Aim to ask a diverse set of approximately 10 questions in total if the topic and context allow. If fewer than 8-10 questions have been asked and you can still formulate relevant questions, please provide one.
   - If you genuinely believe all relevant areas have been covered or the interview should conclude, you can return an empty string for the next question.

Respond with only the feedback and the next question in the specified output format.
`;

async function generateFeedbackAndNextQuestionLogic(input: InterviewProgressionInput): Promise<InterviewProgressionOutput> {
  const promptData: z.infer<typeof PromptDataTypeSchema> = {
    resume: input.resume,
    jobDescription: input.jobDescription,
    interviewHistory: input.interviewHistory,
  };

  // Try user-provided Gemini API key first
  if (input.geminiApiKey) {
    console.log(`Attempting to use user-provided Gemini API key for interview progression.`);
    try {
      const tempAi = baseGenkit({
        plugins: [googleAI({ apiKey: input.geminiApiKey })],
      });
      
      const tempGenerate = tempAi.defineFlow(
        {
          name: `tempProgressionFlow_${Date.now()}`,
          inputSchema: PromptDataTypeSchema,
          outputSchema: InterviewProgressionOutputSchema,
        },
        async (data) => {
          let prompt = INTERVIEW_PROGRESSION_PROMPT_TEMPLATE
            .replace(/\{\{jobDescription\}\}/g, data.jobDescription)
            .replace(/\{\{resume\}\}/g, data.resume);
          
          // Handle the interview history loop
          let historyText = '';
          data.interviewHistory.forEach(exchange => {
            historyText += `Interviewer: ${exchange.question}\n`;
            historyText += `Candidate: ${exchange.answer}\n`;
            historyText += '---\n';
          });
          prompt = prompt.replace(/\{\{#each interviewHistory\}\}[\s\S]*?\{\{\/each\}\}/g, historyText);
          
          const result = await tempAi.generate({
            model: 'googleai/gemini-1.5-flash',
            prompt: prompt,
            output: { schema: InterviewProgressionOutputSchema },
          });
          
          if (!result.output) {
            throw new Error('Model returned no output');
          }
          
          return result.output;
        }
      );

      const response = await tempGenerate(promptData);
      if (!response) {
        throw new Error('Model (Gemini) returned no output.');
      }

      console.log(`Successfully used user-provided Gemini API key for interview progression.`);
      return response;
    } catch (e: any) {
      console.warn(`Error using user-provided Gemini API key for interview progression:`, e.message);
      const errorMessage = (e.message || "").toLowerCase();
      const errorStatus = e.status || e.code;
      const errorType = (e.type || "").toLowerCase();
      const isKeyError =
        errorMessage.includes("api key") ||
        errorMessage.includes("permission denied") ||
        errorMessage.includes("quota exceeded") ||
        errorMessage.includes("authentication failed") ||
        errorMessage.includes("invalid_request") ||
        errorMessage.includes("billing") ||
        errorMessage.includes("insufficient_quota") ||
        errorType.includes("api_key") ||
        errorStatus === 401 || errorStatus === 403 || errorStatus === 429 ||
        (e.cause && typeof e.cause === 'object' && 'code' in e.cause && e.cause.code === 7) ||
        (e.response && e.response.data && e.response.data.error && /api key/i.test(e.response.data.error.message));

      if (!isKeyError) throw e;
      console.log(`User's Gemini API key failed. Falling back to platform default.`);
    }
  }

  console.log("Falling back to platform's default API key for interview progression.");
  try {
    let prompt = INTERVIEW_PROGRESSION_PROMPT_TEMPLATE
      .replace(/\{\{jobDescription\}\}/g, promptData.jobDescription)
      .replace(/\{\{resume\}\}/g, promptData.resume);
    
    // Handle the interview history loop
    let historyText = '';
    promptData.interviewHistory.forEach(exchange => {
      historyText += `Interviewer: ${exchange.question}\n`;
      historyText += `Candidate: ${exchange.answer}\n`;
      historyText += '---\n';
    });
    prompt = prompt.replace(/\{\{#each interviewHistory\}\}[\s\S]*?\{\{\/each\}\}/g, historyText);
    
    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      output: { schema: InterviewProgressionOutputSchema },
    });

    if (!result.output) {
      throw new Error("AI model did not return the expected output for interview progression.");
    }
    
    return result.output;
  } catch (fallbackError: any) {
    console.error("Error during platform fallback:", fallbackError);
    throw new Error(`Platform fallback for interview progression failed: ${fallbackError.message || 'Unknown error during fallback'}`);
  }
}

const interviewProgressionFlow = ai.defineFlow(
  {
    name: 'interviewProgressionFlow',
    inputSchema: InterviewProgressionInputSchema, 
    outputSchema: InterviewProgressionOutputSchema,
  },
  generateFeedbackAndNextQuestionLogic
);

export async function getFeedbackAndNextQuestion(input: InterviewProgressionInput): Promise<InterviewProgressionOutput> {
  return interviewProgressionFlow(input);
}