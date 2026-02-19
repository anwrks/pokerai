# 🃏 AI Poker - Learn, Play, Master

> **Vision:** An AI-powered poker learning tool that evolves into a vibrant multiplayer poker community.

## 🎯 What Is This?

AI Poker is a **real-time poker hand analyzer** that uses your iPhone camera and AI to help you learn poker strategy. Point your camera at any poker game, and get instant analysis:

- 📊 **Hand strength** & win probability (2-11 players)
- 🧠 **AI commentary** with strategic advice
- 🎲 **Outs calculation** & pot odds
- 🏆 **Equity analysis** (hand equity + fold equity)
- 🎴 **Multi-game support:** Texas Hold'em, Omaha High, Omaha Hi-Lo

## 🚀 Current Features (v1.0)

### Core Functionality
- ✅ Real-time card scanning with Claude Vision
- ✅ Instant hand evaluation & recommendations
- ✅ Player count adjustment (2-11 players)
- ✅ Game mode switching (Hold'em, Omaha High, Omaha Hi-Lo)
- ✅ Manual card entry option
- ✅ Beautiful native iOS UI

### AI Analysis
- ✅ Hand strength calculation (1-9 scale)
- ✅ Win probability vs N opponents
- ✅ Outs & pot odds calculation
- ✅ Hand equity (probability of winning by river)
- ✅ Fold equity (probability opponents fold)
- ✅ Context-aware strategic recommendations
- ✅ "The Nuts" detection (absolute best hand)

### User Experience
- ✅ Ultra-wide camera support for better card capture
- ✅ Duplicate card filtering
- ✅ Error handling & user feedback
- ✅ Expandable info panels for learning
- ✅ Poker hand rankings reference
- ✅ Fixed bottom summary (current hand vs the nuts)

## 🎓 Perfect For

- **Beginners** learning hand rankings & odds
- **Intermediate players** improving decision-making
- **Home game players** wanting real-time analysis
- **Students** studying poker theory with live examples

## 🛣️ Roadmap to Multiplayer Community

### Phase 2: Enhanced Learning (Q2 2025)
- [ ] Hand history tracking & review
- [ ] Session statistics & trends
- [ ] Range analysis for opponent modeling
- [ ] Tournament mode with blind tracking
- [ ] Apple Watch companion for discrete analysis
- [ ] Offline mode with on-device ML model

### Phase 3: Social Features (Q3 2025)
- [ ] User accounts & profiles
- [ ] Share hand histories with friends
- [ ] Community hand discussions
- [ ] Follow pro players & strategy guides
- [ ] Achievement system & leaderboards

### Phase 4: Multiplayer Poker (Q4 2025)
- [ ] Real-time multiplayer tables (2-9 players)
- [ ] Private tables with friends
- [ ] Tournament mode (sit & go, MTTs)
- [ ] Play money system for practice
- [ ] In-game chat & emotes
- [ ] Spectator mode

### Phase 5: Community & Monetization (2026)
- [ ] Poker coaching marketplace
- [ ] User-created content (strategy guides)
- [ ] Premium features (advanced analytics)
- [ ] Real-money poker (where legal)
- [ ] Affiliate partnerships with poker sites
- [ ] Live tournament integration

## 🏗️ Technical Stack

### Current
- **Frontend:** SwiftUI (iOS 15+)
- **AI:** Claude 3.5 Haiku (vision + text)
- **Camera:** AVFoundation
- **Architecture:** MVVM pattern

### Future (Multiplayer)
- **Backend:** Node.js/Express + WebSocket (Socket.io)
- **Database:** PostgreSQL (user data) + Redis (real-time game state)
- **Cloud:** AWS/GCP for scalability
- **Analytics:** Mixpanel for user insights
- **Payments:** Stripe for subscriptions

## 🔧 Installation

### Prerequisites
- macOS with Xcode 14+
- iOS 15+ device (simulator won't work - needs camera)
- Anthropic API key ([Get one here](https://console.anthropic.com))

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/ai-poker.git
   cd ai-poker
   ```

2. **Configure API key** (see [API_KEY_SETUP.md](./API_KEY_SETUP.md))
   - Recommended: Environment variable in Xcode scheme
   - Never commit your API key!

3. **Open in Xcode**
   ```bash
   open PokerAI.xcodeproj
   ```

4. **Build & Run**
   - Connect iPhone
   - Select device in Xcode
   - Run (⌘R)

## 📖 How to Use

1. **Choose game mode:** Texas Hold'em, Omaha High, or Omaha Hi-Lo
2. **Set player count:** How many players at the table? (2-11)
3. **Scan hole cards:** Tap "Scan Hole Cards" and point at your cards
4. **Scan community cards:** After flop/turn/river, scan the board
5. **Get AI analysis:** Instant recommendations and odds

### Tips for Best Results
- ✅ Use good lighting
- ✅ Hold camera steady
- ✅ Ensure cards are flat and visible
- ✅ Avoid glare or shadows
- ✅ Use manual entry if camera struggles

## 🤝 Contributing

We're building something amazing together! Here's how you can help:

### Areas Where We Need Help
- **iOS Development:** UI/UX improvements, performance optimization
- **Backend:** Preparing for multiplayer infrastructure
- **Game Logic:** Advanced poker calculations, range analysis
- **AI/ML:** Improving hand detection accuracy
- **Design:** UI/UX, branding, marketing materials
- **Testing:** Finding bugs, suggesting features

### How to Contribute
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use SwiftUI best practices
- Comment complex logic
- Follow existing architecture patterns
- Write descriptive commit messages

## 📊 Project Structure

```
ai-poker/
├── PokerAI/                    # iOS app
│   ├── PokerAIApp.swift        # App entry point
│   ├── ContentView.swift       # Main UI
│   ├── PokerViewModel.swift    # Game logic & AI calls
│   ├── CameraView.swift        # Camera integration
│   └── Config.swift            # Configuration management
├── backend/                    # Future: Node.js backend
├── docs/                       # Documentation
├── API_KEY_SETUP.md           # API key configuration guide
└── README.md                   # You are here
```

## 🔒 Security & Privacy

- ✅ **API keys never in source code** (Config.swift + environment variables)
- ✅ **No data collection** (currently - app is 100% local)
- ✅ **No user tracking** (yet)
- 🔜 **User accounts** (opt-in, encrypted, GDPR-compliant)
- 🔜 **End-to-end encryption** for private games

## 💰 Cost Considerations

**Current (Learning Tool):**
- Anthropic API costs: ~$0.01-0.02 per hand analysis
- Typical session (30 hands): ~$0.30-0.60
- Use environment variables to control your own API costs

**Future (Multiplayer):**
- Play money tables: Free forever
- Premium features: TBD (likely $5-10/month)
- Real money poker: Standard rake/tournament fees

## 📜 License

MIT License - see [LICENSE](LICENSE) for details

**Important:** This is for educational purposes. Always follow local gambling laws. The app should not be used for cheating in real poker games.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- Poker community for strategy insights
- Open source contributors (you!)

## 📞 Contact & Community

- **Issues:** [GitHub Issues](https://github.com/your-username/ai-poker/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/ai-poker/discussions)
- **Twitter:** [@ai_poker](https://twitter.com/ai_poker) (coming soon)
- **Discord:** [Join our community](https://discord.gg/ai-poker) (coming soon)

## 🎯 Goals for 2025

1. **Q1:** Polish v1.0, fix bugs, improve card detection
2. **Q2:** Add hand history, session tracking, offline mode
3. **Q3:** Launch social features, build community
4. **Q4:** Beta test multiplayer poker
5. **2026:** Full launch with real-money poker (where legal)

---

**Built with ❤️ by poker players, for poker players.**

Let's make the best poker learning tool and community on the planet. 🚀

---

## Quick Links

- [API Setup Guide](./API_KEY_SETUP.md)
- [Poker AI Setup Guide](./PokerAI/SETUP_GUIDE.md)
- [Contributing Guidelines](./CONTRIBUTING.md) (coming soon)
- [Changelog](./CHANGELOG.md) (coming soon)
