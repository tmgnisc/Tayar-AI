const DID_API_KEY = process.env.DID_API_KEY;
const DID_API_URL = 'https://api.d-id.com';

interface CreateTalkResponse {
  id: string;
  status: 'created' | 'processing' | 'done' | 'error';
  result_url?: string;
  error?: string;
}

/**
 * Generate talking head video using D-ID API
 */
export async function generateTalkingHead(
  text: string,
  sourceImage: string,
  voice: string = 'en-US-JennyNeural'
): Promise<CreateTalkResponse> {
  if (!DID_API_KEY) {
    console.error('[D-ID] API key not configured');
    return { id: '', status: 'error', error: 'API key not configured' };
  }

  try {
    console.log('[D-ID Server] Generating talking head...');
    console.log('[D-ID Server] Text length:', text.length);
    console.log('[D-ID Server] Source image:', sourceImage);
    console.log('[D-ID Server] API Key present:', !!DID_API_KEY);

    const response = await fetch(`${DID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': `Basic ${DID_API_KEY}`,
      },
      body: JSON.stringify({
        source_url: sourceImage,
        script: {
          type: 'text',
          subtitles: 'false',
          provider: {
            type: 'microsoft',
            voice_id: voice,
          },
          ssml: 'false',
          input: text,
        },
        config: {
          fluent: 'false',
          pad_audio: '0.0',
        },
      }),
    });

    const responseText = await response.text();
    console.log('[D-ID Server] Response status:', response.status);
    console.log('[D-ID Server] Response headers:', JSON.stringify([...response.headers.entries()]));
    console.log('[D-ID Server] Response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }

      console.error('[D-ID Server] Full API error:', JSON.stringify(errorData, null, 2));

      if (response.status === 402 || response.status === 429) {
        return {
          id: '',
          status: 'error',
          error: 'Insufficient credits or rate limit exceeded',
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          id: '',
          status: 'error',
          error: 'Invalid API key',
        };
      }

      return {
        id: '',
        status: 'error',
        error: errorData.message || errorData.description || 'Unknown error',
      };
    }

    const data = JSON.parse(responseText);
    console.log('[D-ID Server] Video creation initiated. ID:', data.id);
    return data;
  } catch (error: any) {
    console.error('[D-ID Server] Error:', error.message);
    return {
      id: '',
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * Check status of video generation
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

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[D-ID Server] Status check error:', responseText);
      return {
        id: talkId,
        status: 'error',
        error: responseText,
      };
    }

    const data = JSON.parse(responseText);
    return data;
  } catch (error: any) {
    console.error('[D-ID Server] Status check error:', error.message);
    return {
      id: talkId,
      status: 'error',
      error: error.message,
    };
  }
}

