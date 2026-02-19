# Changelog

All notable changes to AI Poker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Hand history tracking
- Session statistics
- Range analysis
- Tournament mode
- Apple Watch companion
- Offline mode with on-device ML

## [1.0.0] - 2025-01-XX (In Progress)

### 🔒 Security
- **CRITICAL:** Removed hardcoded Anthropic API key from source code
- Added `Config.swift` for secure configuration management
- API key now loaded from environment variables or Info.plist
- Added comprehensive `.gitignore` to prevent accidental secret commits
- Added API key validation before making requests

### 🐛 Bug Fixes
- Fixed invalid model name in `testAPI()` function (`claude-sonnet-4-20250514` → `claude-3-5-haiku-20241022`)
- Removed redundant type cast in `PokerAIApp.swift` (`ContentView() as ContentView` → `ContentView()`)
- Clarified `reset()` behavior - game mode AND player count now persist across resets

### ✨ Features
- Real-time card scanning with Claude Vision API
- Instant hand evaluation for Texas Hold'em, Omaha High, and Omaha Hi-Lo
- Player count adjustment (2-11 players)
- Win probability calculation adjusted for opponent count
- Outs and pot odds calculation
- Hand equity and fold equity analysis
- "The Nuts" detection (identifies absolute best possible hand)
- AI commentary with strategic recommendations
- Manual card entry option
- Beautiful native SwiftUI interface
- Expandable info panels for learning
- Poker hand rankings reference
- Fixed bottom summary showing current hand vs the nuts

### 📚 Documentation
- Comprehensive `README.md` with project vision and roadmap
- `API_KEY_SETUP.md` - Step-by-step API key configuration
- `MIGRATION_GUIDE.md` - How to migrate from hardcoded key version
- Security best practices documentation
- Cost optimization tips
- Contributing guidelines (coming soon)

### ⚠️ Breaking Changes
- Users must now configure API key via environment variable or Info.plist
- Existing users should revoke old API keys (see `MIGRATION_GUIDE.md`)

### 🏗️ Technical Improvements
- Centralized configuration in `Config.swift`
- Consistent model usage across all API calls
- Better error handling for missing API keys
- Improved code organization and documentation

## [0.1.0] - 2025-01-XX (Initial Version)

### Features
- Basic card scanning
- Hand strength calculation
- Win probability estimation
- Simple UI

### Issues
- ❌ Hardcoded API key (security vulnerability)
- ❌ Inconsistent model names
- ❌ Poor documentation
- ❌ No migration path

---

## Migration Notes

### From 0.1.0 to 1.0.0

**CRITICAL:** Your old API key was in the source code and should be revoked immediately.

1. Revoke old API key at [Anthropic Console](https://console.anthropic.com)
2. Create new API key
3. Pull latest code
4. Configure new key (see `API_KEY_SETUP.md`)
5. Test the app

See `MIGRATION_GUIDE.md` for detailed instructions.

---

## Contributing

See upcoming `CONTRIBUTING.md` for how to contribute to this project.

## Links

- [Project Roadmap](./README.md#-roadmap-to-multiplayer-community)
- [API Setup](./API_KEY_SETUP.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [GitHub Issues](https://github.com/your-username/ai-poker/issues)
