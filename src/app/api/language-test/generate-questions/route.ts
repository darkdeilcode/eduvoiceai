import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Client, Account } from 'appwrite';
import { generate } from '@genkit-ai/ai';
import { googleAI } from '@genkit-ai/googleai';

interface AIQuestion {
  id: string;
  question: string;
  part: 1 | 2 | 3;
  timeLimit: number;
  followUp?: string[];
}

interface QuestionGenerationRequest {
  language: string;
  languageCode: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  testType: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI Question Generation API called');
    
    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('appwrite-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user session with Appwrite
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setSession(sessionCookie.value);
    
    const account = new Account(client);
    
    try {
      await account.get();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Parse request body
    const { language, languageCode, difficulty, testType }: QuestionGenerationRequest = await request.json();

    if (!language || !languageCode || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('Generating questions for:', { language, difficulty, testType });

    // Generate AI questions using Google AI
    const questions = await generateIELTSQuestions(language, languageCode, difficulty);

    return NextResponse.json({
      success: true,
      questions,
      language,
      difficulty,
      testType
    });

  } catch (error) {
    console.error('Error generating AI questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generateIELTSQuestions(
  language: string, 
  languageCode: string, 
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<AIQuestion[]> {
  try {
    // Enhanced AI prompt for better IELTS-style question generation
    const prompt = `You are an expert IELTS Speaking Test examiner. Generate authentic IELTS Speaking Test questions for a ${difficulty} level ${language} learner that will be conducted via AI video conversation using Tavus CVI.
    
    IMPORTANT: Create questions that work well for AI video conversations where the AI examiner will ask questions and the student will respond via video.
    
    Generate exactly 6 questions following this structure:
    
    **Part 1 (Introduction & Interview) - 3 questions (4-5 minutes total):**
    - Personal topics: home, family, work/study, hobbies, daily routine
    - Each question should have 2-3 natural follow-up questions
    - Time limit: 60-90 seconds per question
    
    **Part 2 (Individual Long Turn) - 1 question (3-4 minutes):**
    - Cue card format with clear bullet points
    - Include: "You should say:" followed by 3-4 specific points
    - Add: "and explain why/how..." at the end
    - Time limit: 180 seconds (3 minutes)
    - Include 1-2 follow-up questions
    
    **Part 3 (Two-way Discussion) - 2 questions (4-5 minutes):**
    - Abstract topics related to Part 2 theme
    - More complex, analytical questions
    - Each question should have 1-2 follow-up questions
    - Time limit: 120-150 seconds per question
    
    **Difficulty Guidelines:**
    - Beginner: Simple vocabulary, present tense focus, concrete topics
    - Intermediate: Mixed tenses, some abstract concepts, comparison questions
    - Advanced: Complex structures, abstract thinking, hypothetical situations
    
    **Language Code Consideration:**
    Use language code ${languageCode} to ensure cultural relevance and appropriate examples.
    
    Return as JSON array with this structure:
    {
      "id": "unique_id",
      "question": "question text",
      "part": 1|2|3,
      "timeLimit": seconds,
      "followUp": ["follow up questions"]
    }`;

    const response = await generate({
      model: googleAI('gemini-1.5-flash'),
      prompt: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    // Parse the AI response
    const questionsText = response.text();
    
    // Try to extract JSON from the response
    const jsonMatch = questionsText.match(/\[.*\]/s);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      return questions;
    }
    
    // Fallback to predefined questions if AI generation fails
    throw new Error('Failed to parse AI response');
    
  } catch (error) {
    console.error('Error with AI generation:', error);
    // Fallback to default questions
    return generateQuestionsByDifficulty(language, difficulty);
  }
}

function generateQuestionsByDifficulty(
  language: string, 
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): AIQuestion[] {
  const baseQuestions: Record<string, AIQuestion[]> = {
    beginner: [
      // Part 1: Introduction and Interview (Personal & Familiar Topics)
      {
        id: 'p1-1',
        question: "Let's talk about your hometown. Where do you come from?",
        part: 1,
        timeLimit: 75,
        followUp: ["How long have you lived there?", "What do you like most about your hometown?", "Is it a good place for young people?"]
      },
      {
        id: 'p1-2',
        question: "Do you work or are you a student?",
        part: 1,
        timeLimit: 75,
        followUp: ["What do you enjoy most about your work/studies?", "Is it difficult?", "What are your plans for the future?"]
      },
      {
        id: 'p1-3',
        question: "What do you like to do in your free time?",
        part: 1,
        timeLimit: 75,
        followUp: ["How often do you do this activity?", "Do you prefer to do this alone or with friends?", "Did you enjoy this activity when you were a child?"]
      },
      // Part 2: Individual Long Turn (Cue Card)
      {
        id: 'p2-1',
        question: "Describe a place you like to visit in your free time. You should say: where this place is, how often you go there, what you do there, and explain why you enjoy visiting this place.",
        part: 2,
        timeLimit: 180,
        followUp: ["Do you think it's important for people to have places where they can relax?", "How do people in your country usually spend their free time?"]
      },
      // Part 3: Two-way Discussion (Abstract & Analytical)
      {
        id: 'p3-1',
        question: "What kinds of places do young people in your country like to visit?",
        part: 3,
        timeLimit: 120,
        followUp: ["How have leisure activities changed in your country?", "Do you think people have enough free time nowadays?"]
      },
      {
        id: 'p3-2',
        question: "Do you think it's important for cities to have parks and green spaces?",
        part: 3,
        timeLimit: 120,
        followUp: ["What are the benefits of spending time in nature?", "How can governments encourage people to spend more time outdoors?"]
      }
    ],
    
    intermediate: [
      // Part 1: Introduction and Interview (Personal & Familiar Topics)
      {
        id: 'p1-1',
        question: "Let's talk about where you live. What's the most interesting thing about your hometown?",
        part: 1,
        timeLimit: 80,
        followUp: ["How has your area changed in recent years?", "Would you recommend it to tourists?", "What could be improved about your hometown?"]
      },
      {
        id: 'p1-2',
        question: "Tell me about your work or studies. What do you find most challenging about it?",
        part: 1,
        timeLimit: 80,
        followUp: ["What skills are most important in your field?", "How do you see your career developing?", "What advice would you give to someone starting in your field?"]
      },
      {
        id: 'p1-3',
        question: "How important is technology in your daily life?",
        part: 1,
        timeLimit: 80,
        followUp: ["How has technology changed the way you communicate?", "Do you think people rely too much on technology?", "What technology do you find most useful?"]
      },
      // Part 2: Individual Long Turn (Cue Card)
      {
        id: 'p2-1',
        question: "Describe a skill you would like to learn in the future. You should say: what the skill is, why you want to learn it, how you plan to learn it, and explain how this skill would benefit you in your life.",
        part: 2,
        timeLimit: 180,
        followUp: ["What's the best way for adults to learn new skills?", "Do you think some people are naturally more talented at learning than others?"]
      },
      // Part 3: Two-way Discussion (Abstract & Analytical)
      {
        id: 'p3-1',
        question: "How important is it for people to continue learning throughout their lives?",
        part: 3,
        timeLimit: 135,
        followUp: ["What motivates people to learn new things as adults?", "How has the way people learn changed in recent years?"]
      },
      {
        id: 'p3-2',
        question: "Some people believe that practical skills are more valuable than academic knowledge. What's your opinion?",
        part: 3,
        timeLimit: 135,
        followUp: ["How can education systems balance practical and academic learning?", "What skills do you think will be most important in the future workplace?"]
      }
    ],
    
    advanced: [
      // Part 1: Introduction and Interview (Personal & Familiar Topics)
      {
        id: 'p1-1',
        question: "How would you describe the cultural identity of your region, and what factors have shaped it over time?",
        part: 1,
        timeLimit: 90,
        followUp: ["How do you think globalization affects local cultures?", "What aspects of your culture do you think are most valuable?", "How can communities preserve their cultural heritage?"]
      },
      {
        id: 'p1-2',
        question: "What do you consider to be the most significant challenges facing your profession or field of study?",
        part: 1,
        timeLimit: 90,
        followUp: ["How do you think these challenges could be addressed?", "What innovations do you expect to see in your field?", "How has your field evolved in recent years?"]
      },
      {
        id: 'p1-3',
        question: "How has social media influenced the way people form and maintain relationships in your opinion?",
        part: 1,
        timeLimit: 90,
        followUp: ["Do you believe online relationships can be as meaningful as face-to-face ones?", "What are the implications for future generations?", "How do you balance online and offline social interactions?"]
      },
      // Part 2: Individual Long Turn (Cue Card)
      {
        id: 'p2-1',
        question: "Describe a time when you had to adapt to a significant change in your life. You should say: what the change was, why it happened, how you adapted to it, and explain what you learned from this experience and how it has influenced your approach to future challenges.",
        part: 2,
        timeLimit: 180,
        followUp: ["How do you think people's ability to adapt varies between individuals?", "What role does resilience play in personal and professional development?"]
      },
      // Part 3: Two-way Discussion (Abstract & Analytical)
      {
        id: 'p3-1',
        question: "In what ways do you think the concept of 'change' and attitudes towards it differ across generations?",
        part: 3,
        timeLimit: 150,
        followUp: ["How can societies better prepare people for rapid technological and social change?", "What are the potential psychological effects of living in a constantly changing world?"]
      },
      {
        id: 'p3-2',
        question: "Some argue that in our rapidly evolving world, the ability to adapt is more crucial than specialized knowledge. To what extent do you agree with this statement?",
        part: 3,
        timeLimit: 150,
        followUp: ["How can educational systems better foster adaptability and critical thinking?", "What balance should exist between maintaining stability and embracing change in society?"]
      }
    ]
  };

  return baseQuestions[difficulty] || baseQuestions.intermediate;
}