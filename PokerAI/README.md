# Poker Hand Analyzer - iOS App

A native iOS app that uses your iPhone camera to scan poker cards in real-time and provides live statistics, hand strength analysis, and strategic recommendations.

## Features

- 📸 **Real-time Card Scanning**: Uses iPhone camera and AI to recognize poker cards
- 🧠 **AI-Powered Recognition**: Claude Vision API identifies cards with high accuracy
- 📊 **Live Statistics**: 
  - Current hand strength (High Card through Straight Flush)
  - Win probability percentage
  - Number of outs and pot odds
  - Strategic recommendations (Fold, Check/Call, Call, Bet/Raise)
- 🎯 **Game State Tracking**: Automatically tracks pre-flop, flop, turn, and river
- 🎨 **Beautiful UI**: Native SwiftUI interface with poker table aesthetics

## Requirements

- iOS 15.0 or later
- Xcode 14.0 or later
- iPhone with camera
- Anthropic API access (for card recognition)

## Installation

### 1. Clone or Download the Project

Download all the Swift files to your Mac:
- `PokerAnalyzerApp.swift`
- `ContentView.swift`
- `PokerViewModel.swift`
- `CameraView.swift`
- `Info.plist`

### 2. Create New Xcode Project

1. Open Xcode
2. File → New → Project
3. Choose "iOS" → "App"
4. Product Name: `PokerAnalyzer`
5. Interface: SwiftUI
6. Language: Swift
7. Click "Next" and save

### 3. Add the Files

1. Delete the default `ContentView.swift` and `PokerAnalyzerApp.swift` that Xcode created
2. Drag all the downloaded Swift files into your Xcode project
3. Replace the existing `Info.plist` with the provided one (or add the camera permission key manually)

### 4. Configure Camera Permissions

The `Info.plist` already includes the required camera permission. If you're adding it manually:

1. Open `Info.plist`
2. Add a new row: `Privacy - Camera Usage Description`
3. Value: "This app needs camera access to scan poker cards and analyze your hand in real-time."

### 5. API Configuration (Important!)

⚠️ **The app currently makes direct API calls to Anthropic. For production use, you should:**

1. **Option A - API Key in Code (Quick Test Only)**:
   - Open `PokerViewModel.swift`
   - Find the `analyzeImage` function
   - Add this line after creating the request:
   ```swift
   request.setValue("YOUR_API_KEY_HERE", forHTTPHeaderField: "x-api-key")
   request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
   ```

2. **Option B - Backend Server (Recommended)**:
   - Create a backend server that handles API calls
   - Store your API key securely on the server
   - Modify the app to call your backend instead of Anthropic directly
   - This prevents exposing your API key in the app

### 6. Build and Run

1. Connect your iPhone to your Mac
2. Select your iPhone as the target device
3. Click the "Run" button (▶️) or press `Cmd + R`
4. Grant camera permissions when prompted
5. Start scanning cards!

## Project Structure

```
PokerAnalyzer/
├── PokerAnalyzerApp.swift      # App entry point
├── ContentView.swift            # Main UI view
├── PokerViewModel.swift         # Business logic & API calls
├── CameraView.swift             # Camera preview integration
└── Info.plist                   # Permissions configuration
```

## How to Use

1. **Start the App**: Launch the app on your iPhone
2. **Scan Hole Cards**: 
   - Tap "Scan Hole Cards"
   - Point camera at your two pocket cards
   - Tap "Capture & Analyze"
3. **Scan Community Cards**:
   - After seeing the flop, tap "Scan Community Cards"
   - Point camera at the flop cards (can scan 3 at once)
   - Repeat for turn and river
4. **View Statistics**: The app automatically calculates and displays:
   - Your current hand strength
   - Win probability
   - Available outs
   - Recommended action

## Technical Details

### Card Recognition
- Uses Claude Vision API (Sonnet 4)
- Converts camera image to base64
- AI identifies all visible cards in the frame
- Returns cards in standard notation (e.g., "AS" for Ace of Spades)

### Hand Analysis
- Implements full poker hand ranking system
- Calculates outs based on current hand
- Estimates pot odds and implied odds
- Pre-flop win rates based on starting hand strength

### Camera Integration
- Uses AVFoundation framework
- Captures high-quality photos for analysis
- Real-time preview with targeting overlay
- Handles permissions and errors gracefully

## Card Notation

- **Ranks**: A, K, Q, J, T (10), 9, 8, 7, 6, 5, 4, 3, 2
- **Suits**: S (Spades ♠), H (Hearts ♥), D (Diamonds ♦), C (Clubs ♣)
- **Examples**: "AS" = Ace of Spades, "KH" = King of Hearts

## Tips for Best Results

- ✅ Use good lighting - natural light works best
- ✅ Hold camera steady when capturing
- ✅ Ensure cards are flat and clearly visible
- ✅ Frame all cards you want to scan in the camera view
- ✅ Avoid glare or shadows on the cards
- ✅ Cards should be right-side up for best recognition

## Troubleshooting

### Camera Won't Open
- Check that camera permissions are granted in Settings → PokerAnalyzer
- Ensure Info.plist includes camera usage description
- Restart the app

### Cards Not Recognized
- Improve lighting conditions
- Make sure cards are clearly visible and not blurry
- Try capturing again with cards positioned differently
- Ensure cards are standard poker playing cards

### API Errors
- Verify your API key is correctly configured
- Check your internet connection
- Ensure you have API credits available
- Check Xcode console for detailed error messages

## Future Enhancements

Potential features for future versions:
- [ ] Multiple player support
- [ ] Hand history tracking
- [ ] Opponent range analysis
- [ ] Tournament mode with blinds tracking
- [ ] Export hand histories
- [ ] Offline mode with pre-trained model
- [ ] Apple Watch companion app
- [ ] iCloud sync across devices

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit API keys to version control**
2. **Use environment variables or secure key storage**
3. **Implement backend API proxy for production**
4. **Add rate limiting to prevent API abuse**
5. **Consider using Apple's Vision framework as an alternative**

## License

This project is provided as-is for educational purposes. Please ensure you comply with:
- Anthropic's API terms of service
- Apple's App Store guidelines (if distributing)
- Gambling laws in your jurisdiction (app is for educational/practice use)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Xcode console logs for error details
3. Verify all setup steps were completed
4. Test camera permissions in Settings

## Disclaimer

This app is for educational and entertainment purposes only. It should not be used for illegal gambling or cheating in real poker games. Always follow the rules and regulations of any poker game you participate in.

---

**Built with ❤️ using Swift, SwiftUI, and Claude AI**
