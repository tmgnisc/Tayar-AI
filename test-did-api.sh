#!/bin/bash

# Test D-ID API directly
# Usage: ./test-did-api.sh

API_KEY="bnNjaGFsdG1nMjAyM0BnbWFpbC5jb20:kP1W4V6UIRnYbDNtnJKyu"

echo "Testing D-ID API..."
echo "API Key: ${API_KEY:0:20}..."
echo ""

curl -X POST 'https://api.d-id.com/talks' \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "authorization: Basic $API_KEY" \
  -d '{
    "source_url": "https://randomuser.me/api/portraits/women/44.jpg",
    "script": {
      "type": "text",
      "input": "Hello! This is a test.",
      "provider": {
        "type": "microsoft",
        "voice_id": "en-US-JennyNeural"
      }
    }
  }' \
  --verbose

echo ""
echo "Test complete!"



