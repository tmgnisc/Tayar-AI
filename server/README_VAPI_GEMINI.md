# Vapi and Gemini Integration Setup

This document explains how to set up Vapi (voice AI) and Google Gemini for conducting AI-powered technical interviews.

## Prerequisites

1. **Vapi Account**: Sign up at [https://vapi.ai](https://vapi.ai)
2. **Google Gemini API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Environment Variables

Add the following environment variables to your `server/.env` file:

```env
# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_WEBHOOK_SECRET=your_webhook_secret_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here  # Optional, for phone calls

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Backend URL (for webhooks)
BACKEND_URL=http://localhost:3000  # Change to your production URL
```

## Setup Steps

### 1. Get Vapi API Key

1. Sign up for a Vapi account at [https://vapi.ai](https://vapi.ai)
2. Navigate to your dashboard
3. Go to Settings > API Keys
4. Copy your API key and add it to `.env`

### 2. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and add it to `.env`

### 3. Configure Vapi Webhooks

1. In your Vapi dashboard, go to Settings > Webhooks
2. Add a webhook URL: `https://your-domain.com/api/webhooks/vapi`
3. Set the webhook secret (use a random string)
4. Add the secret to your `.env` file as `VAPI_WEBHOOK_SECRET`

### 4. Test the Integration

1. Start your server: `npm run server:dev`
2. Create an interview through the frontend
3. Check server logs for Vapi call initialization
4. Monitor webhook events in your Vapi dashboard

## How It Works

### Interview Flow

1. **User starts interview**: User selects role and difficulty level
2. **Backend creates interview**: Interview record is created in database
3. **Vapi assistant created**: Assistant is configured with Gemini-powered prompts
4. **Vapi call initiated**: Web-based call is started for the interview
5. **Conversation happens**: User interacts with AI interviewer via voice
6. **Webhook receives events**: Vapi sends events to our webhook endpoint
7. **Interview completion**: Transcript and feedback are generated using Gemini
8. **Results stored**: Interview results are saved to database

### Prompt Engineering

The Gemini service generates dynamic interview prompts based on:
- **Role**: Frontend, Backend, Full Stack, etc.
- **Difficulty**: Beginner, Intermediate, Advanced, Expert
- **User name**: Personalizes the interview experience

Prompts include:
- Interview guidelines
- Question topics
- Conversation style
- Feedback criteria

### Gemini Integration

Gemini is used for:
1. **Interview prompts**: Generating context-aware interview instructions
2. **Conversation**: Powering the AI interviewer's responses
3. **Feedback generation**: Analyzing transcripts and providing scores
4. **Question generation**: Creating relevant technical questions

## API Endpoints

### Start Interview
```
POST /api/user/interviews
Body: { role, difficulty, language }
Response: { interviewId, vapiCallId, vapiStatus }
```

### Get Vapi Token
```
GET /api/user/interviews/:id/vapi-token
Response: { callId }
```

### Webhook Endpoint
```
POST /api/webhooks/vapi
Handles: status-update, end-of-call-report, conversation-update
```

## Troubleshooting

### Vapi call not starting
- Check if `VAPI_API_KEY` is set correctly
- Verify Vapi account has sufficient credits
- Check server logs for error messages

### Gemini not responding
- Verify `GEMINI_API_KEY` is valid
- Check API quota limits
- Review error logs for specific issues

### Webhooks not receiving events
- Verify webhook URL is accessible
- Check webhook secret matches
- Ensure backend is running and accessible

## Production Considerations

1. **Security**: Use strong webhook secrets
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Error Handling**: Add retry logic for failed API calls
4. **Monitoring**: Set up logging and monitoring for interview sessions
5. **Costs**: Monitor Vapi and Gemini API usage and costs

## Additional Resources

- [Vapi Documentation](https://docs.vapi.ai)
- [Google Gemini Documentation](https://ai.google.dev/docs)
- [Vapi Dashboard](https://dashboard.vapi.ai)

