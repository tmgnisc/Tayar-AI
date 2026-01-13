# AI Interviewer Avatar Integration Guide

## Current Implementation

The AI interviewer currently uses an animated avatar with the following features:
- Professional AI-generated avatar using DiceBear API
- Animated pulsing border when speaking
- Breathing effect during idle state
- Speaking status indicators
- Smooth transitions and animations

## Video Avatar Integration Options

For a more realistic interview experience, you can integrate video avatars using the following services:

### 1. D-ID (Recommended for Talking Heads)
**Website:** https://www.d-id.com/

**Features:**
- Create talking head videos from static images
- Text-to-speech with lip-sync
- Real-time streaming API available
- Multiple voices and languages

**Implementation:**
```typescript
// Example: Generate video avatar with D-ID
const response = await fetch('https://api.d-id.com/talks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${D_ID_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    source_url: 'https://example.com/interviewer-photo.jpg',
    script: {
      type: 'text',
      input: 'Hello! Welcome to your interview.',
      provider: {
        type: 'microsoft',
        voice_id: 'en-US-JennyNeural'
      }
    }
  })
});
```

### 2. HeyGen
**Website:** https://www.heygen.com/

**Features:**
- Pre-built AI avatars
- Custom avatar creation
- Multiple languages and accents
- API for real-time generation

**Use Case:** Best for professional, studio-quality avatars

### 3. Synthesia
**Website:** https://www.synthesia.io/

**Features:**
- 140+ AI avatars
- 120+ languages
- Enterprise-grade quality
- Video generation API

**Use Case:** Best for pre-recorded interview questions

### 4. Wav2Lip (Open Source)
**GitHub:** https://github.com/Rudrabha/Wav2Lip

**Features:**
- Local lip-sync solution
- No API costs
- Requires GPU for processing
- Can be self-hosted

**Use Case:** Best for cost-effective, self-hosted solution

## How to Use Video Avatar Component

### Option 1: Use the Enhanced Avatar (Current)
```tsx
import { AIInterviewerAvatar } from "@/components/AIInterviewerAvatar";

<AIInterviewerAvatar 
  isSpeaking={voiceStatus === 'speaking'}
  size="lg"
/>
```

### Option 2: Use Video Avatar (With D-ID or HeyGen)
```tsx
import { AIInterviewerVideoAvatar } from "@/components/AIInterviewerVideoAvatar";

<AIInterviewerVideoAvatar 
  isSpeaking={voiceStatus === 'speaking'}
  videoUrl="https://d-id-talks-prod.s3.amazonaws.com/..."
  fallbackAvatarUrl="https://example.com/static-avatar.jpg"
  size="lg"
/>
```

## Environment Variables Needed

Add these to your `.env` file:

```env
# D-ID Integration (Optional)
VITE_DID_API_KEY=your_d_id_api_key_here

# HeyGen Integration (Optional)
VITE_HEYGEN_API_KEY=your_heygen_api_key_here

# Avatar Video URL (Optional - for pre-recorded videos)
VITE_AI_AVATAR_VIDEO_URL=https://your-cdn.com/avatar-video.mp4
```

## Implementation Steps

### Step 1: Choose Your Video Avatar Service

**For Quick Setup (Recommended):**
- Use the current animated avatar (already implemented)
- No API keys required
- Works out of the box

**For Realistic Video Avatars:**
- Sign up for D-ID (https://studio.d-id.com/)
- Get API key from dashboard
- Test with their playground first

### Step 2: Update InterviewSession Component

Replace the avatar import:
```tsx
// Current
import { AIInterviewerAvatar } from "@/components/AIInterviewerAvatar";

// For Video
import { AIInterviewerVideoAvatar } from "@/components/AIInterviewerVideoAvatar";
```

### Step 3: Configure Video Generation

Create a service to generate videos:

```typescript
// src/services/avatarVideo.ts
export async function generateInterviewerVideo(text: string) {
  const response = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: 'https://example.com/interviewer.jpg',
      script: {
        type: 'text',
        input: text,
        provider: {
          type: 'microsoft',
          voice_id: 'en-US-JennyNeural'
        }
      }
    })
  });
  
  return await response.json();
}
```

## Costs Comparison

### D-ID
- **Free Tier:** 20 credits (≈ 20 seconds of video)
- **Lite:** $5.90/month - 15 min video
- **Pro:** $49/month - 60 min video
- **Best for:** Development and small scale

### HeyGen
- **Creator:** $24/month - 30 credits
- **Business:** $120/month - 150 credits
- **Best for:** Professional applications

### Synthesia
- **Starter:** $30/month - 10 videos
- **Creator:** $90/month - 30 videos
- **Best for:** Enterprise applications

### Wav2Lip (Self-Hosted)
- **Cost:** Free (open source)
- **Requirements:** GPU server (AWS/GCP ~$0.50-2/hour)
- **Best for:** High volume or privacy-sensitive applications

## Recommended Approach

### Phase 1 (Current): Animated Avatar ✅
- Use the implemented `AIInterviewerAvatar`
- No costs, works immediately
- Professional appearance

### Phase 2 (Future): Video Avatar
- Integrate D-ID for realistic talking heads
- Generate videos on-demand for interview questions
- Cache generated videos for reuse

### Phase 3 (Advanced): Real-time Streaming
- Use D-ID Streaming API
- Live lip-sync with interview audio
- Most realistic experience

## Testing Video Avatars

You can test with a sample video URL:
```tsx
<AIInterviewerVideoAvatar 
  isSpeaking={true}
  videoUrl="https://d-id-talks-prod.s3.amazonaws.com/auth0%7C63f35a1e23a2fe2e1d0c0d08/tlk_yQ9_zk_HYnZjqpvRPfyHe/microsoft_jenny__yQ9_zk_HYnZjqpvRPfyHe.mp4"
  size="lg"
/>
```

## Support & Resources

- **D-ID Docs:** https://docs.d-id.com/
- **HeyGen Docs:** https://docs.heygen.com/
- **Synthesia Docs:** https://docs.synthesia.io/
- **Wav2Lip GitHub:** https://github.com/Rudrabha/Wav2Lip

## Current Status

✅ **Implemented:**
- Animated AI avatar with professional styling
- Speaking/idle state animations
- Pulsing effects and status indicators
- Responsive sizing options

🚧 **Available (Not Enabled):**
- Video avatar component ready
- D-ID/HeyGen integration structure
- Fallback handling for video errors

💡 **To Enable Video Avatars:**
1. Get API key from D-ID or HeyGen
2. Add to environment variables
3. Switch to `AIInterviewerVideoAvatar` component
4. Implement video generation logic

