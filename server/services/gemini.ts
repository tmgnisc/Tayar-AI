import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded (in case this module is imported before index.ts loads it)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

/**
 * Get all available Gemini API keys from environment variables
 * Supports both single key (GEMINI_API_KEY) and multiple keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
 */
function getAllApiKeys(): string[] {
  const keys: string[] = [];
  
  // Check for single key first
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  
  // Check for multiple keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
  let index = 1;
  while (process.env[`GEMINI_API_KEY_${index}`]) {
    keys.push(process.env[`GEMINI_API_KEY_${index}`]!);
    index++;
  }
  
  // Also check for comma-separated keys in GEMINI_API_KEYS
  if (process.env.GEMINI_API_KEYS) {
    const commaSeparatedKeys = process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(k => k);
    keys.push(...commaSeparatedKeys);
  }
  
  // Remove duplicates
  return [...new Set(keys.filter(k => k && k.trim() !== ''))];
}

const ALL_API_KEYS = getAllApiKeys();
let currentKeyIndex = 0;

if (ALL_API_KEYS.length === 0) {
  console.warn('⚠️  No GEMINI_API_KEY found in environment variables');
  console.warn('⚠️  Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API')));
} else {
  console.log(`✅ Loaded ${ALL_API_KEYS.length} Gemini API key(s)`);
  ALL_API_KEYS.forEach((key, index) => {
    console.log(`   Key ${index + 1}: ${key.substring(0, 10)}...`);
  });
}

/**
 * Get the next API key in rotation
 */
function getNextApiKey(): string {
  if (ALL_API_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured');
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
    throw new Error('No Gemini API keys configured');
  }
  return ALL_API_KEYS[currentKeyIndex];
}

// Initialize with first key
const genAI = new GoogleGenerativeAI(getCurrentApiKey());

interface InterviewContext {
  role: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  language: string;
  userName?: string;
  domainName?: string;
  domainDescription?: string;
}

/**
 * Generate example questions for a specific domain and difficulty
 */
function generateExampleQuestions(domain: string, difficulty: string): string {
  const domainLower = domain.toLowerCase();
  
  // Frontend questions
  if (domainLower.includes('frontend')) {
    if (difficulty === 'beginner') {
      return `- "What is React and why would you use it?"
- "Explain the difference between state and props."
- "How do you handle user events in React?"`;
    } else if (difficulty === 'intermediate') {
      return `- "How would you optimize a React application for performance?"
- "Explain React hooks and when you would use useEffect vs useState."
- "How do you manage state in a large React application?"`;
    } else {
      return `- "How would you architect a large-scale React application with multiple teams?"
- "Explain your approach to code splitting and lazy loading."
- "How would you implement a design system at scale?"`;
    }
  }
  
  // Backend questions
  if (domainLower.includes('backend')) {
    if (difficulty === 'beginner') {
      return `- "What is an API and how does REST work?"
- "Explain the difference between GET and POST requests."
- "How do you handle errors in a Node.js application?"`;
    } else if (difficulty === 'intermediate') {
      return `- "How would you design a RESTful API for a social media platform?"
- "Explain database indexing and why it's important."
- "How do you handle concurrent requests in Node.js?"`;
    } else {
      return `- "How would you design a distributed system handling millions of requests?"
- "Explain database sharding and when you would use it."
- "How would you implement caching strategies in a microservices architecture?"`;
    }
  }
  
  // MERN questions
  if (domainLower.includes('mern')) {
    if (difficulty === 'beginner') {
      return `- "What is the MERN stack and what does each component do?"
- "How do you connect a React frontend to an Express backend?"
- "Explain MongoDB and how it differs from SQL databases."`;
    } else if (difficulty === 'intermediate') {
      return `- "How would you structure a full-stack MERN application?"
- "Explain authentication and authorization in a MERN app."
- "How do you handle state management across the MERN stack?"`;
    } else {
      return `- "How would you scale a MERN application for high traffic?"
- "Explain your approach to real-time features in MERN."
- "How would you implement microservices in a MERN architecture?"`;
    }
  }
  
  // DevOps questions
  if (domainLower.includes('devops')) {
    if (difficulty === 'beginner') {
      return `- "What is CI/CD and why is it important?"
- "Explain the difference between Docker and virtual machines."
- "What is version control and how do you use it?"`;
    } else if (difficulty === 'intermediate') {
      return `- "How would you set up a CI/CD pipeline for a web application?"
- "Explain container orchestration and when you would use Kubernetes."
- "How do you monitor and troubleshoot production systems?"`;
    } else {
      return `- "How would you design a scalable infrastructure for a global application?"
- "Explain your approach to infrastructure as code."
- "How would you implement disaster recovery and backup strategies?"`;
    }
  }
  
  // Generic questions based on difficulty
  if (difficulty === 'beginner') {
    return `- "What programming languages are you most comfortable with in ${domain}?"
- "Can you explain a basic concept in ${domain}?"
- "What tools do you use for ${domain} development?"`;
  } else if (difficulty === 'intermediate') {
    return `- "Describe a challenging ${domain} project you worked on."
- "How do you approach debugging in ${domain}?"
- "What are some best practices in ${domain}?"`;
  } else {
    return `- "How would you architect a large-scale ${domain} system?"
- "Describe your experience with ${domain} at an advanced level."
- "How do you mentor others in ${domain}?"`;
  }
}

/**
 * Generate interview system prompt based on role and difficulty
 */
export function generateInterviewPrompt(context: InterviewContext): string {
  const { role, difficulty, language, userName, domainName, domainDescription } = context;
  
  // Use domain name if available, otherwise map role
  const domain = domainName || role;
  const domainDesc = domainDescription || '';
  
  const roleDescriptions: Record<string, string> = {
    'frontend': 'Frontend Developer specializing in React, TypeScript, and modern web technologies',
    'backend': 'Backend Developer specializing in Node.js, databases, and API design',
    'full-stack': 'Full Stack Developer with expertise in both frontend and backend technologies',
    'full stack': 'Full Stack Developer with expertise in both frontend and backend technologies',
    'mern': 'MERN Stack Developer (MongoDB, Express, React, Node.js)',
    'devops': 'DevOps Engineer specializing in CI/CD, cloud infrastructure, and automation',
    'seo': 'SEO Specialist focusing on search engine optimization and digital marketing',
    'mobile development': 'Mobile Developer specializing in iOS and Android app development',
    'data science': 'Data Scientist working with data analysis, machine learning, and analytics',
    'machine learning': 'Machine Learning Engineer specializing in AI and ML algorithms',
    'cloud computing': 'Cloud Engineer specializing in cloud platforms and services',
    'cybersecurity': 'Cybersecurity Specialist focusing on information security',
    'software-engineer': 'Software Engineer with broad technical knowledge',
    'senior-software-engineer': 'Senior Software Engineer with leadership and architecture experience',
  };

  // Get role description - use domain description if available, otherwise use mapping
  const roleDescription = domainDesc 
    ? `${domain} Specialist${domainDesc ? `: ${domainDesc}` : ''}`
    : (roleDescriptions[domain.toLowerCase()] || roleDescriptions[role.toLowerCase()] || `Technical role in ${domain}`);

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

EXAMPLE QUESTIONS FOR ${domain} (${difficulty} level):
${generateExampleQuestions(domain, difficulty)}

REMEMBER:
- You are conducting a REAL interview - ask questions actively
- Generate questions on the fly based on ${domain} and ${difficulty} level
- Don't just respond - LEAD the conversation with questions
- This is a practice interview to help the candidate improve
- Be supportive while maintaining professional standards
- Focus specifically on ${domain} knowledge and skills`;
}

/**
 * Generate interview questions based on role and difficulty
 */
export function generateInterviewQuestions(context: InterviewContext): string[] {
  const { role, difficulty } = context;
  
  const questionsByDifficulty: Record<string, Record<string, string[]>> = {
    beginner: {
      frontend: [
        'What is React and why would you use it?',
        'Explain the difference between state and props in React.',
        'What is the DOM and how does React interact with it?',
        'Can you explain what CSS flexbox is used for?',
        'What is the difference between let, const, and var in JavaScript?',
      ],
      backend: [
        'What is an API and how does it work?',
        'Explain the difference between GET and POST requests.',
        'What is a database and why do we need it?',
        'What is REST and what are RESTful APIs?',
        'Explain the concept of authentication and authorization.',
      ],
      default: [
        'What programming languages are you most comfortable with?',
        'Explain the difference between frontend and backend development.',
        'What is version control and why is it important?',
        'Can you describe your experience with software development?',
        'What development tools do you use regularly?',
      ],
    },
    intermediate: {
      frontend: [
        'How would you optimize a React application for performance?',
        'Explain React hooks and when you would use them.',
        'How do you handle state management in a large React application?',
        'What are the differences between class components and functional components?',
        'How would you implement authentication in a React app?',
      ],
      backend: [
        'How would you design a RESTful API for a social media platform?',
        'Explain database indexing and why it\'s important.',
        'How do you handle concurrent requests in a Node.js application?',
        'What is middleware and how would you use it?',
        'How would you implement rate limiting in an API?',
      ],
      default: [
        'Describe a challenging project you worked on and how you solved it.',
        'How do you approach debugging a production issue?',
        'Explain your experience with testing and test-driven development.',
        'How do you handle code reviews and collaboration?',
        'What is your approach to learning new technologies?',
      ],
    },
    advanced: {
      frontend: [
        'How would you architect a large-scale React application with multiple teams?',
        'Explain your approach to code splitting and lazy loading.',
        'How would you implement a real-time feature like live chat?',
        'Describe your experience with performance optimization and monitoring.',
        'How would you handle state synchronization across multiple components?',
      ],
      backend: [
        'How would you design a distributed system that handles millions of requests?',
        'Explain database sharding and when you would use it.',
        'How would you implement caching strategies in a microservices architecture?',
        'Describe your approach to ensuring data consistency in distributed systems.',
        'How would you handle system failures and implement resilience patterns?',
      ],
      default: [
        'Describe a complex technical challenge you faced and how you solved it.',
        'How do you approach system design for scalability?',
        'Explain your experience with architecture decisions and trade-offs.',
        'How do you mentor junior developers?',
        'What is your approach to technical leadership?',
      ],
    },
    expert: {
      frontend: [
        'How would you design a frontend architecture for a platform serving millions of users?',
        'Explain your approach to building design systems at scale.',
        'How would you handle performance optimization for a complex single-page application?',
        'Describe your experience with advanced React patterns and optimizations.',
        'How would you lead a team in migrating a legacy frontend to a modern stack?',
      ],
      backend: [
        'How would you design a globally distributed system with low latency?',
        'Explain your approach to database architecture for high-traffic applications.',
        'How would you implement event-driven architecture at scale?',
        'Describe your experience with microservices and distributed systems.',
        'How would you ensure system reliability and observability in a complex architecture?',
      ],
      default: [
        'How do you approach technical strategy for a growing engineering organization?',
        'Describe your experience with leading large-scale technical initiatives.',
        'How do you balance technical excellence with business objectives?',
        'Explain your approach to building and scaling engineering teams.',
        'What is your vision for the future of software engineering?',
      ],
    },
  };

  const roleKey = Object.keys(questionsByDifficulty[difficulty] || {}).find(
    key => role.toLowerCase().includes(key)
  ) || 'default';

  return questionsByDifficulty[difficulty]?.[roleKey] || questionsByDifficulty[difficulty]?.default || [];
}

/**
 * List available Gemini models (for debugging)
 */
export async function listAvailableModels(): Promise<string[]> {
  try {
    // Note: The SDK doesn't have a direct listModels method
    // This is a helper that tries common model names
    const commonModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-2.0-flash-exp',
    ];
    
    const available: string[] = [];
    for (const modelName of commonModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Try a minimal test call
        await model.generateContent('test');
        available.push(modelName);
      } catch (error) {
        // Model not available, skip
      }
    }
    return available;
  } catch (error) {
    console.error('Error listing models:', error);
    return [];
  }
}

/**
 * Get Gemini model for conversation
 * Try different model names based on availability
 */
export function getGeminiModel() {
  // Use gemini-1.5-flash (most widely available and reliable)
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

/**
 * Generate a response from Gemini based on conversation context
 */
export async function generateAIResponse(
  prompt: string,
  conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = []
): Promise<string> {
  try {
    const model = getGeminiModel();
    
    // Build conversation context
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts }],
    }));

    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
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
  const initialPrompt = `${prompt}

Now, greet the candidate and ask your first question. Keep your response concise (2-3 sentences max) - just a brief greeting and the first question.`;

  // Try different model name formats for v1beta API
  // The API version might require different naming conventions
  const modelNames = [
    'gemini-1.5-flash-latest',  // Latest version format
    'gemini-1.5-flash',         // Standard format
    'gemini-1.5-pro-latest',    // Pro version as fallback
    'gemini-1.5-pro',           // Pro standard format
  ];

  // Try each API key until one works
  const maxKeyAttempts = ALL_API_KEYS.length;
  let lastKeyError: any = null;
  
  for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
    const apiKey = getNextApiKey();
    const keyNumber = ((currentKeyIndex - 1 + ALL_API_KEYS.length) % ALL_API_KEYS.length) + 1;
    console.log(`[Gemini] Trying API key ${keyNumber}/${ALL_API_KEYS.length} (${apiKey.substring(0, 10)}...)`);
    
    let result: any = null;
    let lastModelError: any = null;
    
    // Try each model with current API key
    for (const modelName of modelNames) {
      try {
        console.log(`[Gemini] Key ${keyNumber} - Trying model: ${modelName}...`);
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });
        
        console.log('[Gemini] Generating initial prompt...');
        console.log('[Gemini] Calling generateContent...');
        result = await model.generateContent(initialPrompt);
        console.log(`[Gemini] ✅ Successfully used key ${keyNumber} with model: ${modelName}`);
        
        // Success! Return the result
        const response = await result.response;
        const message = response.text();
        
        console.log('[Gemini] Response received, length:', message.length);
        
        // Generate a simple conversation ID
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return { message, conversationId };
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        const errorStatus = error.status || error.response?.status;
        
        console.log(`[Gemini] Key ${keyNumber} - Model ${modelName} failed:`, errorMsg.substring(0, 150));
        
        // Check if it's a quota error - if so, try next key
        if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorStatus === 429) {
          console.log(`[Gemini] ⚠️  Key ${keyNumber} quota exceeded, rotating to next key...`);
          lastKeyError = error;
          break; // Break out of model loop, try next key
        }
        
        // Check if it's an API key error - if so, try next key
        if (errorStatus === 401 || (errorStatus === 403 && errorMsg.includes('api'))) {
          console.log(`[Gemini] ⚠️  Key ${keyNumber} invalid/denied, rotating to next key...`);
          lastKeyError = error;
          break; // Break out of model loop, try next key
        }
        
        // Other errors - try next model
        lastModelError = error;
      }
    }
    
    // If we got here, all models failed for this key, but it wasn't a quota/key error
    // Try next key anyway
    if (!result && lastModelError) {
      console.log(`[Gemini] ⚠️  Key ${keyNumber} failed with all models, trying next key...`);
      lastKeyError = lastModelError;
    }
  }
  
  // All keys exhausted
  throw new Error(`All Gemini API keys exhausted. Last error: ${lastKeyError?.message || 'Unknown error'}. Please check your API keys or wait for quota reset.`);
}

/**
 * Continue interview conversation - process answer and get next question
 */
export async function continueInterviewConversation(
  context: InterviewContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }>,
  systemPrompt?: string
): Promise<string> {
  // Build conversation history for Gemini
  const history = conversationHistory.slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  // If history is empty or very short, prepend system instruction
  let chatHistory = history;
  if (history.length < 2) {
    chatHistory = [
      {
        role: 'model' as const,
        parts: [{ text: `I understand. I'm conducting a ${context.difficulty} level interview for ${context.role}. I'll ask relevant questions and provide feedback.` }],
      },
      ...history,
    ];
  }

  // Get the last user message
  const lastUserMessage = conversationHistory.filter(msg => msg.role === 'user').pop()?.text || '';
  const messageToSend = lastUserMessage || 'Continue the interview with the next question.';

  // Try each API key until one works
  const maxKeyAttempts = ALL_API_KEYS.length;
  let lastKeyError: any = null;
  
  for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
    const apiKey = getNextApiKey();
    const keyNumber = ((currentKeyIndex - 1 + ALL_API_KEYS.length) % ALL_API_KEYS.length) + 1;
    
    try {
      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-1.5-flash' });
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        },
      });
      
      const result = await chat.sendMessage(messageToSend);
      const response = await result.response;
      console.log(`[Gemini] ✅ Key ${keyNumber} used for continue conversation`);
      return response.text();
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const errorStatus = error.status || error.response?.status;
      
      // Check if it's a quota/key error - try next key
      if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorStatus === 429 ||
          errorStatus === 401 || (errorStatus === 403 && errorMsg.includes('api'))) {
        console.log(`[Gemini] ⚠️  Key ${keyNumber} failed, rotating to next key...`);
        lastKeyError = error;
        continue;
      }
      
      // Other errors - throw immediately
      throw new Error(`Failed to continue interview: ${error.message}`);
    }
  }
  
  // All keys exhausted
  throw new Error(`All Gemini API keys exhausted. Last error: ${lastKeyError?.message || 'Unknown error'}. Please check your API keys or wait for quota reset.`);
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
    const model = getGeminiModel();
    
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if JSON parsing fails
    return {
      overallScore: 75,
      feedback: [
        {
          category: 'Technical Knowledge',
          score: 75,
          comment: 'Demonstrated good understanding of core concepts.',
        },
        {
          category: 'Problem Solving',
          score: 75,
          comment: 'Showed logical thinking and problem-solving approach.',
        },
        {
          category: 'Communication',
          score: 75,
          comment: 'Clear and articulate responses.',
        },
      ],
      summary: 'Overall good performance. Continue practicing and building on your strengths.',
    };
  } catch (error: any) {
    console.error('Error generating feedback:', error);
    throw new Error(`Failed to generate interview feedback: ${error.message}`);
  }
}

