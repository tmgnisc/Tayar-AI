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
 * Abusive/negative phrases that indicate inappropriate language
 */
const ABUSIVE_PHRASES = [
  'i am angry',
  'you are bad',
  'you are stupid',
  'you are dumb',
  'you are wrong',
  'this is bad',
  'this is stupid',
  'this is dumb',
  'i hate',
  'you suck',
  'this sucks',
  'you are terrible',
  'this is terrible',
  'you are awful',
  'this is awful',
  'you are useless',
  'this is useless',
  'i am frustrated with you',
  'you are annoying',
  'this is annoying',
  'you are wrong',
  'you don\'t know',
  'you are not good',
  'this is not good',
];

/**
 * Check if answer contains profanity or abusive language
 */
export function checkProfanity(userAnswer: string): boolean {
  if (!userAnswer) return false;
  
  const answerLower = userAnswer.toLowerCase().trim();
  
  // Check for profanity words
  for (const word of PROFANITY_WORDS) {
    // Check for whole word match
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordRegex.test(answerLower)) {
      return true;
    }
  }
  
  // Check for abusive phrases
  for (const phrase of ABUSIVE_PHRASES) {
    if (answerLower.includes(phrase)) {
      return true;
    }
  }
  
  // Check for patterns like "you are [negative word]" or "this is [negative word]"
  const negativePatterns = [
    /you are (bad|stupid|dumb|wrong|terrible|awful|useless|annoying|not good)/i,
    /this is (bad|stupid|dumb|wrong|terrible|awful|useless|annoying|not good)/i,
    /i (hate|am angry|am frustrated)/i,
  ];
  
  for (const pattern of negativePatterns) {
    if (pattern.test(answerLower)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if answer is off-topic based on keywords
 * Returns true if answer doesn't contain ANY keywords from the question
 * OR if it contains abusive/negative phrases that don't relate to the question
 * (except for very short answers or low knowledge phrases)
 */
export function checkOffTopic(
  userAnswer: string,
  questionKeywords: string[],
  domainKeywords?: string[]
): boolean {
  if (!userAnswer || !questionKeywords || questionKeywords.length === 0) {
    return false;
  }

  const answerLower = userAnswer.toLowerCase().trim();
  const answerWords = answerLower.split(/\s+/).filter(w => w.length > 2);
  
  // Check for abusive/negative phrases first - these are always off-topic
  // Use regex patterns that allow words in between (e.g., "i am very angry" matches "i am.*angry")
  const abusiveOffTopicPatterns = [
    /i\s+am\s+.*angry/i,              // "i am angry", "i am very angry", "i am so angry"
    /i\s+am\s+.*frustrated/i,         // "i am frustrated", "i am very frustrated"
    /i\s+am\s+.*bored/i,              // "i am bored", "i am very bored"
    /you\s+are\s+.*(bad|stupid|dumb|wrong|terrible|awful|useless|annoying|boring|pointless)/i,
    /this\s+is\s+.*(bad|stupid|dumb|wrong|terrible|awful|useless|annoying|boring|pointless)/i,
    /i\s+hate/i,                      // "i hate", "i hate this"
    /you\s+suck/i,
    /this\s+sucks/i,
    /you\s+don'?t\s+know/i,
    /you\s+are\s+not\s+good/i,
    /this\s+is\s+not\s+good/i,
    /i\s+don'?t\s+like/i,
  ];
  
  // Check if answer matches any abusive/negative patterns
  for (const pattern of abusiveOffTopicPatterns) {
    if (pattern.test(answerLower)) {
      console.log(`[checkOffTopic] ✅ Detected abusive/negative pattern: ${pattern}`);
      // Even if it contains keywords, if it has abusive phrases, it's off-topic
      return true;
    }
  }
  
  // For 2-word answers, check if they contain keywords - if not, likely off-topic
  // (e.g., "Tera Tower" has no HTML keywords, so it's off-topic)
  if (answerWords.length === 2) {
    let hasKeyword = false;
    for (const keyword of questionKeywords) {
      const keywordLower = keyword.toLowerCase().trim();
      if (answerLower.includes(keywordLower)) {
        hasKeyword = true;
        break;
      }
    }
    if (!hasKeyword) {
      console.log(`[checkOffTopic] ✅ 2-word answer with no keywords detected as off-topic`);
      return true;
    }
  }
  
  // Very short answers (1 word) might be brief but valid - don't mark as off-topic
  if (answerWords.length <= 1) {
    return false;
  }
  
  // Check if answer contains ANY relevant keywords from the question
  let relevantKeywordsFound = 0;
  const matchedKeywords: string[] = [];
  
  for (const keyword of questionKeywords) {
    const keywordLower = keyword.toLowerCase().trim();
    
    // Check for whole word match (more strict)
    const keywordRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (keywordRegex.test(answerLower)) {
      relevantKeywordsFound++;
      matchedKeywords.push(keyword);
      break; // Found at least one keyword, that's enough
    }
    
    // Also check for partial match (for multi-word keywords like "virtual dom")
    if (keywordLower.includes(' ') && answerLower.includes(keywordLower)) {
      relevantKeywordsFound++;
      matchedKeywords.push(keyword);
      break;
    }
  }
  
  console.log(`[checkOffTopic] Answer: "${userAnswer}"`);
  console.log(`[checkOffTopic] Answer words count: ${answerWords.length}`);
  console.log(`[checkOffTopic] Question keywords: ${questionKeywords.join(', ')}`);
  console.log(`[checkOffTopic] Keywords found: ${matchedKeywords.join(', ') || 'none'}`);
  console.log(`[checkOffTopic] Relevant keywords found: ${relevantKeywordsFound}`);
  
  // If answer has 3+ words but contains NO keywords from the question, it's off-topic
  // This works for any language - if no keywords match, it's off-topic
  if (answerWords.length >= 3 && relevantKeywordsFound === 0) {
    console.log(`[checkOffTopic] ✅ Marked as off-topic: Answer has ${answerWords.length} words but no keywords matched`);
    // Exception: Don't mark low knowledge phrases as off-topic (they're handled separately)
    const lowKnowledgeIndicators = [
      "i don't know",
      "sorry",
      "i haven't read",
      "i haven't studied",
      "i haven't done",
      "not sure",
      "no idea",
      "i don't understand",
      "can you explain",
      "what do you mean",
    ];
    
    for (const indicator of lowKnowledgeIndicators) {
      if (answerLower.includes(indicator)) {
        // This is a low knowledge response, not off-topic
        return false;
      }
    }
    
    // If it's a substantial answer (3+ words) with no keywords, it's off-topic
    return true;
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
  userAnswer: string,
  interviewId?: number
): { question: Question | null; isLowKnowledge: boolean; lowKnowledgeReply?: string } {
  // Use shuffled questions if interviewId is provided, otherwise use all questions
  const questions = interviewId !== undefined 
    ? getShuffledQuestions(domain, level, interviewId, 4)
    : getQuestions(domain, level);
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
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get shuffled questions for interview (selects 4 random questions)
 * Stores the selected questions in a cache keyed by interview ID
 */
const interviewQuestionCache = new Map<number, Question[]>();

export function getShuffledQuestions(domain: string, level: string, interviewId: number, maxQuestions: number = 4): Question[] {
  const allQuestions = getQuestions(domain, level);
  
  if (allQuestions.length === 0) {
    return [];
  }
  
  // If we already have cached questions for this interview, return them
  if (interviewQuestionCache.has(interviewId)) {
    return interviewQuestionCache.get(interviewId)!;
  }
  
  // Shuffle all questions and take the first maxQuestions
  const shuffled = shuffleArray(allQuestions);
  const selectedQuestions = shuffled.slice(0, Math.min(maxQuestions, shuffled.length));
  
  // Keep original IDs for routing to work correctly
  // Cache the selected questions for this interview
  interviewQuestionCache.set(interviewId, selectedQuestions);
  
  console.log(`[InterviewService] Selected ${selectedQuestions.length} questions for interview ${interviewId} from ${allQuestions.length} total questions`);
  console.log(`[InterviewService] Selected question IDs: ${selectedQuestions.map(q => q.id).join(', ')}`);
  
  return selectedQuestions;
}

/**
 * Clear cached questions for an interview (call when interview ends)
 */
export function clearInterviewQuestions(interviewId: number): void {
  interviewQuestionCache.delete(interviewId);
}

/**
 * Get first question for domain and level (uses shuffled questions if interviewId provided)
 */
export function getFirstQuestion(domain: string, level: string, interviewId?: number): Question | null {
  if (interviewId !== undefined) {
    const shuffledQuestions = getShuffledQuestions(domain, level, interviewId, 4);
    return shuffledQuestions.length > 0 ? shuffledQuestions[0] : null;
  }
  
  // Fallback to original behavior if no interviewId
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


