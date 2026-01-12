import axios from 'axios';
import { generateInterviewPrompt } from './gemini';

const VAPI_API_KEY = process.env.VAPI_API_KEY || '';
const VAPI_BASE_URL = 'https://api.vapi.ai';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

if (!VAPI_API_KEY) {
  console.warn('⚠️  VAPI_API_KEY not found in environment variables');
} else {
  console.log('✅ VAPI_API_KEY found:', VAPI_API_KEY.substring(0, 8) + '...');
}

interface VapiCallConfig {
  interviewId: number;
  userId: number;
  role: string;
  difficulty: string;
  userName?: string;
  userPhone?: string;
  assistantId?: string;
  domainName?: string;
  domainDescription?: string;
}

interface VapiCallResponse {
  id: string;
  status: string;
  phoneNumber?: string;
  recordingUrl?: string;
}

/**
 * Create a Vapi assistant for the interview
 */
export async function createVapiAssistant(config: VapiCallConfig): Promise<string> {
  try {
    const assistantName = `Interview Assistant - ${config.role} (${config.difficulty})`;
    
    console.log(`[Vapi] Generating interview prompt for ${config.role} (${config.difficulty})...`);
    
    // Generate interview prompt using Gemini service with domain information
    const interviewPrompt = generateInterviewPrompt({
      role: config.role,
      difficulty: config.difficulty as 'beginner' | 'intermediate' | 'advanced' | 'expert',
      language: 'english',
      userName: config.userName,
      domainName: config.domainName,
      domainDescription: config.domainDescription,
    });
    
    console.log(`[Vapi] Prompt generated (length: ${interviewPrompt.length} characters)`);
    console.log(`[Vapi] Creating assistant: ${assistantName}...`);
    
    // Create assistant with Gemini integration
    const assistantConfig = {
      name: assistantName,
      model: {
        provider: 'google',
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: interviewPrompt,
          },
        ],
      },
      voice: {
        provider: '11labs',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice - professional and clear
      },
      // First message - This will be automatically spoken by Vapi when the call starts
      // Vapi will speak this greeting immediately upon call connection
      // Maria introduces herself and asks the first question
      const domain = config.domainName || config.role;
      firstMessage: `Hello${config.userName ? ` ${config.userName}` : ''}! I'm Maria, and I'll be conducting your technical interview today for the ${domain} position at ${config.difficulty} level. I'll be asking you 4 questions about ${domain}. Let's begin! My first question for you is: Can you explain what ${domain} is and why it's important in software development?`,
      
      // Ensure the assistant speaks first
      firstMessageMode: 'assistant-speaks-first',
      
      // Webhooks are optional - only set if BACKEND_URL is configured and accessible
      ...(BACKEND_URL && BACKEND_URL !== 'http://localhost:3000' ? {
        serverUrl: `${BACKEND_URL}/api/webhooks/vapi`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || 'your-webhook-secret',
      } : {}),
      
      // Enable recording and transcription
      recordingEnabled: true,
      recordingTranscriptionEnabled: true,
    };

    const response = await axios.post(
      `${VAPI_BASE_URL}/assistant`,
      assistantConfig,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    const assistantId = response.data.id;
    console.log(`[Vapi] Assistant created successfully: ${assistantId}`);
    return assistantId;
  } catch (error: any) {
    const errorMessage = error.response?.data 
      ? JSON.stringify(error.response.data) 
      : error.message;
    console.error('[Vapi] Error creating assistant:', errorMessage);
    console.error('[Vapi] Error status:', error.response?.status);
    console.error('[Vapi] Error headers:', error.response?.headers);
    
    // Check if it's an authentication error
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error(`Vapi authentication failed. Please check your VAPI_API_KEY. Status: ${error.response.status}`);
    }
    
    throw new Error(`Failed to create Vapi assistant: ${errorMessage}`);
  }
}

/**
 * Create a phone call using Vapi
 */
export async function createVapiCall(config: VapiCallConfig): Promise<VapiCallResponse> {
  try {
    // First, get or create an assistant
    let assistantId = config.assistantId;
    
    if (!assistantId) {
      assistantId = await createVapiAssistant(config);
    }

    const callConfig = {
      assistantId: assistantId,
      customer: {
        number: config.userPhone || process.env.DEFAULT_PHONE_NUMBER, // User's phone number
      },
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID, // Your Vapi phone number ID
    };

    const response = await axios.post(
      `${VAPI_BASE_URL}/call`,
      callConfig,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      id: response.data.id,
      status: response.data.status,
      phoneNumber: response.data.phoneNumber,
    };
  } catch (error: any) {
    console.error('Error creating Vapi call:', error.response?.data || error.message);
    throw new Error(`Failed to create Vapi call: ${error.message}`);
  }
}

/**
 * Create a web call (for web-based interviews)
 */
export async function createVapiWebCall(config: VapiCallConfig): Promise<VapiCallResponse> {
  try {
    // Use provided assistant ID or create a new one
    let assistantId = config.assistantId;
    
    if (!assistantId) {
      assistantId = await createVapiAssistant(config);
    }

    const callConfig = {
      assistantId: assistantId,
      customer: {
        number: 'web', // Web-based call
      },
      // Add metadata to track the interview
      metadata: {
        interviewId: config.interviewId.toString(),
        userId: config.userId.toString(),
        role: config.role,
        difficulty: config.difficulty,
      },
    };

    console.log(`[Vapi] Creating web call with assistant ${assistantId}...`);
    
    const response = await axios.post(
      `${VAPI_BASE_URL}/call`,
      callConfig,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log(`[Vapi] Web call created successfully:`, response.data.id);

    return {
      id: response.data.id,
      status: response.data.status,
      recordingUrl: response.data.recordingUrl,
    };
  } catch (error: any) {
    const errorMessage = error.response?.data 
      ? JSON.stringify(error.response.data) 
      : error.message;
    console.error('[Vapi] Error creating web call:', errorMessage);
    console.error('[Vapi] Error status:', error.response?.status);
    
    // Check if it's an authentication error
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error(`Vapi authentication failed. Please check your VAPI_API_KEY. Status: ${error.response.status}`);
    }
    
    // Check if it's a timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Vapi API request timed out. Please check your internet connection and try again.');
    }
    
    throw new Error(`Failed to create Vapi web call: ${errorMessage}`);
  }
}

/**
 * Get call status from Vapi
 */
export async function getVapiCallStatus(callId: string): Promise<any> {
  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/call/${callId}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error getting Vapi call status:', error.response?.data || error.message);
    throw new Error(`Failed to get Vapi call status: ${error.message}`);
  }
}

/**
 * End a Vapi call
 */
export async function endVapiCall(callId: string): Promise<void> {
  try {
    await axios.post(
      `${VAPI_BASE_URL}/call/${callId}/end`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      }
    );
  } catch (error: any) {
    console.error('Error ending Vapi call:', error.response?.data || error.message);
    throw new Error(`Failed to end Vapi call: ${error.message}`);
  }
}

