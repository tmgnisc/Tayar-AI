/**
 * D-ID Avatar Service
 * 
 * Integrates with D-ID API to generate realistic talking head videos via backend proxy
 * Website: https://www.d-id.com/
 * 
 * Setup:
 * 1. Sign up at https://studio.d-id.com/
 * 2. Get API key from https://studio.d-id.com/account-settings
 * 3. Add to server/.env: DID_API_KEY=bnNjaGFsdG1nMjAyM0BnbWFpbC5jb20:kP1W4V6UIRnYbDNtnJKyu
 */

const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
 * Generate a talking head video from text (via backend proxy)
 */
export async function generateTalkingHead(
  text: string,
  sourceImage: string = INTERVIEWER_IMAGES.female,
  voice: string = 'en-US-JennyNeural'
): Promise<CreateTalkResponse> {
  try {
    console.log('[D-ID] Generating talking head video via backend...');
    console.log('[D-ID] Text:', text.substring(0, 100));
    console.log('[D-ID] Source image:', sourceImage);
    console.log('[D-ID] Backend URL:', BACKEND_API_URL);
    
    const response = await fetch(`${BACKEND_API_URL}/api/did/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceImage,
        voice,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[D-ID] Backend error:', errorData);
      
      return { 
        id: '', 
        status: 'error', 
        error: errorData.error || 'Failed to generate video' 
      };
    }

    const data = await response.json();
    console.log('[D-ID] Video creation initiated. ID:', data.id);
    return data;
  } catch (error) {
    console.error('[D-ID] Error generating talking head:', error);
    return { 
      id: '', 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check the status of a video generation (via backend proxy)
 */
export async function checkTalkStatus(talkId: string): Promise<CreateTalkResponse> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/did/status/${talkId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[D-ID] Status check error:', errorData);
      return {
        id: talkId,
        status: 'error',
        error: errorData.error || 'Failed to check status',
      };
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[D-ID] Error checking talk status:', error);
    return { 
      id: talkId, 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate video and wait for completion
 * (Polls every 2 seconds until done, max wait time)
 */
export async function generateAndWaitForVideo(
  text: string,
  sourceImage?: string,
  voice?: string,
  maxWaitSeconds: number = 30
): Promise<string | null> {
  const talk = await generateTalkingHead(text, sourceImage, voice);
  
  if (talk.status === 'error' || !talk.id) {
    console.error('[D-ID] Failed to create talk:', talk.error);
    return null;
  }

  // If video is already done (cached by D-ID)
  if (talk.status === 'done' && talk.result_url) {
    console.log('[D-ID] Video ready immediately (cached)');
    return talk.result_url;
  }

  // Poll for completion
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  let pollCount = 0;

  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      pollCount++;
      const status = await checkTalkStatus(talk.id);
      
      console.log(`[D-ID] Poll #${pollCount}: Status = ${status.status}`);
      
      if (status.status === 'done' && status.result_url) {
        clearInterval(checkInterval);
        console.log('[D-ID] ✅ Video ready! URL:', status.result_url);
        resolve(status.result_url);
      } else if (status.status === 'error') {
        clearInterval(checkInterval);
        console.error('[D-ID] ❌ Video generation failed:', status.error);
        resolve(null);
      } else if (Date.now() - startTime > maxWaitSeconds * 1000) {
        clearInterval(checkInterval);
        console.error('[D-ID] ⏱️ Video generation timeout after', maxWaitSeconds, 'seconds');
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
};



