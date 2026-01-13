# D-ID API Key Setup

## Your API Key

You have D-ID API key: `bnNjaGFsdG1nMjAyM0BnbWFpbC5jb20:kP1W4V6UIRnYbDNtnJKyu`

Credits remaining: **12** (~12 seconds of video)

## Setup Instructions

### 1. Add to `.env` file (Frontend Root)

Create or edit `.env` in: `/home/shifu/Documents/Tayar AI /.env`

```env
VITE_DID_API_KEY=bnNjaGFsdG1nMjAyM0BnbWFpbC5jb20:kP1W4V6UIRnYbDNtnJKyu
```

**Important**: 
- The key should be on ONE line
- No quotes needed
- No spaces before or after the `=`

### 2. Verify `.env` File Looks Like This

```env
VITE_DID_API_KEY=bnNjaGFsdG1nMjAyM0BnbWFpbC5jb20:kP1W4V6UIRnYbDNtnJKyu
VITE_API_URL=http://localhost:3000
```

### 3. Restart Frontend Server

```bash
# Stop the frontend (Ctrl+C)
# Then restart
npm run dev
```

### 4. Test It!

1. Start an interview
2. You'll see "Generating realistic avatar..." message
3. After ~5-10 seconds, you'll see the realistic woman **actually speaking** with lip-sync!

## How It Works

```
Interview Question
       ↓
D-ID API generates video (~5-10 sec)
       ↓
Video shows woman speaking with lip-sync
       ↓
Video is cached for future use
```

## Video Generation Process

1. **First time**: Takes ~5-10 seconds to generate
2. **Cached**: Same question = instant replay
3. **Credits used**: ~1 credit per 1 second of speech

## Monitoring Credits

Check your credits at: https://studio.d-id.com/account-settings

You have **12 credits** remaining:
- ~12 seconds of video
- Enough for 3-4 short questions
- Consider upgrading for production use

## Troubleshooting

### "API key not configured"
- Check `.env` file exists in frontend root
- Verify the variable name is exactly: `VITE_DID_API_KEY`
- Restart frontend server

### "403 Forbidden" or "401 Unauthorized"
- API key format may be incorrect
- Verify you copied the full key
- Check credits haven't run out

### Video not playing
- Wait 5-10 seconds for generation
- Check browser console for errors
- Ensure credits remaining > 0

### Generation taking too long
- D-ID API may be slow (up to 20 seconds)
- Check status at: https://status.d-id.com/
- Fallback to static avatar if timeout

## What You'll See

**During Video Generation:**
- Blue indicator: "Generating realistic avatar..."
- Static photo of woman with animated border

**After Video Ready:**
- Realistic woman speaking with perfect lip-sync
- Natural head movements
- Synchronized with interview audio
- Professional appearance

## Tips to Save Credits

1. **Short Questions**: Keep questions concise
2. **Caching**: Same questions reuse cached videos (free!)
3. **Strategic Use**: Only generate for important questions
4. **Upgrade**: Get more credits ($5.90/mo for 900 credits)

## Credit Costs

- 1 credit = ~1 second of video
- "Hello, welcome to the interview" = ~2-3 credits
- "What is your experience with React?" = ~2 credits
- Full interview (4-5 questions) = ~10-15 credits

## Next Steps

1. ✅ API key added to `.env`
2. ✅ Frontend restarted
3. ✅ Start an interview to test
4. 🎯 See realistic talking human interviewer!

## Support

- **D-ID Dashboard**: https://studio.d-id.com/
- **Check Credits**: https://studio.d-id.com/account-settings
- **API Docs**: https://docs.d-id.com/
- **Status**: https://status.d-id.com/

