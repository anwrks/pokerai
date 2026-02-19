# API Key Setup Guide

This app requires an Anthropic API key to function. **Never commit your API key to version control.**

## Quick Setup (Recommended)

### Option 1: Environment Variable (Development)

1. **Get your API key** from [Anthropic Console](https://console.anthropic.com)

2. **Set environment variable** in Xcode:
   - Edit Scheme: `Product → Scheme → Edit Scheme...`
   - Select `Run` in the left sidebar
   - Go to `Arguments` tab
   - Under `Environment Variables`, click `+`
   - Add:
     - **Name:** `ANTHROPIC_API_KEY`
     - **Value:** `sk-ant-api03-YOUR-KEY-HERE`

3. **Run the app** - it will automatically pick up the key

### Option 2: Info.plist (Distribution)

⚠️ **Security Note:** Only use this for personal builds. Do NOT commit Info.plist with your key to a public repo.

1. **Get your API key** from [Anthropic Console](https://console.anthropic.com)

2. **Add to Info.plist:**
   - Open `Info.plist` in Xcode
   - Right-click → `Add Row`
   - Key: `ANTHROPIC_API_KEY`
   - Type: `String`
   - Value: `sk-ant-api03-YOUR-KEY-HERE`

3. **Add Info.plist to .gitignore** (if not already):
   ```bash
   echo "*/Info.plist" >> .gitignore
   ```

## Production Setup (Backend Proxy)

For production apps, **never include API keys in the app**. Instead:

1. **Create a backend server** (Node.js, Python, etc.)
2. **Store API key on server** as environment variable
3. **App calls your backend** → Backend calls Anthropic
4. **Your backend** validates requests and rate limits

### Example Backend (Node.js/Express)

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/api/analyze-cards', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      req.body,
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'API call failed' });
  }
});

app.listen(3000);
```

Then update `Config.swift`:
```swift
static let apiBaseURL = "https://your-backend.com/api/analyze-cards"
```

## Verification

Run the app and check the console. You should see:
- ✅ `"API is working!"` - Success!
- ❌ `"API key not configured"` - Key missing/invalid

## Security Checklist

- [ ] API key is NOT in source code
- [ ] API key is NOT in git history
- [ ] Info.plist is in .gitignore (if using Option 2)
- [ ] Backend proxy is used for production builds
- [ ] Rate limiting is implemented
- [ ] Usage monitoring is enabled at [console.anthropic.com](https://console.anthropic.com)

## Troubleshooting

### "API key not configured" error
- Verify environment variable is set in Xcode scheme
- Or verify Info.plist has the key
- Restart Xcode after setting environment variables

### "Invalid API key" error
- Check key format: should start with `sk-ant-api03-`
- Verify key hasn't been revoked at [console.anthropic.com](https://console.anthropic.com)
- Check for extra spaces or line breaks

### "Quota exceeded" error
- Check usage at [console.anthropic.com](https://console.anthropic.com)
- Add credits or upgrade plan
- Implement caching to reduce API calls

## Cost Optimization Tips

- **Cache results:** Store analyzed hands to avoid re-analyzing
- **Batch requests:** Analyze multiple cards in one call when possible
- **Use Haiku:** Already configured (cheapest, fastest model)
- **Compress images:** Already implemented (800px width, 30% JPEG quality)
- **Monitor usage:** Set up billing alerts in Anthropic console

## Questions?

- [Anthropic API Docs](https://docs.anthropic.com)
- [Pricing](https://www.anthropic.com/pricing)
- [API Support](https://support.anthropic.com)
