import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface InterviewContext {
  role: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  language: string;
  userName?: string;
}

/**
 * Generate interview system prompt based on role and difficulty
 */
export function generateInterviewPrompt(context: InterviewContext): string {
  const { role, difficulty, language, userName } = context;
  
  const roleDescriptions: Record<string, string> = {
    'frontend': 'Frontend Developer specializing in React, TypeScript, and modern web technologies',
    'backend': 'Backend Developer specializing in Node.js, databases, and API design',
    'full-stack': 'Full Stack Developer with expertise in both frontend and backend technologies',
    'mern': 'MERN Stack Developer (MongoDB, Express, React, Node.js)',
    'devops': 'DevOps Engineer specializing in CI/CD, cloud infrastructure, and automation',
    'software-engineer': 'Software Engineer with broad technical knowledge',
    'senior-software-engineer': 'Senior Software Engineer with leadership and architecture experience',
  };

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

  const roleDescription = roleDescriptions[role.toLowerCase()] || `Technical role in ${role}`;
  const difficultyGuideline = difficultyGuidelines[difficulty] || difficultyGuidelines.intermediate;

  return `You are an expert technical interviewer conducting a professional ${difficulty} level interview for a ${roleDescription} position.

${difficultyGuideline}

INTERVIEW GUIDELINES:
1. Start with a warm, professional greeting and introduce yourself
2. Ask 5-8 thoughtful questions throughout the interview
3. Listen carefully to the candidate's responses and ask follow-up questions when appropriate
4. Provide constructive feedback after key responses
5. Test both technical knowledge and problem-solving skills
6. Keep the conversation natural and engaging
7. End the interview by asking if the candidate has any questions
8. Provide a brief summary of strengths and areas for improvement

CONVERSATION STYLE:
- Be professional but friendly
- Speak clearly and at a moderate pace
- Allow the candidate time to think before answering
- Provide encouragement and positive reinforcement
- Be specific in your feedback
- Use technical terminology appropriate for the ${difficulty} level

QUESTION TOPICS TO COVER:
1. Technical fundamentals relevant to ${role}
2. Problem-solving and coding scenarios
3. Experience with specific technologies
4. System design (for intermediate and above)
5. Best practices and industry standards
6. Soft skills and teamwork (briefly)

${userName ? `The candidate's name is ${userName}.` : ''}

Remember: This is a practice interview to help the candidate improve. Be supportive while still maintaining professional standards.`;
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
 * Get Gemini model for conversation
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
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

