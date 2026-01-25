import SwiftUI
import AVFoundation
import Combine

enum CaptureType {
    case hole
    case community
}

enum GameMode: String, CaseIterable {
    case texasHoldem = "Texas Hold'em"
    case omahaHiLo = "Omaha Hi-Lo"
    case omahaHigh = "Omaha High"
}

struct PokerStats: Equatable {
    let handStrength: Int
    let handName: String
    let winRate: Int
    let outs: Int
    let potOdds: Double
    let recommendation: (action: String, color: [Color])
    let aiCommentary: String
    let lowHand: String?
    let omahaAnalysis: String?
    let playerCount: Int
    let adjustedWinRate: Int
    let handEquity: Double
    let foldEquity: Double
    
    static func == (lhs: PokerStats, rhs: PokerStats) -> Bool {
        return lhs.handStrength == rhs.handStrength &&
               lhs.handName == rhs.handName &&
               lhs.winRate == rhs.winRate &&
               lhs.outs == rhs.outs &&
               lhs.potOdds == rhs.potOdds &&
               lhs.recommendation.action == rhs.recommendation.action &&
               lhs.aiCommentary == rhs.aiCommentary &&
               lhs.lowHand == rhs.lowHand &&
               lhs.omahaAnalysis == rhs.omahaAnalysis &&
               lhs.playerCount == rhs.playerCount &&
               lhs.adjustedWinRate == rhs.adjustedWinRate
    }
}

class PokerViewModel: NSObject, ObservableObject {
    @Published var holeCards: [String] = []
    @Published var communityCards: [String] = []
    @Published var gameState: String = "pre-flop"
    @Published var stats: PokerStats?
    @Published var showCamera: Bool = false
    @Published var isAnalyzing: Bool = false
    @Published var errorMessage: String?
    @Published var autoCaptureEnabled: Bool = false
    @Published var autoCaptureCountdown: Int = 0
    @Published var gameMode: GameMode = .texasHoldem
    @Published var showManualEntry: Bool = false
    @Published var playerCount: Int = 2
    
    var currentCaptureType: CaptureType?
    var captureSession: AVCaptureSession?
    var photoOutput: AVCapturePhotoOutput?
    var previewLayer: AVCaptureVideoPreviewLayer?
    var autoCaptureTimer: Timer?
    
    func startCapture(type: CaptureType) {
        currentCaptureType = type
        
        // Check camera permissions first
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            showCamera = true
            setupCamera()
            
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    if granted {
                        self?.showCamera = true
                        self?.setupCamera()
                    } else {
                        self?.errorMessage = "Camera access denied. Please enable in Settings."
                    }
                }
            }
            
        case .denied, .restricted:
            errorMessage = "Camera access denied. Please enable in Settings → PokerAnalyzer → Camera"
            
        @unknown default:
            errorMessage = "Camera permission error"
        }
    }
    
    func stopCapture() {
        cancelAutoCapture()
        
        DispatchQueue.main.async { [weak self] in
            self?.showCamera = false
        }
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.stopRunning()
            self?.captureSession = nil
            self?.photoOutput = nil
            self?.previewLayer = nil
        }
    }
    
    func setupCamera() {
        // Stop any existing session first
        captureSession?.stopRunning()
        
        captureSession = AVCaptureSession()
        
        // Use a lower preset to reduce camera errors
        captureSession?.sessionPreset = .high
        
        // Try to use ultra wide camera first (most zoomed out), fallback to wide
        let deviceTypes: [AVCaptureDevice.DeviceType] = [
            .builtInUltraWideCamera,  // Most zoomed out
            .builtInWideAngleCamera,  // Standard wide
            .builtInDualWideCamera    // Dual wide
        ]
        
        var videoCaptureDevice: AVCaptureDevice?
        
        for deviceType in deviceTypes {
            if let device = AVCaptureDevice.default(deviceType, for: .video, position: .back) {
                videoCaptureDevice = device
                print("📷 Using camera: \(deviceType.rawValue)")
                break
            }
        }
        
        guard let videoCaptureDevice = videoCaptureDevice else {
            print("❌ No camera available")
            DispatchQueue.main.async {
                self.errorMessage = "Camera not available"
            }
            return
        }
        
        // Configure camera settings for maximum field of view
        do {
            try videoCaptureDevice.lockForConfiguration()
            
            // Set focus mode to continuous if available
            if videoCaptureDevice.isFocusModeSupported(.continuousAutoFocus) {
                videoCaptureDevice.focusMode = .continuousAutoFocus
            }
            
            // Set zoom to minimum (most zoomed out)
            videoCaptureDevice.videoZoomFactor = 1.0
            
            videoCaptureDevice.unlockForConfiguration()
        } catch {
            print("⚠️ Could not configure camera: \(error)")
        }
        
        guard let videoInput = try? AVCaptureDeviceInput(device: videoCaptureDevice) else {
            print("❌ Cannot create camera input")
            DispatchQueue.main.async {
                self.errorMessage = "Cannot access camera"
            }
            return
        }
        
        captureSession?.beginConfiguration()
        
        if captureSession?.canAddInput(videoInput) == true {
            captureSession?.addInput(videoInput)
        } else {
            print("❌ Cannot add video input")
            captureSession?.commitConfiguration()
            return
        }
        
        photoOutput = AVCapturePhotoOutput()
        
        // Configure photo output
        if let photoOutput = photoOutput {
            if captureSession?.canAddOutput(photoOutput) == true {
                captureSession?.addOutput(photoOutput)
            } else {
                print("❌ Cannot add photo output")
                captureSession?.commitConfiguration()
                return
            }
        }
        
        captureSession?.commitConfiguration()
        
        // Set photo dimensions AFTER configuration is committed and device is connected
        if #available(iOS 16.0, *), let photoOutput = photoOutput {
            // Set to a reasonable resolution for fast processing
            photoOutput.maxPhotoDimensions = CMVideoDimensions(width: 1920, height: 1080)
        }
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.startRunning()
            print("✅ Camera session started")
            
            // Start auto-capture countdown if enabled
            DispatchQueue.main.async {
                if self?.autoCaptureEnabled == true {
                    self?.startAutoCaptureCountdown()
                }
            }
        }
    }
    
    func startAutoCaptureCountdown() {
        autoCaptureCountdown = 1 // 1 second countdown (very fast)
        autoCaptureTimer?.invalidate()
        
        autoCaptureTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
            guard let self = self else {
                timer.invalidate()
                return
            }
            
            if self.autoCaptureCountdown > 1 {
                self.autoCaptureCountdown -= 1
            } else {
                timer.invalidate()
                self.autoCaptureCountdown = 0
                // Auto-capture!
                self.captureAndAnalyze()
            }
        }
    }
    
    func cancelAutoCapture() {
        autoCaptureTimer?.invalidate()
        autoCaptureTimer = nil
        autoCaptureCountdown = 0
    }
    
    func addManualCard(_ card: String) {
        if currentCaptureType == .hole {
            let requiredCards = gameMode == .omahaHiLo ? 4 : 2
            if holeCards.count < requiredCards {
                holeCards.append(card)
                print("🃏 Added hole card: \(card), total: \(holeCards)")
                
                if holeCards.count == requiredCards {
                    showManualEntry = false
                    calculateStats()
                }
            }
        } else {
            if communityCards.count < 5 {
                communityCards.append(card)
                print("🃏 Added community card: \(card), total: \(communityCards)")
                
                // Update game state
                if communityCards.count == 3 {
                    gameState = "flop"
                } else if communityCards.count == 4 {
                    gameState = "turn"
                } else if communityCards.count == 5 {
                    gameState = "river"
                }
                
                if communityCards.count >= 3 {
                    showManualEntry = false
                    let requiredHoleCards = gameMode == .omahaHiLo ? 4 : 2
                    if holeCards.count == requiredHoleCards {
                        calculateStats()
                    }
                }
            }
        }
    }
    
    func removeLastCard() {
        if currentCaptureType == .hole && !holeCards.isEmpty {
            holeCards.removeLast()
        } else if currentCaptureType == .community && !communityCards.isEmpty {
            communityCards.removeLast()
            
            // Update game state
            if communityCards.count < 3 {
                gameState = "pre-flop"
            } else if communityCards.count == 3 {
                gameState = "flop"
            } else if communityCards.count == 4 {
                gameState = "turn"
            }
        }
    }
    
    func sortCards(_ cards: [String]) -> [String] {
        return cards.sorted { card1, card2 in
            let rank1 = rankValue(String(card1.prefix(1)))
            let rank2 = rankValue(String(card2.prefix(1)))
            let suit1 = String(card1.suffix(1))
            let suit2 = String(card2.suffix(1))
            
            // Sort by rank first (high to low)
            if rank1 != rank2 {
                return rank1 > rank2
            }
            
            // If same rank, sort by suit (Spades > Hearts > Diamonds > Clubs)
            let suitOrder = ["S": 4, "H": 3, "D": 2, "C": 1]
            return (suitOrder[suit1] ?? 0) > (suitOrder[suit2] ?? 0)
        }
    }
    
    func recaptureCards(type: CaptureType) {
        if type == .hole {
            holeCards = []
            stats = nil
        } else {
            communityCards = []
            gameState = "pre-flop"
            stats = nil
        }
        startCapture(type: type)
    }
    
    func captureAndAnalyze() {
        guard let photoOutput = photoOutput else {
            print("❌ Photo output not available")
            return
        }
        
        isAnalyzing = true
        
        let settings = AVCapturePhotoSettings()
        
        // Disable flash
        settings.flashMode = .off
        
        print("📸 Capturing photo...")
        photoOutput.capturePhoto(with: settings, delegate: self)
    }
    
    func analyzeImage(_ image: UIImage) {
        guard let imageData = image.jpegData(compressionQuality: 0.5) else { // Reduced from 0.8 for faster upload
            isAnalyzing = false
            return
        }
        
        let base64String = imageData.base64EncodedString()
        
        // API request
        let url = URL(string: "https://api.anthropic.com/v1/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("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", forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        
        let body: [String: Any] = [
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 500, // Reduced from 1000 for faster response
            "messages": [
                [
                    "role": "user",
                    "content": [
                        [
                            "type": "image",
                            "source": [
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": base64String
                            ]
                        ],
                        [
                            "type": "text",
                            "text": "Look at this image and identify ONLY the playing cards that are clearly visible and in focus in THIS photo. Do not infer or imagine any cards that are not visible. Return ONLY a JSON array with the cards you can actually see. Each card should be in format like \"AS\" (Ace of Spades), \"KH\" (King of Hearts), \"10D\" (Ten of Diamonds), etc. Use: A,K,Q,J,10,9,8,7,6,5,4,3,2 for ranks and S,H,D,C for suits (Spades, Hearts, Diamonds, Clubs). IMPORTANT: Use \"10\" for tens, NOT \"T\". If you cannot clearly see any cards, return an empty array []. Return ONLY the JSON array, nothing else. Example: [\"AS\",\"KH\",\"10D\",\"9C\"]"
                        ]
                    ]
                ]
            ]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                self.isAnalyzing = false
            }
            
            if let error = error {
                print("❌ Network Error: \(error.localizedDescription)")
                DispatchQueue.main.async {
                    self.errorMessage = "Network error: \(error.localizedDescription)"
                }
                return
            }
            
            guard let data = data else {
                print("❌ No data received")
                DispatchQueue.main.async {
                    self.errorMessage = "No data received from server"
                }
                return
            }
            
            // Debug: Print response status
            if let httpResponse = response as? HTTPURLResponse {
                print("📡 HTTP Status Code: \(httpResponse.statusCode)")
                print("📡 Headers: \(httpResponse.allHeaderFields)")
                
                if httpResponse.statusCode != 200 {
                    if let errorString = String(data: data, encoding: .utf8) {
                        print("❌ Error Response Body: \(errorString)")
                        
                        // Try to parse error message
                        if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                           let errorObj = errorJson["error"] as? [String: Any],
                           let message = errorObj["message"] as? String {
                            DispatchQueue.main.async {
                                self.errorMessage = "API Error: \(message)"
                            }
                        } else {
                            DispatchQueue.main.async {
                                self.errorMessage = "API Error (Status \(httpResponse.statusCode)): Check console for details"
                            }
                        }
                        return
                    }
                }
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let content = json["content"] as? [[String: Any]],
                   let firstContent = content.first,
                   let text = firstContent["text"] as? String {
                    
                    var cleanedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
                    cleanedText = cleanedText.replacingOccurrences(of: "```json", with: "")
                    cleanedText = cleanedText.replacingOccurrences(of: "```", with: "")
                    cleanedText = cleanedText.trimmingCharacters(in: .whitespacesAndNewlines)
                    
                    if let jsonData = cleanedText.data(using: .utf8),
                       let cards = try JSONSerialization.jsonObject(with: jsonData) as? [String] {
                        
                        DispatchQueue.main.async {
                            print("✅ Cards detected: \(cards)")
                            
                            // Check if any cards were actually detected
                            if cards.isEmpty {
                                self.errorMessage = "No cards detected. Please ensure cards are clearly visible in the frame and try again."
                                self.stopCapture()
                                return
                            }
                            
                            if self.currentCaptureType == .hole {
                                // Remove any duplicate cards within the detected set
                                let uniqueCards = Array(Set(cards))
                                
                                let requiredCards = (self.gameMode == .omahaHiLo || self.gameMode == .omahaHigh) ? 4 : 2
                                
                                if uniqueCards.count < requiredCards {
                                    let gameType = (self.gameMode == .omahaHiLo || self.gameMode == .omahaHigh) ? "Omaha" : "Hold'em"
                                    self.errorMessage = "Need \(requiredCards) unique cards for \(gameType). Found only \(uniqueCards.count). Try again."
                                    self.stopCapture()
                                    return
                                }
                                
                                self.holeCards = Array(uniqueCards.prefix(requiredCards))
                                print("🃏 Hole cards set: \(self.holeCards)")
                                
                                // Log if duplicates were filtered
                                if cards.count > uniqueCards.count {
                                    let duplicateCount = cards.count - uniqueCards.count
                                    print("   (Filtered \(duplicateCount) duplicate card(s))")
                                }
                            } else {
                                // Community cards logic
                                let currentCommunityCount = self.communityCards.count
                                
                                // Get all known cards (hole + community)
                                let allKnownCards = self.holeCards + self.communityCards
                                
                                // Filter out duplicates - only keep new unique cards
                                let uniqueNewCards = cards.filter { !allKnownCards.contains($0) }
                                
                                if uniqueNewCards.isEmpty && !cards.isEmpty {
                                    self.errorMessage = "All detected cards are duplicates. Please show new cards."
                                    self.stopCapture()
                                    return
                                }
                                
                                // Log if duplicates were found and removed
                                let duplicates = cards.filter { allKnownCards.contains($0) }
                                if !duplicates.isEmpty {
                                    print("⚠️ Duplicate cards filtered out: \(duplicates)")
                                }
                                
                                if currentCommunityCount == 0 {
                                    // Scanning the flop - need 3 unique cards
                                    if uniqueNewCards.count < 3 {
                                        self.errorMessage = "Need 3 unique new cards for the flop. Found only \(uniqueNewCards.count). Try again."
                                        self.stopCapture()
                                        return
                                    }
                                    
                                    self.communityCards = Array(uniqueNewCards.prefix(3))
                                    self.gameState = "flop"
                                    print("🃏 Flop set: \(self.communityCards)")
                                    if !duplicates.isEmpty {
                                        print("   (Filtered duplicates: \(duplicates.joined(separator: ", ")))")
                                    }
                                    
                                } else if currentCommunityCount == 3 {
                                    // Scanning the turn - need 1 unique new card
                                    if uniqueNewCards.count < 1 {
                                        self.errorMessage = "No new unique cards found. Please show the turn card."
                                        self.stopCapture()
                                        return
                                    }
                                    // Add the first unique new card detected
                                    self.communityCards.append(uniqueNewCards[0])
                                    self.gameState = "turn"
                                    print("🃏 Turn added: \(uniqueNewCards[0]), total: \(self.communityCards)")
                                    if !duplicates.isEmpty {
                                        print("   (Filtered duplicates: \(duplicates.joined(separator: ", ")))")
                                    }
                                    
                                } else if currentCommunityCount == 4 {
                                    // Scanning the river - need 1 unique new card
                                    if uniqueNewCards.count < 1 {
                                        self.errorMessage = "No new unique cards found. Please show the river card."
                                        self.stopCapture()
                                        return
                                    }
                                    // Add the first unique new card detected
                                    self.communityCards.append(uniqueNewCards[0])
                                    self.gameState = "river"
                                    print("🃏 River added: \(uniqueNewCards[0]), total: \(self.communityCards)")
                                    if !duplicates.isEmpty {
                                        print("   (Filtered duplicates: \(duplicates.joined(separator: ", ")))")
                                    }
                                }
                            }
                            
                            self.stopCapture()
                            
                            let requiredHoleCards = (self.gameMode == .omahaHiLo || self.gameMode == .omahaHigh) ? 4 : 2
                            if self.holeCards.count == requiredHoleCards {
                                self.calculateStats()
                            }
                        }
                    }
                }
            } catch {
                print("Parsing error: \(error)")
            }
        }.resume()
    }
    
    func evaluateBestHand(holeCards: [String], communityCards: [String], completion: @escaping (String?) -> Void) {
        // Always try AI evaluation if we have any cards
        let allCards = holeCards + communityCards
        
        // If no community cards yet, skip AI evaluation (pre-flop)
        guard !communityCards.isEmpty else {
            print("⏭️ Skipping AI evaluation - no community cards yet (pre-flop)")
            completion(nil)
            return
        }
        
        let cardsString = allCards.joined(separator: ", ")
        
        print("🤖 AI evaluating hand...")
        print("   Hole cards: \(holeCards.joined(separator: ", "))")
        print("   Community: \(communityCards.joined(separator: ", "))")
        print("   Total cards: \(allCards.count)")
        
        let prompt: String
        if gameMode == .omahaHigh || gameMode == .omahaHiLo {
            prompt = "In Omaha poker, you MUST use exactly 2 cards from your hand and 3 from the board. Given hole cards: \(holeCards.joined(separator: ", ")) and community cards: \(communityCards.joined(separator: ", ")), what is the BEST possible poker hand? Respond with ONLY the hand name (e.g., 'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House', 'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'Pair', 'High Card'). No explanation, just the hand name."
        } else {
            prompt = "Given these Texas Hold'em cards: \(cardsString), what is the BEST possible 5-card poker hand? Consider all possible combinations. Respond with ONLY the hand name (e.g., 'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House', 'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'Pair', 'High Card'). No explanation, just the hand name."
        }
        
        print("   Prompt: \(prompt)")
        
        let url = URL(string: "https://api.anthropic.com/v1/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("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", forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        
        let body: [String: Any] = [
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 50,
            "messages": [
                ["role": "user", "content": prompt]
            ]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("❌ AI evaluation error: \(error.localizedDescription)")
                completion(nil)
                return
            }
            
            guard let data = data else {
                print("❌ AI evaluation: No data received")
                completion(nil)
                return
            }
            
            // Debug response
            if let responseString = String(data: data, encoding: .utf8) {
                print("📡 AI response: \(responseString)")
            }
            
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let content = json["content"] as? [[String: Any]],
                  let text = content.first?["text"] as? String else {
                print("❌ AI evaluation: Failed to parse response")
                completion(nil)
                return
            }
            
            let handName = text.trimmingCharacters(in: .whitespacesAndNewlines)
            print("✅ AI evaluated hand: \(handName)")
            completion(handName)
        }.resume()
    }
    
    func calculateStats() {
        let allCards = holeCards + communityCards
        
        print(String(repeating: "=", count: 60))
        print("📊 CALCULATE STATS STARTED")
        print(String(repeating: "=", count: 60))
        print("🃏 All cards: \(allCards)")
        print("   Hole cards: \(holeCards)")
        print("   Community: \(communityCards)")
        print("   Game mode: \(gameMode.rawValue)")
        print("   Players: \(playerCount)")
        
        // Use AI to evaluate the best hand
        evaluateBestHand(holeCards: holeCards, communityCards: communityCards) { [weak self] aiHandName in
            guard let self = self else { return }
            
            print("\n🔍 STARTING LOCAL EVALUATION")
            
            var rankCounts: [String: Int] = [:]
            var suitCounts: [String: Int] = [:]
            
            for card in allCards {
                let rank = String(card.prefix(card.count - 1))  // Handle both "10D" and "KS"
                let suit = String(card.suffix(1))
                rankCounts[rank, default: 0] += 1
                suitCounts[suit, default: 0] += 1
            }
            
            print("   Rank counts: \(rankCounts)")
            print("   Suit counts: \(suitCounts)")
            
            let ranks = allCards.map { 
                let rank = String($0.prefix($0.count - 1))
                return self.rankValue(rank)
            }.sorted(by: >)
            
            print("   Rank values: \(ranks)")
            
            let hasPair = rankCounts.values.contains(where: { $0 >= 2 })
            let hasThree = rankCounts.values.contains(where: { $0 >= 3 })
            let hasFour = rankCounts.values.contains(where: { $0 == 4 })
            let threeCount = rankCounts.values.filter { $0 == 3 }.count
            let pairCount = rankCounts.values.filter { $0 == 2 }.count
            let hasFlush = suitCounts.values.contains(where: { $0 >= 5 })
            
            var handStrength = 0
            var handName = aiHandName ?? "High Card"  // Use AI hand name if available
            
            print("\n🎲 Local evaluation:")
            print("   Three count: \(threeCount), Pair count: \(pairCount)")
            print("   Has flush: \(hasFlush)")
            print("   Total cards available: \(allCards.count)")
            
            // If AI didn't provide a hand name, use local evaluation
            if aiHandName == nil {
                print("   ⚠️ AI did not provide hand name - using local evaluation")
                let straight = self.isStraight(ranks: ranks)
                print("   Has straight: \(straight)")
                
                // For flop/turn/river with less than 5 cards, evaluate best possible hand
                let canMakeFlush = suitCounts.values.max() ?? 0
                let canMakeStraight = straight
                
                print("   Max suit count: \(canMakeFlush)")
                print("   Can make straight: \(canMakeStraight)")
                
                if hasFlush && straight {
                    handStrength = 9
                    handName = "Straight Flush"
                } else if hasFour {
                    handStrength = 8
                    handName = "Four of a Kind"
                } else if threeCount >= 1 && pairCount >= 1 {  // Full house needs separate three AND pair
                    handStrength = 7
                    handName = "Full House"
                } else if hasFlush {
                    handStrength = 6
                    handName = "Flush"
                } else if straight {
                    handStrength = 5
                    handName = "Straight"
                } else if hasThree {
                    handStrength = 4
                    handName = "Three of a Kind"
                } else if pairCount >= 2 {
                    handStrength = 3
                    handName = "Two Pair"
                } else if hasPair {
                    handStrength = 2
                    handName = "Pair"
                } else {
                    handStrength = 1
                    handName = "High Card"
                }
                print("   Local result: \(handName) (strength: \(handStrength))")
            } else {
                // Get strength from AI hand name
                handStrength = self.getHandStrength(handName: handName)
                print("   ✅ Using AI result: \(handName) (strength: \(handStrength))")
            }
            
            // Calculate low hand (Omaha Hi-Lo only)
            let (lowHand, lowQualifies) = self.gameMode == .omahaHiLo ? self.calculateLowHand(cards: allCards) : ("N/A", false)
            
            print("\n💰 CALCULATING WIN RATES")
            print("   Community cards count: \(self.communityCards.count)")
            
            // Calculate base win rate with better accuracy
            let baseWinRate: Int
            if self.communityCards.isEmpty {
                baseWinRate = self.estimatePreFlopWinRate()
                print("   Pre-flop estimation: \(baseWinRate)%")
            } else if self.communityCards.count == 5 {
                // On the river, use more accurate win rate based on hand strength
                print("   ON THE RIVER - using strength-based win rate")
                if handStrength >= 9 { // Straight Flush / Royal Flush
                    baseWinRate = 99
                    print("   → Straight Flush/Royal: 99%")
                } else if handStrength == 8 { // Four of a Kind
                    baseWinRate = 98
                    print("   → Four of a Kind: 98%")
                } else if handStrength == 7 { // Full House
                    baseWinRate = 95
                    print("   → Full House: 95%")
                } else if handStrength == 6 { // Flush
                    baseWinRate = 85
                    print("   → Flush: 85%")
                } else if handStrength == 5 { // Straight
                    baseWinRate = 75
                    print("   → Straight: 75%")
                } else if handStrength == 4 { // Three of a Kind
                    baseWinRate = 60
                    print("   → Three of a Kind: 60%")
                } else if handStrength == 3 { // Two Pair
                    baseWinRate = 50
                    print("   → Two Pair: 50%")
                } else if handStrength == 2 { // Pair
                    baseWinRate = 35
                    print("   → Pair: 35%")
                } else {
                    baseWinRate = 20 // High card
                    print("   → High Card: 20%")
                }
            } else {
                // Pre-river, use formula but cap it
                baseWinRate = min(95, handStrength * 10 + 10)
                print("   Pre-river formula: strength(\(handStrength)) * 10 + 10 = \(baseWinRate)%")
            }
            
            print("   ✅ Base win rate: \(baseWinRate)%")
            
            // Adjust win rate based on player count
            let onRiver = self.communityCards.count == 5
            print("\n👥 ADJUSTING FOR PLAYER COUNT")
            print("   Players: \(self.playerCount)")
            print("   On river: \(onRiver)")
            print("   Hand strength: \(handStrength)")
            
            let adjustedWinRate = self.adjustWinRateForPlayers(
                baseWinRate: baseWinRate,
                handStrength: handStrength,
                players: self.playerCount,
                onRiver: onRiver
            )
            
            print("   ✅ Adjusted win rate: \(adjustedWinRate)%")
            print("")
            
            // Calculate hand equity (probability of winning the pot)
            let handEquity = self.calculateHandEquity(handStrength: handStrength, outs: 0, cardsTocome: 5 - self.communityCards.count, players: self.playerCount)
            
            // Calculate fold equity (probability opponents fold)
            let foldEquity = self.calculateFoldEquity(handStrength: handStrength, gameState: self.gameState, players: self.playerCount)
            
            let outs = self.calculateOuts(rankCounts: rankCounts, suitCounts: suitCounts)
            let cardsRemaining = 5 - self.communityCards.count
            let potOdds = outs > 0 ? (cardsRemaining == 2 ? Double(outs) * 4 : Double(outs) * 2) : 0
            
            let recommendation = self.getRecommendation(strength: handStrength, winRate: adjustedWinRate)
            
            // Generate AI commentary
            let commentary = self.generateCommentary(
                handName: handName,
                handStrength: handStrength,
                winRate: adjustedWinRate,
                gameState: self.gameState,
                outs: outs,
                holeCards: self.holeCards,
                communityCards: self.communityCards,
                playerCount: self.playerCount
            )
            
            // Generate Omaha analysis if applicable (only for Hi-Lo, not for High-only)
            let omahaAnalysis = self.gameMode == .omahaHiLo ? self.generateOmahaAnalysis(
                highHand: handName,
                lowHand: lowHand,
                lowQualifies: lowQualifies,
                communityCount: self.communityCards.count
            ) : nil
            
            // Debug logging
            print("🔍 Stats calculated:")
            print("   Game Mode: \(self.gameMode.rawValue)")
            print("   Players: \(self.playerCount)")
            print("   High Hand: \(handName)")
            print("   Base Win Rate: \(baseWinRate)%")
            print("   Adjusted Win Rate: \(adjustedWinRate)%")
            print("   Hand Equity: \(String(format: "%.1f", handEquity))%")
            print("   Fold Equity: \(String(format: "%.1f", foldEquity))%")
            print("   Low Hand: \(lowHand) (Qualifies: \(lowQualifies))")
            print("   Omaha Analysis: \(omahaAnalysis ?? "nil")")
            
            // Update stats on main thread
            DispatchQueue.main.async {
                self.stats = PokerStats(
                    handStrength: handStrength,
                    handName: handName,
                    winRate: baseWinRate,
                    outs: outs,
                    potOdds: potOdds,
                    recommendation: recommendation,
                    aiCommentary: commentary,
                    lowHand: lowQualifies ? lowHand : nil,
                    omahaAnalysis: omahaAnalysis,
                    playerCount: self.playerCount,
                    adjustedWinRate: adjustedWinRate,
                    handEquity: handEquity,
                    foldEquity: foldEquity
                )
            }
        }
    }
    
    func getHandStrength(handName: String) -> Int {
        let lowercaseHand = handName.lowercased()
        if lowercaseHand.contains("straight flush") || lowercaseHand.contains("royal flush") {
            return 9
        } else if lowercaseHand.contains("four of a kind") || lowercaseHand.contains("quads") {
            return 8
        } else if lowercaseHand.contains("full house") || lowercaseHand.contains("boat") {
            return 7
        } else if lowercaseHand.contains("flush") {
            return 6
        } else if lowercaseHand.contains("straight") {
            return 5
        } else if lowercaseHand.contains("three of a kind") || lowercaseHand.contains("trips") || lowercaseHand.contains("set") {
            return 4
        } else if lowercaseHand.contains("two pair") {
            return 3
        } else if lowercaseHand.contains("pair") {
            return 2
        } else {
            return 1
        }
    }
    
    func calculateLowHand(cards: [String]) -> (String, Bool) {
        // For Omaha Hi-Lo, a low hand must have 5 cards 8 or lower, no pairs
        let lowRanks = cards.map { card -> Int? in
            let rank = String(card.prefix(card.count - 1))  // Handle both "10D" and "AS"
            let value = rankValue(rank)
            // Aces count as 1 for low
            if rank == "A" { return 1 }
            // Only cards 8 or lower qualify
            if value <= 8 { return value }
            return nil
        }.compactMap { $0 }
        
        // Need at least 5 qualifying cards
        guard lowRanks.count >= 5 else {
            return ("No low hand possible", false)
        }
        
        // Get 5 lowest unique cards
        let uniqueLowRanks = Array(Set(lowRanks)).sorted()
        
        guard uniqueLowRanks.count >= 5 else {
            return ("Paired - no low", false)
        }
        
        let bestLow = Array(uniqueLowRanks.prefix(5))
        
        // Check if qualifies (highest card must be 8 or lower)
        guard bestLow.last ?? 9 <= 8 else {
            return ("No qualifying low (needs 8 or better)", false)
        }
        
        // Format low hand (e.g., "8-7-5-3-A")
        let lowHandStr = bestLow.reversed().map { rank in
            rank == 1 ? "A" : "\(rank)"
        }.joined(separator: "-")
        
        return (lowHandStr, true)
    }
    
    func generateOmahaAnalysis(highHand: String, lowHand: String, lowQualifies: Bool, communityCount: Int) -> String? {
        // Only show Omaha analysis if there are community cards
        guard communityCount >= 3 else { return nil }
        
        let ruleReminder = "⚠️ Omaha Rule: Use exactly 2 from hand + 3 from board"
        
        if lowQualifies {
            return "🎯 OMAHA HI-LO: High: \(highHand) | Low: \(lowHand)\nYou're playing for both pots! Strong scoop potential.\n\(ruleReminder)"
        } else {
            return "⬆️ OMAHA HI-LO: High: \(highHand) | Low: \(lowHand)\nPlaying for high only.\n\(ruleReminder)"
        }
    }
    
    func adjustWinRateForPlayers(baseWinRate: Int, handStrength: Int, players: Int, onRiver: Bool) -> Int {
        print("   🔧 adjustWinRateForPlayers called:")
        print("      Base: \(baseWinRate)%, Strength: \(handStrength), Players: \(players), On river: \(onRiver)")
        
        // Very strong hands (8-9) - minimal adjustment even before river
        // Quads, Straight Flush - almost always win regardless of cards to come
        if handStrength >= 8 {
            let adjusted = max(95, baseWinRate - (players - 2))
            print("      → Very strong hand (8-9): \(baseWinRate) - \(players - 2) = \(adjusted)%")
            return adjusted
        }
        
        // Strong hands (6-7) on river: slight adjustment
        if onRiver && handStrength >= 6 {
            let adjusted = max(80, baseWinRate - ((players - 2) * 3))
            print("      → Strong hand (6-7) on river: \(baseWinRate) - (\(players - 2) × 3) = \(adjusted)%")
            return adjusted
        }
        
        // More players = lower individual win probability
        let playerMultipliers: [Int: Double] = [
            2: 1.0, 3: 0.85, 4: 0.72, 5: 0.62, 6: 0.54,
            7: 0.48, 8: 0.43, 9: 0.39, 10: 0.36, 11: 0.33
        ]
        
        let multiplier = playerMultipliers[players] ?? 0.30
        let strengthAdjustment = handStrength >= 6 ? 1.1 : 1.0
        
        let adjusted = Double(baseWinRate) * multiplier * strengthAdjustment
        let result = max(5, min(99, Int(adjusted)))
        
        print("      → Formula: \(baseWinRate) × \(multiplier) × \(strengthAdjustment) = \(result)%")
        return result
    }
    
    func calculateHandEquity(handStrength: Int, outs: Int, cardsTocome: Int, players: Int) -> Double {
        // Hand equity = probability of having best hand by river
        var equity = Double(handStrength) * 10.0
        
        // Add equity from outs
        if cardsTocome > 0 && outs > 0 {
            let outsEquity = Double(outs) * (cardsTocome == 2 ? 4.0 : 2.0)
            equity += outsEquity * 0.5
        }
        
        // Adjust for players (more players = need stronger hand)
        let playerPenalty = Double(players - 2) * 5.0
        equity -= playerPenalty
        
        return max(0, min(100, equity))
    }
    
    func calculateFoldEquity(handStrength: Int, gameState: String, players: Int) -> Double {
        // Fold equity = probability opponents fold to aggression
        var foldEquity = 0.0
        
        // Base fold equity by street
        switch gameState {
        case "pre-flop":
            foldEquity = 35.0
        case "flop":
            foldEquity = 25.0
        case "turn":
            foldEquity = 15.0
        case "river":
            foldEquity = 10.0
        default:
            foldEquity = 20.0
        }
        
        // Adjust for hand strength (weaker hands have higher fold equity when bluffing)
        if handStrength <= 2 {
            foldEquity += 10.0 // Bluff has more fold equity
        } else if handStrength >= 7 {
            foldEquity -= 5.0 // Strong hands want calls, not folds
        }
        
        // More players = less fold equity
        let playerPenalty = Double(players - 2) * 3.0
        foldEquity -= playerPenalty
        
        return max(0, min(60, foldEquity))
    }
    
    func generateCommentary(handName: String, handStrength: Int, winRate: Int, gameState: String, outs: Int, holeCards: [String], communityCards: [String], playerCount: Int) -> String {
        
        // Pre-flop commentary
        if communityCards.isEmpty {
            // Omaha-specific pre-flop analysis
            if holeCards.count == 4 {
                if gameMode == .omahaHigh {
                    return "🎴 Omaha High starting hand. Remember: You MUST use exactly 2 cards from your hand + 3 from the board. Look for coordinated cards with flush and straight potential."
                } else {
                    return "🎴 Omaha Hi-Lo starting hand. Remember: You MUST use exactly 2 cards from your hand + 3 from the board for BOTH high and low hands. Look for cards that can make both."
                }
            }
            
            // Texas Hold'em pre-flop analysis
            let suited = holeCards.count == 2 && holeCards[0].suffix(1) == holeCards[1].suffix(1)
            let r1 = rankValue(String(holeCards[0].prefix(1)))
            let r2 = rankValue(String(holeCards[1].prefix(1)))
            let isPair = r1 == r2
            
            if isPair && r1 >= 13 {
                return "Premium pocket pair! 💎 You're in a strong position pre-flop. Consider raising to build the pot."
            } else if isPair {
                return "You've got a pocket pair. Solid starting hand with potential to improve."
            } else if suited && max(r1, r2) >= 13 {
                return "Strong suited high cards! \(suited ? "♠️♥️♦️♣️" : "") Good potential for both pairs and flushes."
            } else if winRate >= 65 {
                return "Above-average starting hand. You have good equity to contest this pot."
            } else {
                return "Marginal hand. Consider your position and opponents before committing chips."
            }
        }
        
        // Post-flop commentary
        switch handStrength {
        case 9:
            return "🔥 STRAIGHT FLUSH! The absolute nuts - you have the best possible hand. Max value!"
        case 8:
            return "💪 Four of a kind! Monster hand. You're almost certainly ahead. Go for maximum value."
        case 7:
            return "🏠 Full house! Very strong hand. Only a few holdings can beat you. Bet for value."
        case 6:
            if gameState == "flop" {
                return "✨ Flush on the flop! Excellent hand, but watch for possible straights or full houses."
            }
            return "✨ You've made a flush! Strong hand. Be cautious of paired boards that could make full houses."
        case 5:
            return "📈 Straight! Solid made hand. Watch for flush possibilities on the board."
        case 4:
            if outs > 0 {
                return "Three of a kind with \(outs) outs to improve. Good hand with potential to boat up."
            }
            return "Trips! Strong hand. Be aware of possible straights and flushes."
        case 3:
            return "Two pair. Decent hand but vulnerable to better two pairs, trips, and made straights/flushes."
        case 2:
            if outs >= 5 {
                return "You have a pair with \(outs) outs to improve. Consider your position and pot odds."
            }
            return "One pair. Marginal strength - evaluate opponents' ranges and board texture."
        default:
            if outs >= 9 {
                return "Drawing hand with \(outs) outs! 🎯 Strong equity to improve. Consider semi-bluffing."
            } else if outs >= 4 {
                return "You have \(outs) outs to improve. Calculate pot odds before continuing."
            }
            return "High card only. Weak holding - fold to aggression unless you have a good read."
        }
    }
    
    func rankValue(_ rank: String) -> Int {
        switch rank {
        case "A": return 14
        case "K": return 13
        case "Q": return 12
        case "J": return 11
        case "T", "10": return 10  // Accept both T and 10
        default: return Int(rank) ?? 0
        }
    }
    
    func isStraight(ranks: [Int]) -> Bool {
        let uniqueRanks = Array(Set(ranks)).sorted(by: >)
        
        // Need at least 5 unique ranks for a straight
        guard uniqueRanks.count >= 5 else { return false }
        
        for i in 0...(uniqueRanks.count - 5) {
            if i + 4 < uniqueRanks.count && uniqueRanks[i] - uniqueRanks[i + 4] == 4 {
                return true
            }
        }
        
        // Check for A-2-3-4-5 wheel straight
        if uniqueRanks.contains(14) && uniqueRanks.contains(5) &&
           uniqueRanks.contains(4) && uniqueRanks.contains(3) && uniqueRanks.contains(2) {
            return true
        }
        
        return false
    }
    
    func estimatePreFlopWinRate() -> Int {
        guard holeCards.count == 2 else { return 50 }
        
        let r1 = rankValue(String(holeCards[0].prefix(1)))
        let r2 = rankValue(String(holeCards[1].prefix(1)))
        let suited = holeCards[0].suffix(1) == holeCards[1].suffix(1)
        let isPair = r1 == r2
        
        if isPair {
            if r1 >= 13 { return 85 }
            if r1 >= 10 { return 75 }
            if r1 >= 7 { return 65 }
            return 55
        }
        
        let high = max(r1, r2)
        let low = min(r1, r2)
        
        if high == 14 && low >= 10 { return suited ? 75 : 70 }
        if high >= 13 && low >= 10 { return suited ? 70 : 65 }
        if high >= 11 && low >= 9 { return suited ? 65 : 60 }
        if suited && (high - low) <= 3 { return 60 }
        
        return 50
    }
    
    func calculateOuts(rankCounts: [String: Int], suitCounts: [String: Int]) -> Int {
        var outs = 0
        
        for count in rankCounts.values {
            if count == 2 { outs += 2 }
            if count == 3 { outs += 1 }
        }
        
        let maxSuitCount = suitCounts.values.max() ?? 0
        if maxSuitCount == 4 { outs += 9 }
        
        return outs
    }
    
    func getRecommendation(strength: Int, winRate: Int) -> (action: String, color: [Color]) {
        if strength >= 7 || winRate >= 80 {
            return ("BET/RAISE", [.green, .green.opacity(0.7)])
        } else if strength >= 4 || winRate >= 60 {
            return ("CALL", [.blue, .blue.opacity(0.7)])
        } else if strength >= 2 || winRate >= 40 {
            return ("CHECK/CALL", [.yellow, .orange])
        } else {
            return ("FOLD", [.red, .red.opacity(0.7)])
        }
    }
    
    func reset() {
        holeCards = []
        communityCards = []
        gameState = "pre-flop"
        stats = nil
        stopCapture()
        // Game mode persists across resets
    }
    
    // Debug function - test API without camera
    func testAPI() {
        print("🧪 Testing API connection...")
        
        let url = URL(string: "https://api.anthropic.com/v1/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("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", forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        
        let body: [String: Any] = [
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 100,
            "messages": [
                [
                    "role": "user",
                    "content": "Say 'API is working!' if you receive this message."
                ]
            ]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("❌ Test Error: \(error.localizedDescription)")
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse {
                print("📡 Test Status Code: \(httpResponse.statusCode)")
            }
            
            if let data = data,
               let jsonString = String(data: data, encoding: .utf8) {
                print("✅ Test Response: \(jsonString)")
            }
        }.resume()
    }
}

extension PokerViewModel: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let imageData = photo.fileDataRepresentation(),
              let image = UIImage(data: imageData) else {
            isAnalyzing = false
            return
        }
        
        print("📸 Captured image size: \(image.size), orientation: \(image.imageOrientation.rawValue)")
        
        // Send the full image for analysis
        analyzeImage(image)
    }
}

