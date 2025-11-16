import OpenAI from 'openai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

/**
 * Get all available OpenAI API keys from environment variables
 */
function getAllApiKeys(): string[] {
  const keys: string[] = [];
  
  // Check for single key first
  if (process.env.OPENAI_API_KEY) {
    keys.push(process.env.OPENAI_API_KEY);
  }
  
  // Check for multiple keys (OPENAI_API_KEY_1, OPENAI_API_KEY_2, etc.)
  let index = 1;
  while (process.env[`OPENAI_API_KEY_${index}`]) {
    keys.push(process.env[`OPENAI_API_KEY_${index}`]!);
    index++;
  }
  
  // Also check for comma-separated keys
  if (process.env.OPENAI_API_KEYS) {
    const commaSeparatedKeys = process.env.OPENAI_API_KEYS.split(',').map(k => k.trim()).filter(k => k);
    keys.push(...commaSeparatedKeys);
  }
  
  // Remove duplicates
  return [...new Set(keys.filter(k => k && k.trim() !== ''))];
}

const ALL_API_KEYS = getAllApiKeys();
let currentKeyIndex = 0;

if (ALL_API_KEYS.length === 0) {
  console.warn('⚠️  No OPENAI_API_KEY found in environment variables');
} else {
  console.log(`✅ Loaded ${ALL_API_KEYS.length} OpenAI API key(s)`);
  ALL_API_KEYS.forEach((key, index) => {
    console.log(`   Key ${index + 1}: ${key.substring(0, 10)}...`);
  });
}

/**
 * Get the next API key in rotation
 */
function getNextApiKey(): string {
  if (ALL_API_KEYS.length === 0) {
    throw new Error('No OpenAI API keys configured');
  }
  
  const key = ALL_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % ALL_API_KEYS.length;
  return key;
}

/**
 * Get current API key (without rotating)
 */
function getCurrentApiKey(): string {
  if (ALL_API_KEYS.length === 0) {
    throw new Error('No OpenAI API keys configured');
  }
  return ALL_API_KEYS[currentKeyIndex];
}

interface InterviewContext {
  role: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  language: string;
  userName?: string;
  domainName?: string;
  domainDescription?: string;
}

/**
 * Generate interview system prompt based on role and difficulty
 * (Reusing the same prompt generation logic from Gemini)
 */
export function generateInterviewPrompt(context: InterviewContext): string {
  const { role, difficulty, language, userName, domainName, domainDescription } = context;
  
  const domain = domainName || role;
  const domainDesc = domainDescription || '';
  
  const roleDescriptions: Record<string, string> = {
    'frontend': 'Frontend Developer specializing in React, TypeScript, and modern web technologies',
    'backend': 'Backend Developer specializing in Node.js, databases, and API design',
    'full-stack': 'Full Stack Developer with expertise in both frontend and backend technologies',
    'full stack': 'Full Stack Developer with expertise in both frontend and backend technologies',
    'mern': 'MERN Stack Developer (MongoDB, Express, React, Node.js)',
    'devops': 'DevOps Engineer specializing in CI/CD, cloud infrastructure, and automation',
  };

  const roleDescription = domainDesc 
    ? `${domain} Specialist${domainDesc ? `: ${domainDesc}` : ''}`
    : (roleDescriptions[domain.toLowerCase()] || `Technical role in ${domain}`);

  const difficultyGuidelines: Record<string, string> = {
    beginner: `For BEGINNER level candidates, focus on:
- Fundamental concepts and basic knowledge
- Simple problem-solving scenarios
- Clear, encouraging feedback
- Questions should test basic understanding, not deep expertise
- Use simpler terminology and avoid overly complex scenarios
- Provide hints when appropriate`,
    
    intermediate: `For INTERMEDIATE level candidates, focus on:
- Practical experience and real-world scenarios
- Problem-solving with moderate complexity
- Code examples and architecture discussions
- Questions should test applied knowledge and experience
- Include some best practices and common patterns
- Balance between fundamentals and advanced concepts`,
    
    advanced: `For ADVANCED level candidates, focus on:
- Complex problem-solving and system design
- Architecture and scalability considerations
- Leadership and mentoring experience
- Deep technical knowledge and expertise
- Challenging scenarios requiring analytical thinking
- Best practices, trade-offs, and decision-making`,
    
    expert: `For EXPERT level candidates, focus on:
- System architecture and large-scale design
- Technical leadership and strategy
- Innovation and cutting-edge technologies
- Complex trade-offs and decision-making
- Mentoring and team development
- Industry trends and future technologies`,
  };

  const difficultyGuideline = difficultyGuidelines[difficulty] || difficultyGuidelines.intermediate;

  return `You are an expert technical interviewer conducting a professional ${difficulty} level interview for a ${roleDescription} position.

CANDIDATE PROFILE:
- Domain: ${domain}
${domainDesc ? `- Domain Description: ${domainDesc}` : ''}
- Experience Level: ${difficulty}
${userName ? `- Name: ${userName}` : ''}

${difficultyGuideline}

CRITICAL INTERVIEW INSTRUCTIONS:
1. **YOU MUST SPEAK FIRST** - When the call starts, you will automatically greet the user with the first message. Immediately after greeting, ask your first question. Do not wait for the user to speak first. You are the interviewer - you lead the conversation.

2. **Ask questions immediately** - As soon as the call connects, greet the user and ask your first question. Be proactive and take control of the conversation from the start.

3. **Generate and ask 5-8 specific questions** related to:
   - ${domain} fundamentals and core concepts
   - Real-world scenarios in ${domain}
   - Problem-solving specific to ${domain}
   - Technologies and tools used in ${domain}
   - Best practices in ${domain}
   ${difficulty !== 'beginner' ? `- System design and architecture (for ${domain})` : ''}
   ${difficulty === 'expert' || difficulty === 'advanced' ? `- Leadership and mentoring in ${domain}` : ''}

4. **Question generation strategy:**
   - Generate questions dynamically based on the conversation
   - Ask follow-up questions based on the candidate's answers
   - Vary question types: conceptual, practical, problem-solving, scenario-based
   - Make questions appropriate for ${difficulty} level
   - Focus specifically on ${domain} knowledge and skills

5. **After each answer:**
   - Acknowledge their response: "Thank you for that answer" or "That's interesting"
   - Provide brief, constructive feedback when appropriate
   - Immediately ask the next question or a follow-up question
   - Keep the conversation flowing naturally without long pauses

6. **Conversation flow:**
   - After the user answers, wait 1-2 seconds, then ask the next question
   - Don't wait for the user to continue - you control the flow
   - Transition smoothly between topics
   - After 5-8 questions, wrap up the interview

7. **End the interview:**
   - After asking all questions, say: "Thank you for your time today. Do you have any questions for me?"
   - Provide a brief, encouraging summary: "You demonstrated good understanding of [topic]. Keep practicing and you'll continue to improve."
   - End with: "Thank you for participating in this practice interview. Good luck with your job search!"

CONVERSATION STYLE:
- Be professional but friendly and encouraging
- Speak clearly and at a moderate pace
- Allow the candidate 2-3 seconds to think before answering
- Provide positive reinforcement: "That's a good point", "I see", "Interesting approach"
- Be specific in feedback: "Good explanation of X, let me ask you about Y"
- Use technical terminology appropriate for ${difficulty} level in ${domain}

REMEMBER:
- You are conducting a REAL interview - ask questions actively
- Generate questions on the fly based on ${domain} and ${difficulty} level
- Don't just respond - LEAD the conversation with questions
- This is a practice interview to help the candidate improve
- Be supportive while maintaining professional standards
- Focus specifically on ${domain} knowledge and skills`;
}

/**
 * Start interview conversation - get the first question
 */
export async function startInterviewConversation(
  context: InterviewContext,
  systemPrompt?: string
): Promise<{ message: string; conversationId: string }> {
  const prompt = systemPrompt || generateInterviewPrompt(context);
  
  // Create initial greeting and first question
  const userMessage = `Now, greet the candidate and ask your first question. Keep your response concise (2-3 sentences max) - just a brief greeting and the first question.`;

  // Try each API key until one works
  const maxKeyAttempts = ALL_API_KEYS.length;
  let lastKeyError: any = null;
  
  for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
    try {
      const apiKey = getNextApiKey();
      const keyNumber = ((currentKeyIndex - 1 + ALL_API_KEYS.length) % ALL_API_KEYS.length) + 1;
      console.log(`[OpenAI] Trying API key ${keyNumber}/${ALL_API_KEYS.length} (${apiKey.substring(0, 10)}...)`);
      
      const openai = new OpenAI({ apiKey });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Using free tier model
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 200, // Keep responses concise for voice
      });
      
      const message = completion.choices[0]?.message?.content || 'Hello! Let\'s begin the interview.';
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`[OpenAI] ✅ Successfully used key ${keyNumber}`);
      
      return { message, conversationId };
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const errorStatus = error.status || error.response?.status;
      
      console.log(`[OpenAI] Key ${keyNumber} failed:`, errorMsg.substring(0, 150));
      
      // Check if it's a quota/key error - try next key
      if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('rate limit') || 
          errorStatus === 429 || errorStatus === 401 || (errorStatus === 403 && errorMsg.includes('api'))) {
        console.log(`[OpenAI] ⚠️  Key ${keyNumber} quota/key error, rotating to next key...`);
        lastKeyError = error;
        continue;
      }
      
      // Other errors - throw immediately
      throw new Error(`Failed to start interview: ${error.message}`);
    }
  }
  
  // All keys exhausted
  throw new Error(`All OpenAI API keys exhausted. Last error: ${lastKeyError?.message || 'Unknown error'}. Please check your API keys or wait for quota reset.`);
}

/**
 * Continue interview conversation - process answer and get next question
 */
export async function continueInterviewConversation(
  context: InterviewContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
  systemPrompt?: string
): Promise<string> {
  const prompt = systemPrompt || generateInterviewPrompt(context);
  
  // Build conversation history for OpenAI
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: prompt },
  ];
  
  // Add conversation history (last 10 messages)
  conversationHistory.slice(-10).forEach(msg => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  });

  // Try each API key until one works
  const maxKeyAttempts = ALL_API_KEYS.length;
  let lastKeyError: any = null;
  
  for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
    try {
      const apiKey = getNextApiKey();
      const keyNumber = ((currentKeyIndex - 1 + ALL_API_KEYS.length) % ALL_API_KEYS.length) + 1;
      
      const openai = new OpenAI({ apiKey });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 200, // Keep responses concise for voice
      });
      
      const message = completion.choices[0]?.message?.content || 'Please continue.';
      console.log(`[OpenAI] ✅ Key ${keyNumber} used for continue conversation`);
      
      return message;
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const errorStatus = error.status || error.response?.status;
      
      // Check if it's a quota/key error - try next key
      if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('rate limit') || 
          errorStatus === 429 || errorStatus === 401 || (errorStatus === 403 && errorMsg.includes('api'))) {
        console.log(`[OpenAI] ⚠️  Key ${keyNumber} failed, rotating to next key...`);
        lastKeyError = error;
        continue;
      }
      
      // Other errors - throw immediately
      throw new Error(`Failed to continue interview: ${error.message}`);
    }
  }
  
  // All keys exhausted
  throw new Error(`All OpenAI API keys exhausted. Last error: ${lastKeyError?.message || 'Unknown error'}. Please check your API keys or wait for quota reset.`);
}

/**
 * Generate interview feedback and scoring
 */
export async function generateInterviewFeedback(
  conversationTranscript: string,
  context: InterviewContext
): Promise<{
  overallScore: number;
  feedback: Array<{ category: string; score: number; comment: string }>;
  summary: string;
}> {
  try {
    const apiKey = getCurrentApiKey();
    const openai = new OpenAI({ apiKey });
    
    const prompt = `You are an expert technical interviewer analyzing an interview transcript. Please provide detailed feedback.

Interview Context:
- Role: ${context.role}
- Difficulty Level: ${context.difficulty}
- Language: ${context.language}

Interview Transcript:
${conversationTranscript}

Please provide:
1. An overall score (0-100) based on technical knowledge, communication, and problem-solving
2. Detailed feedback for each category:
   - Technical Knowledge (0-100)
   - Problem Solving (0-100)
   - Communication (0-100)
   - Code Quality/Approach (0-100)
3. A comprehensive summary highlighting strengths and areas for improvement

Format your response as JSON:
{
  "overallScore": number,
  "feedback": [
    {
      "category": "string",
      "score": number,
      "comment": "string"
    }
  ],
  "summary": "string"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that provides structured JSON responses.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });
    
    const text = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(text);
    
    return {
      overallScore: result.overallScore || 75,
      feedback: result.feedback || [],
      summary: result.summary || 'Overall good performance. Continue practicing and building on your strengths.',
    };
  } catch (error: any) {
    console.error('Error generating feedback:', error);
    throw new Error(`Failed to generate interview feedback: ${error.message}`);
  }
}

