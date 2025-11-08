import axios from 'axios';
import { generateInterviewPrompt } from './gemini';

const VAPI_API_KEY = process.env.VAPI_API_KEY || '';
const VAPI_BASE_URL = 'https://api.vapi.ai';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

if (!VAPI_API_KEY) {
  console.warn('⚠️  VAPI_API_KEY not found in environment variables');
}

interface VapiCallConfig {
  interviewId: number;
  userId: number;
  role: string;
  difficulty: string;
  userName?: string;
  userPhone?: string;
  assistantId?: string;
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
    
    // Generate interview prompt using Gemini service
    const interviewPrompt = generateInterviewPrompt({
      role: config.role,
      difficulty: config.difficulty as 'beginner' | 'intermediate' | 'advanced' | 'expert',
      language: 'english',
      userName: config.userName,
    });
    
    // Create assistant with Gemini integration
    const assistantConfig = {
      name: assistantName,
      model: {
        provider: 'google',
        model: 'gemini-1.5-pro',
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
      firstMessage: `Hello${config.userName ? ` ${config.userName}` : ''}! Welcome to your technical interview. I'll be conducting your interview today for the ${config.role} position at ${config.difficulty} level. Let's begin with a few questions about your experience and technical background.`,
      // Webhooks are optional - only set if BACKEND_URL is configured and accessible
      ...(BACKEND_URL && BACKEND_URL !== 'http://localhost:3000' ? {
        serverUrl: `${BACKEND_URL}/api/webhooks/vapi`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || 'your-webhook-secret',
      } : {}),
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
      }
    );

    return response.data.id;
  } catch (error: any) {
    console.error('Error creating Vapi assistant:', error.response?.data || error.message);
    throw new Error(`Failed to create Vapi assistant: ${error.message}`);
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
      recordingUrl: response.data.recordingUrl,
    };
  } catch (error: any) {
    console.error('Error creating Vapi web call:', error.response?.data || error.message);
    throw new Error(`Failed to create Vapi web call: ${error.message}`);
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

