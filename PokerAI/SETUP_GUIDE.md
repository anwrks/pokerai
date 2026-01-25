# Quick Setup Guide

## Step-by-Step Installation

### 1. Prerequisites
- Mac with Xcode 14+ installed
- iPhone running iOS 15+
- Apple Developer account (free tier works)
- Anthropic API key

### 2. Create Xcode Project

```bash
# Open Xcode and create new project:
# iOS App → SwiftUI → Product Name: "PokerAnalyzer"
```

### 3. Add Source Files

Copy these files to your project:
1. `PokerAnalyzerApp.swift` - Replace Xcode's default
2. `ContentView.swift` - Replace Xcode's default
3. `PokerViewModel.swift` - Add new file
4. `CameraView.swift` - Add new file
5. `Info.plist` - Replace or merge with existing

### 4. Configure API Access

Open `PokerViewModel.swift` and add your API key:

```swift
// In the analyzeImage() function, after:
var request = URLRequest(url: url)
request.httpMethod = "POST"

// Add these lines:
request.setValue("YOUR_ANTHROPIC_API_KEY", forHTTPHeaderField: "x-api-key")
request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
```

### 5. Project Settings

1. Select your project in Xcode
2. Go to "Signing & Capabilities"
3. Select your Team
4. Bundle Identifier: `com.yourname.PokerAnalyzer`

### 6. Build & Run

1. Connect iPhone via USB
2. Trust computer on iPhone if prompted
3. Select iPhone as target device (top of Xcode)
4. Click Run button (▶️)
5. Grant camera permission when app launches

## Folder Structure in Xcode

```
PokerAnalyzer/
├── PokerAnalyzer/
│   ├── PokerAnalyzerApp.swift
│   ├── ContentView.swift
│   ├── PokerViewModel.swift
│   ├── CameraView.swift
│   ├── Assets.xcassets/
│   └── Info.plist
└── README.md
```

## Common Issues

### "Failed to code sign"
- Solution: Select your Apple ID in Signing & Capabilities

### "Camera permission denied"
- Solution: Check Info.plist has NSCameraUsageDescription

### "Build failed"
- Solution: Make sure iOS Deployment Target is 15.0+

### API calls failing
- Solution: Verify API key is correct and has credits

## Testing Without API Key

To test the UI without API integration:

1. Comment out the API call in `analyzeImage()`
2. Add mock data:
```swift
DispatchQueue.main.async {
    self.holeCards = ["AS", "KH"]
    self.calculateStats()
}
```

## Next Steps

1. Test with real cards
2. Adjust lighting for best results
3. Customize UI colors/styles
4. Add features (see README for ideas)

## Getting Your API Key

1. Go to https://console.anthropic.com
2. Create account or sign in
3. Navigate to API Keys
4. Create new key
5. Copy and paste into the app

⚠️ **Important**: Never share your API key or commit it to git!
