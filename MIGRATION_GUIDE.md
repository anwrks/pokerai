# Migration Guide: Hardcoded API Key → Config-Based

If you had a previous version with a hardcoded API key, here's how to migrate safely.

## ⚠️ URGENT: Security Steps

### 1. Revoke Your Old API Key

Your API key was in the source code, so it's compromised:

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Navigate to **API Keys**
3. Find your key (starts with `sk-ant-api03-`)
4. Click **Revoke**
5. Create a **new key**

### 2. Remove Key from Git History

Even after updating the code, your old key is still in git history:

```bash
# Check if your key is in git history
git log --all --full-history --source -- '*PokerViewModel.swift' | grep "sk-ant"

# Option A: If repo is private and you're the only user
# Just revoke the key and move on (simplest)

# Option B: If repo is public or shared, remove from history
# WARNING: This rewrites history - coordinate with collaborators!
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch PokerAI/PokerViewModel.swift" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (⚠️ only if you understand the implications!)
git push origin --force --all
git push origin --force --tags
```

### 3. Set Up New API Key Securely

Follow [API_KEY_SETUP.md](./API_KEY_SETUP.md) to add your **new** API key via:
- **Recommended:** Environment variable in Xcode
- **Alternative:** Info.plist (ensure it's in .gitignore)

## 📝 Code Changes Summary

### What Changed

1. **New file:** `Config.swift`
   - Centralized configuration
   - Reads API key from environment/Info.plist
   - No hardcoded secrets

2. **Updated:** `PokerViewModel.swift`
   - Uses `Config.anthropicAPIKey` instead of hardcoded key
   - Uses `Config.AI.visionModel` and `Config.AI.textModel`
   - Validates API key before making requests

3. **Fixed bugs:**
   - Invalid model name in `testAPI()` function
   - Redundant type cast in `PokerAIApp.swift`
   - Clarified reset behavior comment

4. **New files:**
   - `.gitignore` - Prevents accidental API key commits
   - `API_KEY_SETUP.md` - Setup instructions
   - `README.md` - Project documentation
   - `MIGRATION_GUIDE.md` - This file

## 🚀 Migration Steps

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Revoke old API key** (see above)

3. **Get new API key** from Anthropic Console

4. **Set environment variable in Xcode**
   - Product → Scheme → Edit Scheme...
   - Run → Arguments → Environment Variables
   - Add: `ANTHROPIC_API_KEY` = `sk-ant-api03-YOUR-NEW-KEY`

5. **Test the app**
   - Build & Run
   - Check console for "✅ API is working!"
   - Try scanning some cards

6. **Verify security**
   ```bash
   # Make sure no API keys in source
   grep -r "sk-ant-api03" . --exclude-dir=.git

   # Should only find references in .md files (documentation)
   # NOT in .swift files
   ```

## 🔍 Troubleshooting

### "API key not configured" error

- Check Xcode scheme environment variables
- Ensure variable name is exactly `ANTHROPIC_API_KEY`
- Restart Xcode after setting the variable

### Old key still in code

You might have uncommitted changes. Check:
```bash
git status
git diff PokerAI/PokerViewModel.swift
```

If you see your old key, it means you haven't pulled the latest changes.

### Git refusing to pull

If you have local changes:
```bash
# Stash your changes
git stash

# Pull latest
git pull origin main

# Re-apply your changes (if needed)
git stash pop
```

## 📊 Before/After Comparison

### Before (❌ Insecure)
```swift
request.setValue("sk-ant-api03-HARDCODED-KEY", forHTTPHeaderField: "x-api-key")
```

### After (✅ Secure)
```swift
guard Config.hasValidAPIKey else {
    // Show error to user
    return
}
request.setValue(Config.anthropicAPIKey, forHTTPHeaderField: "x-api-key")
```

## 🎯 Best Practices Going Forward

1. **Never commit secrets** - Use environment variables or secure key storage
2. **Use .gitignore** - Already configured to protect sensitive files
3. **Rotate keys regularly** - Every 90 days is good practice
4. **Monitor usage** - Set up billing alerts in Anthropic Console
5. **Plan for production** - Move to backend proxy before app store release

## ✅ Migration Checklist

- [ ] Old API key revoked
- [ ] New API key created
- [ ] New key added to Xcode environment variables
- [ ] Latest code pulled from git
- [ ] App builds without errors
- [ ] App successfully scans cards
- [ ] No `sk-ant-api03-` strings in source code (except docs)
- [ ] `.gitignore` is configured
- [ ] Team members notified (if applicable)

## 🆘 Still Having Issues?

1. Check the console logs for detailed error messages
2. Open an issue on GitHub with error details
3. Review [API_KEY_SETUP.md](./API_KEY_SETUP.md) again

## 🎓 Learn More

- [Anthropic API Docs](https://docs.anthropic.com)
- [iOS Security Best Practices](https://developer.apple.com/documentation/security)
- [Git Secrets](https://github.com/awslabs/git-secrets) - Prevent committing secrets

---

**Welcome to the secure version of AI Poker! 🔒**
