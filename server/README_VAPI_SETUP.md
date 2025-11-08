# Vapi Integration Setup - Simplified

Since you're using a **public API key**, you have two options for integration:

## Option 1: Client-Side Only (Simpler - Recommended for Development)

With a public API key, you can use Vapi's client-side SDK directly without webhooks:

### Frontend Integration

1. **Install Vapi SDK** (if using React):
```bash
npm install @vapi-ai/react
```

2. **Use in InterviewSession component**:
```tsx
import { Vapi } from '@vapi-ai/react';

// In your component
const vapi = new Vapi({
  publicKey: 'f4e61152-0e89-4c3c-b9e1-8b79f56e8649',
  assistantId: assistantId, // From your backend
});

// Start call
vapi.start();

// Listen for events
vapi.on('call-end', async (data) => {
  // Send transcript to your backend
  await fetch('/api/user/interviews/${interviewId}/transcript', {
    method: 'POST',
    body: JSON.stringify({ transcript: data.transcript }),
  });
});
```

### Backend Changes Needed

You'll need to manually save transcripts when the call ends:

```typescript
// Add endpoint to save transcript manually
router.post('/interviews/:id/transcript', async (req: AuthRequest, res) => {
  // Save transcript and generate feedback
});
```

## Option 2: With Webhooks (Better for Production)

Webhooks allow automatic processing when calls end, but require:
- Publicly accessible backend URL (not localhost)
- Webhook URL configured in Vapi dashboard

### When to Use Webhooks

✅ **Use webhooks if:**
- Your backend is deployed and publicly accessible
- You want automatic transcript processing
- You want automatic feedback generation
- You're in production

❌ **Skip webhooks if:**
- You're developing locally
- Your backend isn't publicly accessible
- You want simpler setup

## Current Setup

Your current setup will work **without webhooks** for development:

1. **Create assistant** - ✅ Works with public API key
2. **Create call** - ✅ Works with public API key  
3. **Frontend handles call** - ✅ Use Vapi client SDK
4. **Manual transcript save** - ✅ Call your API when call ends

## Next Steps

### For Development (No Webhooks):
1. Use Vapi client SDK in frontend
2. Listen for call-end events
3. Manually send transcript to backend
4. Backend generates feedback

### For Production (With Webhooks):
1. Deploy your backend
2. Configure webhook URL in Vapi dashboard
3. Webhooks automatically process transcripts
4. Automatic feedback generation

## Testing Without Webhooks

You can test the integration locally by:
1. Creating an interview (creates Vapi assistant and call)
2. Using Vapi client SDK to join the call
3. Manually saving transcript when call ends
4. Backend generates feedback

The webhook URL in the assistant config (`serverUrl`) is **optional** - if not set or not accessible, Vapi will simply not send webhook events, but the call will still work.

