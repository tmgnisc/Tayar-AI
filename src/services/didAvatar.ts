/**
 * D-ID Avatar Service
 * 
 * Integrates with D-ID API to generate realistic talking head videos
 * Website: https://www.d-id.com/
 * 
 * Setup:
 * 1. Sign up at https://studio.d-id.com/
 * 2. Get API key from https://studio.d-id.com/account-settings
 * 3. Add to .env: VITE_DID_API_KEY=your_api_key
 */

const DID_API_KEY = import.meta.env.VITE_DID_API_KEY;
const DID_API_URL = 'https://api.d-id.com';

// Professional interviewer images (you can replace with your own)
export const INTERVIEWER_IMAGES = {
  female: 'https://create-images-results.d-id.com/api_docs/assets/noelle.jpeg',
  male: 'https://create-images-results.d-id.com/api_docs/assets/liam.jpeg',
  // You can upload your own image and use its URL
  custom: 'https://randomuser.me/api/portraits/women/44.jpg',
};

interface CreateTalkResponse {
  id: string;
  status: 'created' | 'processing' | 'done' | 'error';
  result_url?: string;
  error?: string;
}

/**
 * Generate a talking head video from text
 */
export async function generateTalkingHead(
  text: string,
  sourceImage: string = INTERVIEWER_IMAGES.female,
  voice: string = 'en-US-JennyNeural'
): Promise<CreateTalkResponse> {
  if (!DID_API_KEY) {
    console.warn('D-ID API key not configured. Using static avatar.');
    return { id: '', status: 'error', error: 'API key not configured' };
  }

  try {
    console.log('[D-ID] Generating talking head video...');
    const response = await fetch(`${DID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        source_url: sourceImage,
        script: {
          type: 'text',
          input: text,
          provider: {
            type: 'microsoft',
            voice_id: voice,
          },
        },
        config: {
          fluent: true,
          pad_audio: 0,
          stitch: true, // Smoother transitions
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('D-ID API error:', error);
      return { id: '', status: 'error', error };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating talking head:', error);
    return { 
      id: '', 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check the status of a video generation
 */
export async function checkTalkStatus(talkId: string): Promise<CreateTalkResponse> {
  if (!DID_API_KEY) {
    return { id: '', status: 'error', error: 'API key not configured' };
  }

  try {
    const response = await fetch(`${DID_API_URL}/talks/${talkId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('D-ID status check error:', error);
      return { id: talkId, status: 'error', error };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking talk status:', error);
    return { 
      id: talkId, 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate video and wait for completion
 * (Polls every 2 seconds until done, max 30 seconds)
 */
export async function generateAndWaitForVideo(
  text: string,
  sourceImage?: string,
  voice?: string,
  maxWaitSeconds: number = 30
): Promise<string | null> {
  const talk = await generateTalkingHead(text, sourceImage, voice);
  
  if (talk.status === 'error' || !talk.id) {
    console.error('Failed to create talk:', talk.error);
    return null;
  }

  // If video is already done (cached)
  if (talk.status === 'done' && talk.result_url) {
    return talk.result_url;
  }

  // Poll for completion
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      const status = await checkTalkStatus(talk.id);
      
      if (status.status === 'done' && status.result_url) {
        clearInterval(checkInterval);
        resolve(status.result_url);
      } else if (status.status === 'error') {
        clearInterval(checkInterval);
        console.error('Video generation failed:', status.error);
        resolve(null);
      } else if (Date.now() - startTime > maxWaitSeconds * 1000) {
        clearInterval(checkInterval);
        console.error('Video generation timeout');
        resolve(null);
      }
    }, pollInterval);
  });
}

/**
 * Available voices for different languages
 */
export const AVAILABLE_VOICES = {
  // English - US
  'en-US-female': 'en-US-JennyNeural',
  'en-US-male': 'en-US-GuyNeural',
  
  // English - UK
  'en-GB-female': 'en-GB-SoniaNeural',
  'en-GB-male': 'en-GB-RyanNeural',
  
  // English - India
  'en-IN-female': 'en-IN-NeerjaNeural',
  'en-IN-male': 'en-IN-PrabhatNeural',
  
  // Add more languages as needed
};

/**
 * Example usage:
 * 
 * // Generate video for interview question
 * const videoUrl = await generateAndWaitForVideo(
 *   "Hello! Welcome to your technical interview. Let's begin with the first question.",
 *   INTERVIEWER_IMAGES.female,
 *   AVAILABLE_VOICES['en-US-female']
 * );
 * 
 * if (videoUrl) {
 *   // Use videoUrl in AIInterviewerVideoAvatar component
 * }
 */

