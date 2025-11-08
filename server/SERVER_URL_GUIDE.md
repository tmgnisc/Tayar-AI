# Server URL Configuration Guide

## What is the Server URL?

The **server URL** (also called webhook URL) is where Vapi sends events when something happens during a call (call ended, transcript ready, etc.).

## Do You Need It?

### ✅ **NO Server URL Needed** (Recommended for Development)

Since you're using a **public API key**, you can skip the server URL entirely:

1. **For Local Development:**
   - Leave `BACKEND_URL=http://localhost:3000` in `.env`
   - The code will **automatically skip** setting the webhook URL
   - Use client-side SDK to handle calls

2. **How it works:**
   - Your code checks: `BACKEND_URL !== 'http://localhost:3000'`
   - If it's localhost, webhooks are **not set**
   - You handle everything client-side

### ✅ **YES Server URL Needed** (Only for Production)

Only set a server URL if:
- Your backend is **publicly accessible** (deployed)
- You want **automatic** transcript processing
- You want **automatic** feedback generation

## Configuration Options

### Option 1: No Server URL (Local Development) ✅

**In `server/.env`:**
```env
BACKEND_URL=http://localhost:3000
```

**What happens:**
- Webhooks are **not set** in Vapi assistant
- You handle calls client-side
- You manually save transcripts via API

**This is what you should use for now!**

### Option 2: Production Server URL (When Deployed)

**In `server/.env`:**
```env
BACKEND_URL=https://your-domain.com
# or
BACKEND_URL=https://api.yourdomain.com
```

**What happens:**
- Webhooks **are set** in Vapi assistant
- Vapi automatically sends events to your backend
- Automatic transcript processing
- Automatic feedback generation

## Current Setup (Recommended)

Your current `.env` should be:
```env
BACKEND_URL=http://localhost:3000
```

**This means:**
- ✅ No webhook URL will be set (automatically skipped)
- ✅ You can use Vapi client SDK in frontend
- ✅ You manually save transcripts when call ends
- ✅ Perfect for local development

## Vapi Dashboard Configuration

### If Using Webhooks (Production Only):

1. Go to Vapi Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/vapi`
3. Set webhook secret: (same as `VAPI_WEBHOOK_SECRET` in `.env`)

### If NOT Using Webhooks (Development):

- **Don't configure anything in Vapi dashboard**
- Just use the public API key client-side
- Everything works without webhooks!

## Summary

| Scenario | BACKEND_URL | Webhooks Set? | Action |
|----------|-------------|---------------|--------|
| **Local Dev** | `http://localhost:3000` | ❌ No | Use client-side SDK |
| **Production** | `https://your-domain.com` | ✅ Yes | Automatic processing |

## Your Current Setup

Since you're developing locally, **keep it as:**
```env
BACKEND_URL=http://localhost:3000
```

**No changes needed!** The code will automatically skip webhooks and you can use the client-side approach.

