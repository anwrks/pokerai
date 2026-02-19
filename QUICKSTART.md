# 🚀 Quick Start Guide

Get AI Poker running in 5 minutes!

## Prerequisites

- ✅ Mac with Xcode 14+ installed
- ✅ iPhone running iOS 15+ (simulator won't work - needs camera)
- ✅ Anthropic API key ([Get free trial here](https://console.anthropic.com))

## Step 1: Get an API Key (2 minutes)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy your key (starts with `sk-ant-api03-`)

💡 **Tip:** Anthropic offers free trial credits!

## Step 2: Clone & Setup (1 minute)

```bash
# Clone the repo
git clone https://github.com/your-username/ai-poker.git
cd ai-poker

# Open in Xcode
open PokerAI.xcodeproj
```

## Step 3: Add API Key (1 minute)

In Xcode:

1. Go to **Product → Scheme → Edit Scheme...**
2. Select **Run** in the left sidebar
3. Click **Arguments** tab
4. Under **Environment Variables**, click **+**
5. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-api03-YOUR-KEY-HERE` (paste your key)
6. Click **Close**

![Xcode Environment Variable Setup](docs/images/xcode-env-setup.png)

## Step 4: Run! (1 minute)

1. Connect your iPhone to your Mac
2. Unlock iPhone and trust computer if prompted
3. In Xcode toolbar, select your iPhone as the target device
4. Press **⌘R** (or click ▶️ Run button)
5. On iPhone, allow camera permission when prompted

## Step 5: Test It Out!

1. **Choose game mode:** Tap Texas Hold'em (or Omaha if you're fancy)
2. **Set players:** Tap the player count selector, choose 2-11 players
3. **Scan cards:** 
   - Tap "Scan Hole Cards"
   - Point camera at 2 cards
   - Tap "Capture Cards"
4. **Get analysis:** See instant hand strength, odds, and recommendations!

### First Hand Example

Try these cards to test:
- **Hole cards:** A♠ K♠ (pocket rockets suited!)
- **Flop:** Q♠ J♠ 10♦ (royal flush draw!)
- **Turn:** 9♥
- **River:** 2♣

Expected result: **Straight** (A-K-Q-J-10), ~95% win rate vs 1 opponent 🎉

## 🎯 Tips for Success

### Card Scanning
- ✅ Use good lighting (natural light is best)
- ✅ Hold camera steady
- ✅ Place cards flat, facing camera
- ✅ Avoid glare or shadows
- ✅ Ultra-wide camera gives best view

### If Scanning Fails
- Tap **Manual Entry** button instead
- Select rank (A, K, Q, etc.)
- Select suit (♠ ♥ ♦ ♣)
- Card is added automatically

### Save on API Costs
Each hand analysis costs ~$0.01-0.02 with Claude Haiku.

To reduce costs:
- Use manual entry when camera struggles (no API call)
- Don't re-scan cards you already captured
- Clear cards and start fresh each session

## 🆘 Troubleshooting

### "API key not configured"
- ❌ Make sure you added the environment variable in Xcode scheme
- ❌ Verify the variable name is exactly `ANTHROPIC_API_KEY`
- ✅ Try: Restart Xcode and run again

### "Camera permission denied"
- ✅ Go to iPhone Settings → AI Poker → Camera → Enable

### Cards not detected
- ✅ Improve lighting
- ✅ Make sure cards are clearly visible
- ✅ Try holding camera closer or farther
- ✅ Use manual entry as backup

### Build errors
- ✅ Make sure you have Xcode 14+
- ✅ Clean build folder: Product → Clean Build Folder (⇧⌘K)
- ✅ Restart Xcode

## 📚 Next Steps

Once you're comfortable with the basics:

1. **Learn the features:**
   - Try different game modes (Hold'em, Omaha, Omaha Hi-Lo)
   - Adjust player count to see odds change
   - Tap info icons to learn about equity
   - Check out "Poker Hand Rankings" reference

2. **Read the docs:**
   - [Full README](./README.md) - Project vision & roadmap
   - [API Setup Guide](./API_KEY_SETUP.md) - Advanced configuration
   - [Changelog](./CHANGELOG.md) - What's new

3. **Get involved:**
   - ⭐ Star the repo on GitHub
   - 🐛 Report bugs via Issues
   - 💡 Suggest features via Discussions
   - 🤝 Contribute code (PR welcome!)

## 🎓 Learning Poker?

### Use AI Poker to Learn:
1. **Hand rankings:** Tap "Poker Hand Rankings" to study
2. **Starting hands:** Scan random 2-card combos, see which are strong
3. **Outs:** Notice how the app counts your outs on each street
4. **Equity:** Compare hand equity vs fold equity to understand leverage
5. **Player count:** See how odds change with 2 vs 9 opponents

### Pro Tips:
- Play with friends and compare your hands
- Use it during online poker (play money) to learn faster
- Study the AI commentary for strategic insights
- Track patterns: Which hands win most often?

## 🚀 Join the Community

We're building something awesome:

- **Discord:** [discord.gg/ai-poker](https://discord.gg/ai-poker) (coming soon)
- **Twitter:** [@ai_poker](https://twitter.com/ai_poker) (coming soon)
- **GitHub:** Star, watch, contribute!

---

**You're all set! Now go analyze some hands! 🃏**

Questions? Open an issue on GitHub or check the [full documentation](./README.md).
