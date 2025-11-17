import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Question {
  id: number;
  question: string;
  expectedAnswers: string[];
  keywords: string[];
  followUp?: string;
  routeKeywords?: { [keyword: string]: number }; // Maps keywords to next question IDs
  defaultNextQuestionId?: number; // Default next question if no keywords match
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
 * Compare user answer with expected answers
 * Returns a score from 0-100 based on keyword matches
 */
export function evaluateAnswer(
  userAnswer: string,
  expectedAnswers: string[],
  keywords: string[]
): { score: number; feedback: string } {
  if (!userAnswer || userAnswer.trim().length === 0) {
    return {
      score: 0,
      feedback: 'No answer provided.',
    };
  }

  const answerLower = userAnswer.toLowerCase();
  let score = 0;
  let matchedKeywords: string[] = [];
  let matchedExpected: string[] = [];

  // Check for keyword matches (40% of score)
  keywords.forEach(keyword => {
    if (answerLower.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
      score += 40 / keywords.length; // Distribute points across keywords
    }
  });

  // Check for expected answer matches (60% of score)
  expectedAnswers.forEach(expected => {
    const expectedLower = expected.toLowerCase();
    // Check if user answer contains key phrases from expected answer
    const expectedWords = expectedLower.split(/\s+/).filter(w => w.length > 3);
    const matchedWords = expectedWords.filter(word => answerLower.includes(word));
    
    if (matchedWords.length > 0) {
      const matchRatio = matchedWords.length / expectedWords.length;
      if (matchRatio > 0.3) { // At least 30% of key words match
        matchedExpected.push(expected);
        score += (60 / expectedAnswers.length) * matchRatio;
      }
    }
  });

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

  return { score, feedback };
}

/**
 * Get next question based on keywords in user's answer (keyword-based routing)
 * If no keywords match, falls back to defaultNextQuestionId or sequential order
 */
export function getNextQuestionByKeywords(
  domain: string,
  level: string,
  currentQuestionId: number,
  userAnswer: string
): Question | null {
  const questions = getQuestions(domain, level);
  const currentQuestion = questions.find(q => q.id === currentQuestionId);
  
  if (!currentQuestion) {
    return null;
  }

  // If routeKeywords exist, check user's answer for matching keywords
  if (currentQuestion.routeKeywords && userAnswer) {
    const answerLower = userAnswer.toLowerCase();
    const matchedKeywords: Array<{ keyword: string; questionId: number }> = [];

    // Check each route keyword
    for (const [keyword, questionId] of Object.entries(currentQuestion.routeKeywords)) {
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
        return nextQuestion;
      }
    }
  }

  // Fallback to defaultNextQuestionId if specified
  if (currentQuestion.defaultNextQuestionId !== undefined) {
    const defaultQuestion = questions.find(q => q.id === currentQuestion.defaultNextQuestionId);
    if (defaultQuestion) {
      console.log(`[InterviewService] Using defaultNextQuestionId: ${currentQuestion.defaultNextQuestionId}`);
      return defaultQuestion;
    }
  }

  // Final fallback: sequential order
  return getNextQuestion(domain, level, currentQuestionId);
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

