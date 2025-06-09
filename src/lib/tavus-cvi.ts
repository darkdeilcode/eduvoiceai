/**
 * Tavus Conversational Video Interface (CVI) Integration
 * Handles real-time multimodal video conversations for language testing
 */

import type { TavusCVIConfig, TavusCVIResponse, LanguageTestConfig } from '@/types/languageTest';

const TAVUS_CVI_BASE_URL = 'https://tavusapi.com/v2';
const DEFAULT_TAVUS_API_KEY = process.env.TAVUS_API_KEY || '44c1cf65b56246f481740248920b892b';

/**
 * Generate conversational context for language testing based on difficulty and language
 */
export function generateConversationalContext(
  config: LanguageTestConfig
): string {
  const { language, difficulty, duration } = config;
  
  const contextTemplates = {
    beginner: {
      en: `You are a certified IELTS Speaking Test examiner conducting a ${duration}-minute English speaking assessment. Follow the official IELTS format:

Part 1 (4-5 minutes): Introduction & Interview
- Start with "Good morning/afternoon. My name is [examiner name]. Can you tell me your full name please?"
- Ask about familiar topics: hometown, work/study, hobbies, daily routine, family
- Ask 2-3 follow-up questions for each topic
- Keep language simple and clear for beginner level

Part 2 (3-4 minutes): Individual Long Turn
- Give a cue card topic (describe a place, person, experience)
- Say "You have one minute to prepare. You can make notes. Here's your topic."
- Let them speak for 2 minutes, then ask 1-2 follow-up questions

Part 3 (4-5 minutes): Two-way Discussion
- Ask abstract questions related to Part 2 topic
- Encourage longer, more detailed responses
- Be encouraging and maintain professional examiner demeanor`,
      es: `Eres un examinador certificado de IELTS realizando una evaluación oral de español de ${duration} minutos. Sigue el formato oficial de IELTS con temas apropiados para nivel principiante: familia, pasatiempos, rutina diaria, comida favorita. Mantén un lenguaje simple y alentador.`,
      fr: `Vous êtes un examinateur IELTS certifié menant une évaluation orale de français de ${duration} minutes. Suivez le format officiel IELTS avec des sujets appropriés pour niveau débutant: famille, loisirs, routine quotidienne, nourriture préférée. Gardez un langage simple et encourageant.`,
      de: `Sie sind ein zertifizierter IELTS-Prüfer, der eine ${duration}-minütige deutsche Sprechbewertung durchführt. Folgen Sie dem offiziellen IELTS-Format mit Themen für Anfängerniveau: Familie, Hobbys, tägliche Routine, Lieblingsessen. Verwenden Sie einfache und ermutigende Sprache.`
    },
    intermediate: {
      en: `You are a certified IELTS Speaking Test examiner conducting a ${duration}-minute English speaking assessment for intermediate level. Follow the official IELTS format:

Part 1 (4-5 minutes): Introduction & Interview
- Start professionally and ask about hometown, work/study, technology use
- Ask more complex follow-up questions
- Expect more detailed responses

Part 2 (3-4 minutes): Individual Long Turn
- Give cue card topics like "Describe a skill you'd like to learn" or "Describe a memorable journey"
- Include 3-4 bullet points they should cover
- Allow 2 minutes speaking time, then ask follow-up questions

Part 3 (4-5 minutes): Two-way Discussion
- Ask analytical questions about learning, travel, technology
- Encourage comparison and opinion-giving
- Challenge them with "Why do you think...?" and "How has this changed?"
- Maintain professional examiner standards`,
      es: `Eres un examinador certificado de IELTS realizando una evaluación oral de español de ${duration} minutos para nivel intermedio. Incluye discusiones sobre experiencias de viaje, vida urbana vs rural, impacto de la tecnología, objetivos educativos/profesionales.`,
      fr: `Vous êtes un examinateur IELTS certifié menant une évaluation orale de français de ${duration} minutes pour niveau intermédiaire. Incluez des discussions sur les expériences de voyage, vie urbaine vs rurale, impact de la technologie, objectifs éducatifs/professionnels.`,
      de: `Sie sind ein zertifizierter IELTS-Prüfer, der eine ${duration}-minütige deutsche Sprechbewertung für Mittelstufe durchführt. Führen Sie Diskussionen über Reiseerfahrungen, Stadtleben vs Landleben, Technologie-Einfluss, Bildungs-/Berufsziele.`
    },
    advanced: {
      en: `You are a certified IELTS Speaking Test examiner conducting a ${duration}-minute English speaking assessment for advanced level. Follow the official IELTS format:

Part 1 (4-5 minutes): Introduction & Interview
- Ask sophisticated questions about cultural identity, professional challenges, social media impact
- Expect nuanced, well-developed responses
- Ask probing follow-up questions

Part 2 (3-4 minutes): Individual Long Turn
- Give complex cue card topics like "Describe a time you adapted to change" or "Describe an environmental issue"
- Include 4 bullet points they should address
- Expect sophisticated vocabulary and complex structures

Part 3 (4-5 minutes): Two-way Discussion
- Ask abstract, analytical questions about society, environment, globalization, future trends
- Challenge with hypothetical scenarios
- Expect critical thinking and balanced arguments
- Ask "To what extent do you agree?" and "What are the implications?"
- Maintain high academic standards while being supportive`,
      es: `Eres un examinador certificado de IELTS realizando una evaluación oral de español de ${duration} minutos para nivel avanzado. Lidera discusiones analíticas sobre impacto de redes sociales, desafíos ambientales, globalización, papel de la IA en el trabajo futuro.`,
      fr: `Vous êtes un examinateur IELTS certifié menant une évaluation orale de français de ${duration} minutes pour niveau avancé. Menez des discussions analytiques sur l'impact des médias sociaux, défis environnementaux, mondialisation, rôle de l'IA dans l'avenir du travail.`,
      de: `Sie sind ein zertifizierter IELTS-Prüfer, der eine ${duration}-minütige deutsche Sprechbewertung für Fortgeschrittene durchführt. Führen Sie analytische Diskussionen über Auswirkungen sozialer Medien, Umweltherausforderungen, Globalisierung, KI-Rolle in der Zukunft der Arbeit.`
    }
  };

  const languageCode = config.languageCode || 'en';
  const template = contextTemplates[difficulty]?.[languageCode as keyof typeof contextTemplates[typeof difficulty]] || 
                   contextTemplates[difficulty].en;
  
  return template;
}

/**
 * Create a Tavus CVI conversation for language testing
 */
export async function createCVIConversation(
  config: LanguageTestConfig,
  options: {
    replicaId?: string;
    personaId?: string;
    apiKey?: string;
  } = {}
): Promise<TavusCVIResponse> {
  const apiKey = options.apiKey || DEFAULT_TAVUS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Tavus API key is required for CVI conversations');
  }

  // Default replica and persona IDs for IELTS teacher
  const defaultReplicaId = options.replicaId || 'r9d30b0e55ac';
  const defaultPersonaId = options.personaId || 'pa9775068f50';
  
  const conversationalContext = generateConversationalContext(config);
  
  const cviConfig: TavusCVIConfig = {
    replica_id: defaultReplicaId,
    persona_id: defaultPersonaId,
    conversation_name: `${config.language} Language Test - ${config.difficulty} Level`,
    conversational_context: conversationalContext,
    properties: {
      enable_recording: true,
      language: config.language  // Use full language name instead of code
    }
  };

  try {
    console.log('🎥 Creating Tavus CVI conversation:', {
      language: config.language,
      difficulty: config.difficulty,
      duration: config.duration
    });

    const response = await fetch(`${TAVUS_CVI_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(cviConfig)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Tavus CVI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Tavus CVI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Tavus CVI conversation created successfully:', result.conversation_id);
    
    return {
      conversation_id: result.conversation_id,
      conversation_url: result.conversation_url,
      status: result.status || 'created',
      created_at: result.created_at || new Date().toISOString(),
      daily_room_url: result.daily_room_url
    };
    
  } catch (error: any) {
    console.error('❌ Failed to create Tavus CVI conversation:', error);
    throw new Error(`Failed to create CVI conversation: ${error.message}`);
  }
}

/**
 * Get conversation status and details
 */
export async function getCVIConversationStatus(
  conversationId: string,
  apiKey?: string
): Promise<TavusCVIResponse> {
  const key = apiKey || DEFAULT_TAVUS_API_KEY;
  
  if (!key) {
    throw new Error('Tavus API key is required');
  }

  try {
    const response = await fetch(`${TAVUS_CVI_BASE_URL}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get conversation status: ${response.status}`);
    }

    const result = await response.json();
    return {
      conversation_id: result.conversation_id,
      conversation_url: result.conversation_url,
      status: result.status,
      created_at: result.created_at,
      daily_room_url: result.daily_room_url
    };
    
  } catch (error: any) {
    console.error('❌ Failed to get CVI conversation status:', error);
    throw error;
  }
}

/**
 * End a CVI conversation
 */
export async function endCVIConversation(
  conversationId: string,
  apiKey?: string
): Promise<void> {
  const key = apiKey || DEFAULT_TAVUS_API_KEY;
  
  if (!key) {
    throw new Error('Tavus API key is required');
  }

  try {
    const response = await fetch(`${TAVUS_CVI_BASE_URL}/conversations/${conversationId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to end conversation: ${response.status}`);
    }

    console.log('✅ CVI conversation ended successfully:', conversationId);
    
  } catch (error: any) {
    console.error('❌ Failed to end CVI conversation:', error);
    throw error;
  }
}