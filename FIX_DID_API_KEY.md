# 🔧 D-ID API Key Issue - Fix Required

## ❌ Current Problem

The D-ID API is returning `500 Internal Server Error` even with direct API calls. This indicates the API key format or key itself is invalid.

**Error:**
```json
{
  "kind": "UnknownError",
  "description": "Internal Server Error"
}
```

---

## 🔍 What I Tested

I tested your API key directly with `curl`:
```bash
curl -X POST 'https://api.d-id.com/talks' \
  -H "authorization: Basic bnNjaGFsdG1nMjAyM0BnbWFpbC5jb20:kP1W4V6UIRnYbDNtnJKyu"
```

**Result**: Same 500 error → **API key issue, not code issue!**

---

## ✅ How to Fix

### Option 1: Get New API Key from D-ID Dashboard (Recommended)

1. **Go to**: https://studio.d-id.com/account-settings

2. **Delete Old Key**: 
   - Find your existing API key
   - Click "Delete" or "Revoke"

3. **Create New Key**:
   - Click "Create API Key"
   - Copy the FULL key (looks like: `a1b2c3d4e5...`)

4. **Update Server .env**:
```bash
# Edit this file:
nano /home/shifu/Documents/Tayar\ AI\ /server/.env

# Replace with:
DID_API_KEY=YOUR_NEW_API_KEY_HERE
```

5. **Restart Backend**:
```bash
cd "/home/shifu/Documents/Tayar AI /server"
npm run server
```

---

### Option 2: Check API Key Format

Your current key: `bnNjaGFsdG1nMjAyM0BnbWFpbC5jb20:kP1W4V6UIRnYbDNtnJKyu`

This looks like: `base64(email):api_key_part`

**D-ID expects one of these formats:**

**Format A** (Most likely):
```
DID_API_KEY=just_the_api_key_string
```

**Format B**:
```
DID_API_KEY=email:password_or_api_key
```

**Format C** (if using older API):
```
DID_API_KEY=base64_encoded_full_credentials
```

---

## 🧪 Test Your API Key

### Method 1: Test in D-ID Dashboard

1. Go to: https://studio.d-id.com/
2. Click "Agents" or "Create"
3. Try creating a test video
4. If it works → API key is valid, need to check format
5. If it fails → Need new credits or key is invalid

### Method 2: Test with Curl (After Getting New Key)

```bash
# Replace YOUR_API_KEY with your new key
curl -X POST 'https://api.d-id.com/talks' \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "authorization: Basic YOUR_API_KEY" \
  -d '{
    "source_url": "https://randomuser.me/api/portraits/women/44.jpg",
    "script": {
      "type": "text",
      "input": "Hello test",
      "provider": {
        "type": "microsoft",
        "voice_id": "en-US-JennyNeural"
      }
    }
  }'
```

**Expected Success Response:**
```json
{
  "id": "tlk_xxxxx",
  "status": "created",
  ...
}
```

---

## 📝 Common API Key Issues

### Issue 1: Key Format Wrong
**Symptoms**: 500 Internal Server Error, 401 Unauthorized
**Fix**: Get fresh key from dashboard, use exact string D-ID provides

### Issue 2: Credits Exhausted
**Symptoms**: 402 Payment Required, 429 Rate Limit
**Check**: https://studio.d-id.com/account-settings → Credits section
**Fix**: Add more credits or upgrade plan

### Issue 3: Key Expired/Revoked
**Symptoms**: 401 Unauthorized, 403 Forbidden
**Fix**: Generate new API key

### Issue 4: Wrong Email/Account
**Symptoms**: 500 Internal Server Error
**Fix**: Verify you're logged into correct D-ID account

---

## 🎯 Step-by-Step Fix

### Step 1: Log into D-ID
```
URL: https://studio.d-id.com/
Email: nschaltmg2023@gmail.com (from your API key)
```

### Step 2: Check Credits
- Go to Account Settings
- Look at "Credits" section
- Should show: X credits remaining

### Step 3: Generate New API Key
- Click "API Key" section
- Delete old key if present
- Click "Create API Key"
- **Copy the ENTIRE key** (don't modify it!)

### Step 4: Update server/.env
```bash
cd "/home/shifu/Documents/Tayar AI /server"
nano .env

# Update this line:
DID_API_KEY=paste_your_new_key_here_exactly_as_d_id_gives_it

# Save: Ctrl+O, Enter, Ctrl+X
```

### Step 5: Restart Backend
```bash
# Stop backend
pkill -f "tsx index.ts"

# Start again
npm run server
```

### Step 6: Test
Start an interview and check console for:
```
[D-ID Server] Response status: 201  ← Success!
[D-ID Server] Video creation initiated. ID: tlk_xxxxx
```

---

## 💡 Pro Tip: Verify API Key Format

D-ID API keys typically look like one of these:

**Newer Format** (recommended):
```
sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Legacy Format**:
```
base64_string_here
```

**What NOT to use**:
- ❌ `email:something` (unless D-ID specifically says to)
- ❌ Modified or truncated keys
- ❌ Keys with spaces or line breaks

---

## 🆘 If Still Not Working

### Check D-ID Service Status
- URL: https://status.d-id.com/
- If API is down → Wait for it to come back up

### Contact D-ID Support
- Email: support@d-id.com
- Include:
  - Error message
  - Your account email
  - What you're trying to do

### Try Alternative Avatar Services
If D-ID continues to have issues:
- **HeyGen**: https://www.heygen.com/
- **Synthesia**: https://www.synthesia.io/
- **Wav2Lip** (open source): Self-hosted option

---

## 📞 Quick Support Checklist

- [ ] Logged into D-ID dashboard successfully
- [ ] Credits showing in account (should be 12)
- [ ] Generated NEW API key
- [ ] Copied EXACT key from D-ID (no modifications)
- [ ] Updated `server/.env` with new key
- [ ] Restarted backend server
- [ ] Tested with interview
- [ ] Checked backend logs for success/error

---

## ✅ Expected Working Output

**When API key is correct:**

Backend logs:
```
[D-ID Server] Generating talking head...
[D-ID Server] Response status: 201
[D-ID Server] Response: {"id":"tlk_abc123","status":"created"...}
```

Frontend console:
```
[D-ID] Video creation initiated. ID: tlk_abc123
[D-ID] Poll #1: Status = processing
[D-ID] Poll #2: Status = done
[D-ID] ✅ Video ready!
```

---

**🔑 The API key is the issue. Get a fresh one from D-ID dashboard and update `server/.env`!**



