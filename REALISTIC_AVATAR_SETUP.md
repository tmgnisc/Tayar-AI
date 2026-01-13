# Realistic Human Video Avatar Setup Guide

Your AI interviewer currently shows a **real human photo** (professional woman). To make her **actually speak and move like a real person**, follow this guide.

## Current Status

✅ **Implemented**: Static photo of a realistic human interviewer  
🚀 **Next Step**: Make the interviewer speak with realistic lip-sync video

---

## Option 1: D-ID (Easiest - Recommended) 🌟

**D-ID creates realistic talking head videos** from photos with perfect lip-sync.

### Step 1: Get Free D-ID Account

1. Go to **https://studio.d-id.com/**
2. Click "Sign Up" - Get **20 FREE credits** (≈20 seconds of video)
3. Verify your email

### Step 2: Get Your API Key

1. Go to **https://studio.d-id.com/account-settings**
2. Scroll to "API Key" section
3. Click "Create API Key"
4. Copy the key (looks like: `dGVzdEBleGFtcGxlLmNvbQ...`)

### Step 3: Add API Key to Your Project

Create or update `.env` file in your project root:

```env
VITE_DID_API_KEY=your_api_key_here
```

Example:
```env
VITE_DID_API_KEY=dGVzdEBleGFtcGxlLmNvbQ==
```

### Step 4: Restart Your Frontend

```bash
# Stop the frontend (Ctrl+C) and restart
npm run dev
```

### Step 5: Test It!

The interviewer will now be a **realistic talking human** with lip-sync! 🎉

---

## Option 2: Use Pre-recorded Video (Free)

If you want to use a pre-recorded video of a real person:

### Step 1: Get a Video

**Option A - Record Yourself:**
- Record a professional video saying "Hello, welcome to the interview"
- Use your phone or webcam
- Good lighting and background

**Option B - Use Stock Video:**
- Download from: https://www.pexels.com/search/videos/professional%20woman%20speaking/
- Search for: "professional woman speaking to camera"
- Download MP4 format

### Step 2: Host Your Video

**Option A - Use Cloudinary (Free):**
1. Sign up at https://cloudinary.com/ (free account)
2. Upload your video
3. Copy the public URL

**Option B - Use GitHub:**
1. Upload to your repository in `public/videos/interviewer.mp4`
2. URL will be: `http://localhost:8080/videos/interviewer.mp4`

### Step 3: Update the Code

Edit `src/pages/InterviewSession.tsx`:

```tsx
<AIInterviewerVideoAvatar 
  isSpeaking={voiceStatus === 'speaking'}
  videoUrl="YOUR_VIDEO_URL_HERE"  // Add your video URL
  fallbackAvatarUrl="https://randomuser.me/api/portraits/women/44.jpg"
  size="lg"
/>
```

---

## Option 3: Different Human Photos

Want to change the interviewer's appearance? Update the photo URL:

### Female Interviewers:
```tsx
fallbackAvatarUrl="https://randomuser.me/api/portraits/women/44.jpg"
// or
fallbackAvatarUrl="https://randomuser.me/api/portraits/women/65.jpg"
// or
fallbackAvatarUrl="https://randomuser.me/api/portraits/women/21.jpg"
```

### Male Interviewers:
```tsx
fallbackAvatarUrl="https://randomuser.me/api/portraits/men/32.jpg"
// or
fallbackAvatarUrl="https://randomuser.me/api/portraits/men/54.jpg"
```

### Your Own Photo:
1. Upload your photo to Cloudinary or similar
2. Use that URL

---

## Comparison Table

| Solution | Realism | Lip-Sync | Cost | Setup Time |
|----------|---------|----------|------|------------|
| **D-ID** (Recommended) | ⭐⭐⭐⭐⭐ | ✅ Perfect | $5.90/mo after free | 5 min |
| **Pre-recorded Video** | ⭐⭐⭐⭐ | ⭐⭐ Generic | Free | 15 min |
| **Static Photo** (Current) | ⭐⭐⭐ | ❌ None | Free | 0 min |

---

## D-ID Pricing (After Free Credits)

- **Free**: 20 credits (~20 seconds of video) - Great for testing!
- **Lite**: $5.90/month - 15 minutes of video (900 credits)
- **Pro**: $49/month - 60 minutes of video (3600 credits)

**Cost per interview**: ~$0.10-0.20 (assuming 2-3 video clips per interview)

---

## Testing D-ID Integration

Once you have the API key set up, test with this code in browser console:

```javascript
// Test D-ID API
fetch('https://api.d-id.com/talks', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    source_url: 'https://create-images-results.d-id.com/api_docs/assets/noelle.jpeg',
    script: {
      type: 'text',
      input: 'Hello! Welcome to your interview today.',
      provider: {
        type: 'microsoft',
        voice_id: 'en-US-JennyNeural'
      }
    }
  })
})
.then(r => r.json())
.then(data => console.log('Video URL:', data.result_url));
```

---

## Advanced: Generate Videos Per Question

For the most realistic experience, generate a video for each interview question:

```typescript
import { generateAndWaitForVideo, INTERVIEWER_IMAGES } from '@/services/didAvatar';

// When asking a question
const videoUrl = await generateAndWaitForVideo(
  "What is your experience with React?",
  INTERVIEWER_IMAGES.female
);

// Use this videoUrl in the avatar component
```

---

## Troubleshooting

### "API key not configured"
- Check `.env` file exists in project root
- Verify the key starts with `VITE_DID_API_KEY=`
- Restart your frontend server

### Video not playing
- Check browser console for errors
- Verify video URL is accessible
- Try a different browser (Chrome/Firefox recommended)

### D-ID API errors
- Check your credit balance at https://studio.d-id.com/
- Verify API key is correct
- Check D-ID status: https://status.d-id.com/

---

## What You'll See

**With D-ID enabled:**
- Real human face speaking with perfect lip-sync
- Natural head movements
- Synchronized with the interview audio
- Professional appearance

**Current (Static Photo):**
- Professional human photo
- Pulsing border when "speaking"
- Animated effects

---

## Need Help?

1. **D-ID Support**: support@d-id.com
2. **D-ID Docs**: https://docs.d-id.com/
3. **D-ID Discord**: https://discord.gg/d-id

---

## Quick Start Checklist

- [ ] Sign up for D-ID: https://studio.d-id.com/
- [ ] Get API key from account settings
- [ ] Add `VITE_DID_API_KEY` to `.env` file
- [ ] Restart frontend server
- [ ] Start an interview to see the realistic talking avatar! 🎉

