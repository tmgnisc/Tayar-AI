import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Question {
  id: number;
  question: string;
  expectedAnswers?: string[]; // Legacy support
  expectedSummary?: string; // New format - single summary string
  keywords: string[];
  followUp?: string;
  routeKeywords?: { [keyword: string]: number }; // Legacy support
  routing?: { [keyword: string]: number }; // New format - Maps keywords to next question IDs
  defaultNextQuestionId?: number; // Legacy support
  defaultNext?: number | null; // New format - Default next question if no keywords match
  lowKnowledgePhrases?: string[]; // Phrases that indicate low knowledge
  systemReplyOnLowKnowledge?: string; // System response when low knowledge detected
}

interface InterviewQuestions {
  [domain: string]: {
    [level: string]: Question[];
  };
}

/**
 * Load questions from JSON file
 */
function loadQuestions(): InterviewQuestions {
  try {
    const questionsPath = path.join(__dirname, '..', 'data', 'interview-questions.json');
    console.log('[InterviewService] Loading questions from:', questionsPath);
    const fileContent = fs.readFileSync(questionsPath, 'utf-8');
    const questions = JSON.parse(fileContent);
    console.log('[InterviewService] Successfully loaded questions. Domains:', Object.keys(questions));
    return questions;
  } catch (error: any) {
    console.error('[InterviewService] Error loading questions:', error);
    console.error('[InterviewService] Error details:', {
      message: error.message,
      code: error.code,
      path: error.path,
    });
    return {};
  }
}

/**
 * Get questions for a specific domain and level
 */
export function getQuestions(domain: string, level: string): Question[] {
  const questions = loadQuestions();
  const domainLower = domain.toLowerCase();
  const levelLower = level.toLowerCase();
  
  // Try exact match first
  if (questions[domainLower] && questions[domainLower][levelLower]) {
    return questions[domainLower][levelLower];
  }
  
  // Try to find similar domain
  const domainKey = Object.keys(questions).find(key => 
    domainLower.includes(key) || key.includes(domainLower)
  );
  
  if (domainKey && questions[domainKey][levelLower]) {
    return questions[domainKey][levelLower];
  }
  
  // Return empty array if no questions found
  console.warn(`No questions found for domain: ${domain}, level: ${level}`);
  return [];
}

/**
 * Common profanity/abusive words (basic list - can be expanded)
 */
const PROFANITY_WORDS = [
  'fuck', 'shit', 'damn', 'hell', 'bitch', 'ass', 'bastard', 'crap',
  'stupid', 'idiot', 'dumb', 'moron', 'retard', 'crap', 'piss',
  // Add more as needed
];

/**
 * Check if answer contains profanity or abusive language
 */
export function checkProfanity(userAnswer: string): boolean {
  if (!userAnswer) return false;
  
  const answerLower = userAnswer.toLowerCase();
  
  for (const word of PROFANITY_WORDS) {
    // Check for whole word match
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordRegex.test(answerLower)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if answer is off-topic based on keywords
 * Returns true if answer seems unrelated to the question topic
 */
export function checkOffTopic(
  userAnswer: string,
  questionKeywords: string[],
  domainKeywords?: string[]
): boolean {
  if (!userAnswer || !questionKeywords || questionKeywords.length === 0) {
    return false;
  }

  const answerLower = userAnswer.toLowerCase();
  
  // Check if answer contains any relevant keywords
  let relevantKeywordsFound = 0;
  for (const keyword of questionKeywords) {
    const keywordLower = keyword.toLowerCase();
    if (answerLower.includes(keywordLower)) {
      relevantKeywordsFound++;
    }
  }
  
  // If answer is very short and has no relevant keywords, might be off-topic
  // But we need to be careful - short answers might just be brief
  const answerWords = answerLower.split(/\s+/).filter(w => w.length > 2);
  
  // If answer has multiple words but no relevant keywords, likely off-topic
  if (answerWords.length > 5 && relevantKeywordsFound === 0) {
    // Check for common off-topic phrases
    const offTopicPhrases = [
      'can you tell me',
      'what about',
      'i want to know',
      'explain to me',
      'tell me about',
      'i have a question',
      'can i ask',
      'i want to ask',
    ];
    
    for (const phrase of offTopicPhrases) {
      if (answerLower.includes(phrase)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if user answer indicates low knowledge
 */
export function checkLowKnowledge(
  userAnswer: string,
  lowKnowledgePhrases?: string[]
): boolean {
  if (!lowKnowledgePhrases || lowKnowledgePhrases.length === 0) {
    return false;
  }

  if (!userAnswer || userAnswer.trim().length === 0) {
    return false;
  }

  const answerLower = userAnswer.toLowerCase().trim();
  
  // Check if answer contains any low knowledge phrases
  for (const phrase of lowKnowledgePhrases) {
    const phraseLower = phrase.toLowerCase().trim();
    
    // Check for exact phrase match
    if (answerLower === phraseLower) {
      return true;
    }
    
    // Check if answer contains the phrase as a whole word/phrase
    // This handles cases like "I don't know about this" matching "i don't know"
    const phraseWords = phraseLower.split(/\s+/);
    if (phraseWords.length === 1) {
      // Single word - check if it appears as a word boundary
      const wordRegex = new RegExp(`\\b${phraseLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (wordRegex.test(answerLower)) {
        return true;
      }
    } else {
      // Multi-word phrase - check if all words appear in order
      // More flexible: check if answer contains the key words
      const keyWords = phraseWords.filter(w => w.length > 2); // Filter out short words like "i", "a"
      if (keyWords.length > 0) {
        let allWordsFound = true;
        let lastIndex = -1;
        for (const word of keyWords) {
          const wordIndex = answerLower.indexOf(word, lastIndex + 1);
          if (wordIndex === -1) {
            allWordsFound = false;
            break;
          }
          lastIndex = wordIndex;
        }
        if (allWordsFound) {
          return true;
        }
      }
      
      // Also check simple contains for phrases
      if (answerLower.includes(phraseLower)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Compare user answer with expected answers
 * Returns a score from 0-100 based on keyword matches
 */
export function evaluateAnswer(
  userAnswer: string,
  expectedAnswers: string[] | undefined,
  expectedSummary: string | undefined,
  keywords: string[]
): { score: number; feedback: string; isLowKnowledge: boolean } {
  if (!userAnswer || userAnswer.trim().length === 0) {
    return {
      score: 0,
      feedback: 'No answer provided.',
      isLowKnowledge: false,
    };
  }

  const answerLower = userAnswer.toLowerCase();
  let score = 0;
  let matchedKeywords: string[] = [];

  // Check for keyword matches (40% of score)
  keywords.forEach(keyword => {
    if (answerLower.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
      score += 40 / keywords.length; // Distribute points across keywords
    }
  });

  // Check for expected answer matches (60% of score)
  if (expectedAnswers && expectedAnswers.length > 0) {
    // Legacy format with array of expected answers
    expectedAnswers.forEach(expected => {
      const expectedLower = expected.toLowerCase();
      // Check if user answer contains key phrases from expected answer
      const expectedWords = expectedLower.split(/\s+/).filter(w => w.length > 3);
      const matchedWords = expectedWords.filter(word => answerLower.includes(word));
      
      if (matchedWords.length > 0) {
        const matchRatio = matchedWords.length / expectedWords.length;
        if (matchRatio > 0.3) { // At least 30% of key words match
          score += (60 / expectedAnswers.length) * matchRatio;
        }
      }
    });
  } else if (expectedSummary) {
    // New format with single expected summary
    const expectedLower = expectedSummary.toLowerCase();
    const expectedWords = expectedLower.split(/\s+/).filter(w => w.length > 3);
    const matchedWords = expectedWords.filter(word => answerLower.includes(word));
    
    if (matchedWords.length > 0) {
      const matchRatio = matchedWords.length / expectedWords.length;
      score += 60 * matchRatio;
    }
  }

  // Cap score at 100
  score = Math.min(100, Math.round(score));

  // Generate feedback
  let feedback = '';
  if (score >= 80) {
    feedback = 'Excellent answer! You covered the key points well.';
  } else if (score >= 60) {
    feedback = 'Good answer! You mentioned some relevant points.';
  } else if (score >= 40) {
    feedback = 'Your answer is on the right track, but could be more detailed.';
  } else {
    feedback = 'Consider reviewing this topic. Your answer missed some key concepts.';
  }

  if (matchedKeywords.length > 0) {
    feedback += ` You mentioned: ${matchedKeywords.slice(0, 3).join(', ')}.`;
  }

  return { score, feedback, isLowKnowledge: false };
}

/**
 * Get next question based on keywords in user's answer (keyword-based routing)
 * If no keywords match, falls back to defaultNext/defaultNextQuestionId or sequential order
 * Also handles low knowledge detection
 */
export function getNextQuestionByKeywords(
  domain: string,
  level: string,
  currentQuestionId: number,
  userAnswer: string
): { question: Question | null; isLowKnowledge: boolean; lowKnowledgeReply?: string } {
  const questions = getQuestions(domain, level);
  const currentQuestion = questions.find(q => q.id === currentQuestionId);
  
  if (!currentQuestion) {
    return { question: null, isLowKnowledge: false };
  }

  // Check for low knowledge phrases first
  const isLowKnowledge = checkLowKnowledge(userAnswer, currentQuestion.lowKnowledgePhrases);
  
  if (isLowKnowledge && currentQuestion.systemReplyOnLowKnowledge) {
    // If low knowledge detected, use defaultNext or continue sequentially
    const defaultNextId = currentQuestion.defaultNext !== undefined 
      ? currentQuestion.defaultNext 
      : currentQuestion.defaultNextQuestionId;
    
    if (defaultNextId !== null && defaultNextId !== undefined) {
      const nextQuestion = questions.find(q => q.id === defaultNextId);
      if (nextQuestion) {
        console.log(`[InterviewService] Low knowledge detected, routing to default: Question ${defaultNextId}`);
        return {
          question: nextQuestion,
          isLowKnowledge: true,
          lowKnowledgeReply: currentQuestion.systemReplyOnLowKnowledge,
        };
      }
    } else {
      // If defaultNext is null, interview ends
      console.log(`[InterviewService] Low knowledge detected, interview ending`);
      return {
        question: null,
        isLowKnowledge: true,
        lowKnowledgeReply: currentQuestion.systemReplyOnLowKnowledge,
      };
    }
  }

  // Use routing (new format) or routeKeywords (legacy format)
  const routingMap = currentQuestion.routing || currentQuestion.routeKeywords;
  
  if (routingMap && userAnswer) {
    const answerLower = userAnswer.toLowerCase();
    const matchedKeywords: Array<{ keyword: string; questionId: number }> = [];

    // Check each route keyword
    for (const [keyword, questionId] of Object.entries(routingMap)) {
      // Check if keyword appears in the answer (case-insensitive, whole word or phrase)
      const keywordLower = keyword.toLowerCase();
      // Match whole word or phrase
      const keywordRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (keywordRegex.test(answerLower) || answerLower.includes(keywordLower)) {
        matchedKeywords.push({ keyword, questionId });
      }
    }

    // If keywords matched, find the question with the highest priority (first match)
    if (matchedKeywords.length > 0) {
      // Get the first matched keyword's question (you can implement priority logic here)
      const targetQuestionId = matchedKeywords[0].questionId;
      const nextQuestion = questions.find(q => q.id === targetQuestionId);
      
      if (nextQuestion) {
        console.log(`[InterviewService] Keyword-based routing: "${matchedKeywords[0].keyword}" -> Question ${targetQuestionId}`);
        return { question: nextQuestion, isLowKnowledge: false };
      }
    }
  }

  // Fallback to defaultNext (new format) or defaultNextQuestionId (legacy format)
  // Only use defaultNext if it's explicitly set (not null, not undefined)
  let defaultNextId: number | null | undefined = undefined;
  
  if (currentQuestion.defaultNext !== undefined) {
    // New format: defaultNext can be null (explicit end) or a number
    defaultNextId = currentQuestion.defaultNext;
  } else if (currentQuestion.defaultNextQuestionId !== undefined) {
    // Legacy format
    defaultNextId = currentQuestion.defaultNextQuestionId;
  }
  
  if (defaultNextId !== null && defaultNextId !== undefined) {
    const defaultQuestion = questions.find(q => q.id === defaultNextId);
    if (defaultQuestion) {
      console.log(`[InterviewService] Using defaultNext: ${defaultNextId}`);
      return { question: defaultQuestion, isLowKnowledge: false };
    } else {
      console.warn(`[InterviewService] defaultNext question ${defaultNextId} not found, falling back to sequential`);
    }
  } else if (defaultNextId === null) {
    // Explicitly set to null means end interview
    console.log(`[InterviewService] defaultNext is null, interview ending`);
    return { question: null, isLowKnowledge: false };
  }

  // Final fallback: sequential order
  const nextQuestion = getNextQuestion(domain, level, currentQuestionId);
  return { question: nextQuestion, isLowKnowledge: false };
}

/**
 * Get next question in sequence (fallback method)
 */
export function getNextQuestion(
  domain: string,
  level: string,
  currentQuestionId: number
): Question | null {
  const questions = getQuestions(domain, level);
  const currentIndex = questions.findIndex(q => q.id === currentQuestionId);
  
  if (currentIndex === -1 || currentIndex === questions.length - 1) {
    return null; // No more questions
  }
  
  return questions[currentIndex + 1];
}

/**
 * Get first question for domain and level
 */
export function getFirstQuestion(domain: string, level: string): Question | null {
  const questions = getQuestions(domain, level);
  return questions.length > 0 ? questions[0] : null;
}

/**
 * Get greeting message for interview
 */
export function getGreetingMessage(userName?: string, domain?: string, level?: string): string {
  const name = userName ? ` ${userName}` : '';
  const domainText = domain ? ` for the ${domain} position` : '';
  const levelText = level ? ` at ${level} level` : '';
  
  return `Hello${name}! Welcome to your technical interview practice session${domainText}${levelText}. I'll be asking you some questions today. Let's begin!`;
}


