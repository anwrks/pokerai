# 🃏 AI Poker Web App

Web version of the AI Poker hand analyzer. Test the iOS app features in your browser!

## 🚀 Quick Start

### Option 1: Python (Easiest)

```bash
cd web-app
python3 -m http.server 8000
```

Then open: **http://localhost:8000**

### Option 2: Node.js

```bash
cd web-app
npx serve .
```

### Option 3: PHP

```bash
cd web-app
php -S localhost:8000
```

## 🔑 Setup API Key

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Open the web app
3. Click the yellow "⚠️ Click to set API key" box
4. Paste your key (starts with `sk-ant-`)
5. Key is saved in your browser's localStorage

## ✨ Features

### 📸 Card Input
- **Manual Entry:** Click rank + suit to add cards
- **Image Upload:** Upload card photos for AI detection
- Works just like the iOS app!

### 🧠 AI Analysis
- Hand strength calculation
- Win probability (adjustable for 2-11 players)
- Outs and pot odds
- Strategic recommendations
- AI commentary

### 📊 Hand History
- Auto-saves every analyzed hand
- View past hands
- Export to JSON
- Clear history

### 🎮 Game Modes
- Texas Hold'em (2 hole cards)
- Omaha High (4 hole cards)
- Omaha Hi-Lo (4 hole cards + low hand)

## 🎯 How to Use

1. **Set your game mode** (Hold'em, Omaha)
2. **Choose player count** (2-11)
3. **Enter hole cards:**
   - Click "✏️ Manual Entry" and select rank/suit
   - Or upload an image of your cards
4. **Enter community cards:**
   - Same process - manual or upload
5. **Get instant analysis!**
   - Hand name
   - Win rate vs opponents
   - Outs to improve
   - Recommended action

## 🔍 Testing Card Detection

Upload test images to try the AI card detection:
- Take photos of playing cards
- Clear lighting works best
- Multiple cards in one image OK
- AI will detect all visible cards

## 💾 Data Storage

Everything is stored locally in your browser:
- API key → localStorage
- Hand history → localStorage
- No data sent anywhere except Anthropic API

## 🎨 UI Features

- Dark poker table theme (matches iOS app)
- Responsive design (works on mobile/desktop)
- Smooth animations
- Color-coded recommendations
- Live win rate calculations

## 🐛 Troubleshooting

### "API key not configured"
- Click the status box and enter your key
- Key must start with `sk-ant-`

### Image upload not working
- Make sure API key is set first
- Check browser console for errors
- Try a clearer image with better lighting

### Cards not detected
- Ensure cards are clearly visible
- Use good lighting
- Try manual entry as backup

## 🚀 Next Steps

This web app demonstrates:
- ✅ Hand history system (iOS feature)
- ✅ Session tracking (coming to iOS)
- ✅ Export functionality
- ✅ Multi-player adjustments
- ✅ All game modes

Try it out and see what we built! 🎉

## 📝 Development

The web app is vanilla HTML/CSS/JavaScript:
- `index.html` - UI structure
- `app.js` - All application logic
- No build step required!

Perfect for:
- Testing new features
- Quick demos
- Showing off to friends
- Developing without Xcode

## 🔗 Links

- **iOS App:** [GitHub Repo](https://github.com/anwrks/pokerai)
- **Get API Key:** [Anthropic Console](https://console.anthropic.com)
- **Documentation:** [Project README](../README.md)
