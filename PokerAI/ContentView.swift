import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = PokerViewModel()
    
    var body: some View {
        ZStack {
            BackgroundView()
            
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 24) {
                        HeaderView(viewModel: viewModel)
                        
                        PokerTableView(viewModel: viewModel)
                        
                        if viewModel.showManualEntry {
                            ManualEntryView(viewModel: viewModel)
                        }
                        
                        if let stats = viewModel.stats {
                            AICommentaryView(commentary: stats.aiCommentary)
                            
                            if let omahaAnalysis = stats.omahaAnalysis {
                                OmahaAnalysisView(
                                    analysis: omahaAnalysis,
                                    lowHand: stats.lowHand
                                )
                            }
                            
                            HandComparisonView(viewModel: viewModel, stats: stats)
                            
                            StatsGridView(stats: stats)
                        }
                        
                        if !viewModel.holeCards.isEmpty || !viewModel.communityCards.isEmpty {
                            ScannedCardsView(viewModel: viewModel)
                        }
                        
                        Spacer(minLength: 40)
                    }
                    .padding(.bottom, 20)
                }
            }
            
            // Camera popup overlay
            if viewModel.showCamera {
                CameraSheet(viewModel: viewModel)
                    .transition(.opacity.combined(with: .scale(scale: 0.9)))
                    .zIndex(1000)
            }
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: viewModel.showCamera)
        .alert("Error", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("OK") {
                viewModel.errorMessage = nil
            }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: viewModel.holeCards)
        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: viewModel.communityCards)
        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: viewModel.stats)
    }
}

// MARK: - Background
struct BackgroundView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.1, green: 0.1, blue: 0.15),
                    Color(red: 0.05, green: 0.15, blue: 0.1),
                    Color(red: 0.0, green: 0.1, blue: 0.05)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            GeometryReader { geometry in
                Path { path in
                    let spacing: CGFloat = 30
                    for i in stride(from: 0, to: geometry.size.width, by: spacing) {
                        path.move(to: CGPoint(x: i, y: 0))
                        path.addLine(to: CGPoint(x: i, y: geometry.size.height))
                    }
                    for i in stride(from: 0, to: geometry.size.height, by: spacing) {
                        path.move(to: CGPoint(x: 0, y: i))
                        path.addLine(to: CGPoint(x: geometry.size.width, y: i))
                    }
                }
                .stroke(Color.white.opacity(0.02), lineWidth: 1)
            }
            .ignoresSafeArea()
        }
    }
}

// MARK: - Header
struct HeaderView: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            // Title and Reset
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Image(systemName: "suit.spade.fill")
                            .font(.title2)
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.yellow, .orange],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                        Text("Poker Analyzer")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                    }
                    Text("AI-Powered Hand Analysis")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
                
                Spacer()
                
                Button(action: {
                    withAnimation(.spring()) {
                        viewModel.reset()
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 14, weight: .semibold))
                        Text("Reset")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(
                        LinearGradient(
                            colors: [Color.red.opacity(0.8), Color.red],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .shadow(color: Color.red.opacity(0.3), radius: 8, x: 0, y: 4)
                }
            }
            
            // Game Mode and Player Count Combined
            VStack(spacing: 12) {
                // Game Mode Picker
                HStack(spacing: 12) {
                    ForEach(GameMode.allCases, id: \.self) { mode in
                        Button(action: {
                            withAnimation(.spring()) {
                                viewModel.gameMode = mode
                                viewModel.reset()
                            }
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: getModeIcon(mode))
                                    .font(.system(size: 14))
                                Text(mode.rawValue)
                                    .font(.system(size: 14, weight: .semibold))
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(
                                viewModel.gameMode == mode ?
                                    LinearGradient(
                                        colors: [Color.cyan.opacity(0.8), Color.cyan],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ) :
                                    LinearGradient(
                                        colors: [Color.white.opacity(0.1), Color.white.opacity(0.05)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                            )
                            .foregroundColor(viewModel.gameMode == mode ? .white : .white.opacity(0.6))
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(viewModel.gameMode == mode ? Color.cyan : Color.white.opacity(0.2), lineWidth: 1)
                            )
                        }
                    }
                }
            }
            
            // PLAYER COUNT SELECTOR - SEPARATE AND PROMINENT
            PlayerCountSelector(viewModel: viewModel)
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }
    
    func getModeIcon(_ mode: GameMode) -> String {
        switch mode {
        case .texasHoldem:
            return "suit.heart.fill"
        case .omahaHiLo:
            return "arrow.up.arrow.down.circle.fill"
        case .omahaHigh:
            return "arrow.up.circle.fill"
        }
    }
}

// MARK: - Poker Table
struct PokerTableView: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        VStack(spacing: 20) {
            HoleCardsSection(viewModel: viewModel)
            CommunityCardsSection(viewModel: viewModel)
            
            // Show Omaha rule reminder below community cards for Omaha games
            if (viewModel.gameMode == .omahaHigh || viewModel.gameMode == .omahaHiLo) && !viewModel.holeCards.isEmpty {
                OmahaRuleReminder()
            }
        }
        .padding(.horizontal, 20)
    }
}

// MARK: - Hole Cards Section
struct HoleCardsSection: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HoleCardHeader(viewModel: viewModel)
            HoleCardDisplay(viewModel: viewModel)
            HoleCardActions(viewModel: viewModel)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.cyan.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

struct HoleCardHeader: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        HStack {
            Image(systemName: "person.fill")
                .foregroundColor(.cyan)
            Text("Your Hand")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.white)
            Spacer()
            if !viewModel.holeCards.isEmpty {
                GameStateBadge(gameState: viewModel.gameState)
            }
            GameModeBadge(gameMode: viewModel.gameMode)
        }
    }
}

struct GameStateBadge: View {
    let gameState: String
    
    var body: some View {
        Text(gameState.uppercased())
            .font(.system(size: 12, weight: .bold))
            .foregroundColor(.cyan)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Color.cyan.opacity(0.2))
            .cornerRadius(8)
    }
}

struct GameModeBadge: View {
    let gameMode: GameMode
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: modeIcon)
                .font(.system(size: 10))
            Text(modeLabel)
                .font(.system(size: 10, weight: .bold))
        }
        .foregroundColor(.yellow)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.yellow.opacity(0.2))
        .cornerRadius(6)
    }
    
    var modeIcon: String {
        switch gameMode {
        case .texasHoldem: return "suit.heart.fill"
        case .omahaHiLo: return "arrow.up.arrow.down.circle.fill"
        case .omahaHigh: return "arrow.up.circle.fill"
        }
    }
    
    var modeLabel: String {
        switch gameMode {
        case .texasHoldem: return "HOLD'EM"
        case .omahaHiLo: return "HI-LO"
        case .omahaHigh: return "HIGH"
        }
    }
}

struct HoleCardDisplay: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        HStack(spacing: 12) {
            ForEach(viewModel.holeCards, id: \.self) { card in
                ModernCardView(card: card)
                    .transition(.scale.combined(with: .opacity))
            }
            
            if viewModel.holeCards.isEmpty {
                EmptyHoleCardsPrompt(gameMode: viewModel.gameMode)
            }
        }
    }
}

struct EmptyHoleCardsPrompt: View {
    let gameMode: GameMode
    
    var body: some View {
        Text(promptText)
            .font(.system(size: 14))
            .foregroundColor(.white.opacity(0.5))
            .padding()
    }
    
    var promptText: String {
        if gameMode == .omahaHiLo || gameMode == .omahaHigh {
            return "Tap below to scan your 4 hole cards"
        } else {
            return "Tap below to scan your 2 hole cards"
        }
    }
}

struct HoleCardActions: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        Group {
            if !viewModel.showCamera && viewModel.holeCards.isEmpty {
                HoleCardScanButtons(viewModel: viewModel)
            } else if !viewModel.showCamera && !viewModel.holeCards.isEmpty {
                RescanHoleButton(viewModel: viewModel)
            }
        }
    }
}

struct HoleCardScanButtons: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        HStack(spacing: 12) {
            ScanButton(
                title: scanButtonTitle,
                icon: "camera.fill",
                color: .blue
            ) {
                withAnimation {
                    viewModel.startCapture(type: .hole)
                }
            }
            
            ManualEntryButton(viewModel: viewModel, scanType: .hole)
        }
    }
    
    var scanButtonTitle: String {
        if viewModel.gameMode == .omahaHiLo || viewModel.gameMode == .omahaHigh {
            return "Scan 4 Hole Cards"
        } else {
            return "Scan Hole Cards"
        }
    }
}

struct ManualEntryButton: View {
    @ObservedObject var viewModel: PokerViewModel
    let scanType: CaptureType
    
    var body: some View {
        Button(action: {
            withAnimation {
                viewModel.currentCaptureType = scanType
                viewModel.showManualEntry = true
            }
        }) {
            HStack(spacing: 8) {
                Image(systemName: "keyboard.fill")
                    .font(.system(size: 14))
                Text("Manual")
                    .font(.system(size: 14, weight: .semibold))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Color.purple.opacity(0.8))
            .foregroundColor(.white)
            .cornerRadius(14)
        }
    }
}

struct RescanHoleButton: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        Button(action: {
            withAnimation {
                viewModel.holeCards = []
                viewModel.stats = nil
                viewModel.startCapture(type: .hole)
            }
        }) {
            HStack(spacing: 8) {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 14, weight: .semibold))
                Text("Rescan Hole Cards")
                    .font(.system(size: 14, weight: .semibold))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color.blue.opacity(0.6))
            .foregroundColor(.white)
            .cornerRadius(12)
        }
    }
}

// MARK: - Omaha Rule Reminder
struct OmahaRuleReminder: View {
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 20))
                .foregroundColor(.orange)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Omaha Rule")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.orange)
                    .textCase(.uppercase)
                
                Text("You MUST use exactly 2 cards from your hand + 3 from the board")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white.opacity(0.9))
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.orange.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.orange.opacity(0.4), lineWidth: 1)
                )
        )
        .padding(.horizontal, 20)
    }
}

// MARK: - Community Cards Section
struct CommunityCardsSection: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "square.grid.3x3.fill")
                    .foregroundColor(.green)
                Text("Community Cards")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                Spacer()
                Text("\(viewModel.communityCards.count)/5")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.green)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.2))
                    .cornerRadius(8)
            }
            
            HStack(spacing: 12) {
                ForEach(viewModel.communityCards, id: \.self) { card in
                    ModernCardView(card: card)
                        .transition(.scale.combined(with: .opacity))
                }
                
                ForEach(0..<(5 - viewModel.communityCards.count), id: \.self) { _ in
                    PlaceholderCardView()
                }
            }
            
            if !viewModel.showCamera && viewModel.holeCards.count == ((viewModel.gameMode == .omahaHiLo || viewModel.gameMode == .omahaHigh) ? 4 : 2) && viewModel.communityCards.count < 5 {
                HStack(spacing: 12) {
                    ScanButton(
                        title: scanButtonTitle,
                        icon: "camera.fill",
                        color: .green
                    ) {
                        withAnimation {
                            viewModel.startCapture(type: .community)
                        }
                    }
                    
                    Button(action: {
                        withAnimation {
                            viewModel.currentCaptureType = .community
                            viewModel.showManualEntry = true
                        }
                    }) {
                        HStack(spacing: 8) {
                            Image(systemName: "keyboard.fill")
                                .font(.system(size: 14))
                            Text("Manual")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .background(Color.purple.opacity(0.8))
                        .foregroundColor(.white)
                        .cornerRadius(14)
                    }
                }
            } else if !viewModel.showCamera && !viewModel.communityCards.isEmpty {
                // Rescan button
                Button(action: {
                    withAnimation {
                        viewModel.communityCards = []
                        viewModel.stats = nil
                        viewModel.startCapture(type: .community)
                    }
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 14, weight: .semibold))
                        Text("Rescan Community Cards")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Color.green.opacity(0.6))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.green.opacity(0.3), lineWidth: 1)
                )
        )
    }
    
    var scanButtonTitle: String {
        if viewModel.communityCards.isEmpty {
            return "Scan Flop (3 cards)"
        } else if viewModel.communityCards.count == 3 {
            return "Scan Turn Card"
        } else {
            return "Scan River Card"
        }
    }
}



// MARK: - Manual Entry View
struct ManualEntryView: View {
    @ObservedObject var viewModel: PokerViewModel
    
    let ranks = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"]
    let suits = [("♠", "S", Color.black), ("♥", "H", Color.red), ("♦", "D", Color.red), ("♣", "C", Color.black)]
    
    @State private var selectedRank: String?
    @State private var selectedSuit: String?
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Image(systemName: "keyboard.fill")
                    .foregroundColor(.purple)
                Text(viewModel.currentCaptureType == .hole ? "Enter Hole Cards" : "Enter Community Cards")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                Spacer()
                Button(action: {
                    withAnimation {
                        viewModel.showManualEntry = false
                        selectedRank = nil
                        selectedSuit = nil
                    }
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            .padding(20)
            .background(Color.purple.opacity(0.3))
            
            VStack(spacing: 20) {
                // Current cards
                HStack(spacing: 8) {
                    let currentCards = viewModel.currentCaptureType == .hole ? viewModel.holeCards : viewModel.communityCards
                    ForEach(currentCards, id: \.self) { card in
                        ManualCardChip(card: card)
                    }
                    
                    if let rank = selectedRank, let suit = selectedSuit {
                        ManualCardChip(card: rank + suit)
                            .opacity(0.6)
                    }
                }
                .frame(height: 40)
                
                // Rank selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("Select Rank")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white.opacity(0.7))
                    
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 7), spacing: 8) {
                        ForEach(ranks, id: \.self) { rank in
                            Button(action: {
                                selectedRank = rank
                                if selectedSuit != nil {
                                    addCard()
                                }
                            }) {
                                Text(rank)
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(selectedRank == rank ? .white : .white.opacity(0.7))
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 44)
                                    .background(selectedRank == rank ? Color.purple : Color.white.opacity(0.1))
                                    .cornerRadius(8)
                            }
                        }
                    }
                }
                
                // Suit selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("Select Suit")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white.opacity(0.7))
                    
                    HStack(spacing: 12) {
                        ForEach(suits, id: \.1) { suit in
                            Button(action: {
                                selectedSuit = suit.1
                                if selectedRank != nil {
                                    addCard()
                                }
                            }) {
                                Text(suit.0)
                                    .font(.system(size: 32))
                                    .foregroundColor(selectedSuit == suit.1 ? .white : suit.2)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 60)
                                    .background(selectedSuit == suit.1 ? Color.purple : Color.white.opacity(0.1))
                                    .cornerRadius(12)
                            }
                        }
                    }
                }
                
                // Action buttons
                HStack(spacing: 12) {
                    Button(action: {
                        viewModel.removeLastCard()
                    }) {
                        HStack {
                            Image(systemName: "delete.left.fill")
                            Text("Undo")
                        }
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.orange.opacity(0.8))
                        .cornerRadius(12)
                    }
                    .disabled(viewModel.currentCaptureType == .hole ? viewModel.holeCards.isEmpty : viewModel.communityCards.isEmpty)
                    
                    Button(action: {
                        withAnimation {
                            viewModel.showManualEntry = false
                            selectedRank = nil
                            selectedSuit = nil
                        }
                    }) {
                        Text("Done")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.green.opacity(0.8))
                            .cornerRadius(12)
                    }
                }
            }
            .padding(20)
        }
        .background(Color.white.opacity(0.05))
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.purple.opacity(0.5), lineWidth: 1)
        )
        .padding(.horizontal, 20)
        .shadow(color: Color.purple.opacity(0.3), radius: 20, x: 0, y: 10)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }
    
    func addCard() {
        guard let rank = selectedRank, let suit = selectedSuit else { return }
        let card = rank + suit
        
        // Check for duplicates
        let allCards = viewModel.holeCards + viewModel.communityCards
        if allCards.contains(card) {
            viewModel.errorMessage = "Card \(card) already used!"
        } else {
            viewModel.addManualCard(card)
        }
        
        selectedRank = nil
        selectedSuit = nil
    }
}

struct ManualCardChip: View {
    let card: String
    
    var rank: String {
        // Handle both 2-character cards (AS, KH) and 3-character cards (10D, 10S)
        String(card.prefix(card.count - 1))
    }
    
    var suit: String {
        String(card.suffix(1))
    }
    
    var suitSymbol: String {
        switch suit {
        case "S": return "♠"
        case "H": return "♥"
        case "D": return "♦"
        case "C": return "♣"
        default: return ""
        }
    }
    
    var suitColor: Color {
        suit == "H" || suit == "D" ? .red : .black
    }
    
    var body: some View {
        HStack(spacing: 2) {
            Text(rank)
                .font(.system(size: rank == "10" ? 12 : 14, weight: .bold))  // Smaller for 10
            Text(suitSymbol)
                .font(.system(size: 16))
        }
        .foregroundColor(suitColor)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.white)
        .cornerRadius(6)
    }
}

// MARK: - AI Commentary
struct AICommentaryView: View {
    let commentary: String
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.yellow)
                Text("AI Analysis")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                Spacer()
            }
            .padding(20)
            .background(
                LinearGradient(
                    colors: [Color.purple.opacity(0.3), Color.purple.opacity(0.1)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            
            Text(commentary)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(.white.opacity(0.9))
                .multilineTextAlignment(.leading)
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)
        }
        .background(Color.white.opacity(0.05))
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [Color.purple.opacity(0.5), Color.blue.opacity(0.5)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal, 20)
        .shadow(color: Color.purple.opacity(0.2), radius: 15, x: 0, y: 8)
        .transition(.scale.combined(with: .opacity))
    }
}

// MARK: - Omaha Hi-Lo Analysis
struct OmahaAnalysisView: View {
    let analysis: String
    let lowHand: String?
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "arrow.up.arrow.down.circle.fill")
                    .foregroundColor(.orange)
                Text("Omaha Hi-Lo")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                Spacer()
                if lowHand != nil {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundColor(.green)
                }
            }
            .padding(20)
            .background(
                LinearGradient(
                    colors: [Color.orange.opacity(0.3), Color.orange.opacity(0.1)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            
            VStack(alignment: .leading, spacing: 12) {
                Text(analysis)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.leading)
                
                if let low = lowHand {
                    Divider()
                        .background(Color.white.opacity(0.2))
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Low Hand")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.white.opacity(0.6))
                                .textCase(.uppercase)
                            Text(low)
                                .font(.system(size: 18, weight: .bold, design: .monospaced))
                                .foregroundColor(.green)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("Scoop Potential")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.white.opacity(0.6))
                                .textCase(.uppercase)
                            HStack(spacing: 4) {
                                Image(systemName: "star.fill")
                                    .foregroundColor(.yellow)
                                Image(systemName: "star.fill")
                                    .foregroundColor(.yellow)
                                Image(systemName: "star.fill")
                                    .foregroundColor(.yellow)
                            }
                            .font(.system(size: 14))
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(Color.white.opacity(0.05))
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [Color.orange.opacity(0.5), Color.yellow.opacity(0.5)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal, 20)
        .shadow(color: Color.orange.opacity(0.2), radius: 15, x: 0, y: 8)
        .transition(.scale.combined(with: .opacity))
    }
}

// MARK: - Hand Comparison View
struct HandComparisonView: View {
    @ObservedObject var viewModel: PokerViewModel
    let stats: PokerStats
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Image(systemName: "chart.bar.fill")
                    .foregroundColor(.cyan)
                Text("Hand Comparison")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                Spacer()
            }
            .padding(20)
            .background(
                LinearGradient(
                    colors: [Color.cyan.opacity(0.3), Color.cyan.opacity(0.1)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            
            VStack(spacing: 16) {
                // Your Current Hand
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "person.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.green)
                        Text("Your Current Hand")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white.opacity(0.7))
                            .textCase(.uppercase)
                        Spacer()
                        HandStrengthIndicator(strength: stats.handStrength)
                    }
                    
                    Text(stats.handName)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.green)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.green.opacity(0.15))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.green.opacity(0.4), lineWidth: 1)
                        )
                )
                
                // Best Possible Hand (The Nuts)
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.yellow)
                        Text("Best Possible Hand (The Nuts)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white.opacity(0.7))
                            .textCase(.uppercase)
                        Spacer()
                    }
                    
                    Text(bestPossibleHand)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.yellow)
                    
                    if viewModel.communityCards.count >= 3 {
                        Text(nutsDescription)
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.6))
                            .padding(.top, 4)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.yellow.opacity(0.15))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.yellow.opacity(0.4), lineWidth: 1)
                        )
                )
            }
            .padding(20)
        }
        .background(Color.white.opacity(0.05))
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [Color.cyan.opacity(0.5), Color.blue.opacity(0.5)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal, 20)
        .shadow(color: Color.cyan.opacity(0.2), radius: 15, x: 0, y: 8)
        .transition(.scale.combined(with: .opacity))
    }
    
    var bestPossibleHand: String {
        let communityCount = viewModel.communityCards.count
        
        if communityCount < 3 {
            return "Waiting for flop..."
        }
        
        // Check for possible hands based on board texture
        let board = viewModel.communityCards
        
        // Check for possible straight flush
        if hasPossibleStraightFlush(board) {
            return "Straight Flush"
        }
        
        // Check for possible quads
        if hasPossibleQuads(board) {
            return "Four of a Kind"
        }
        
        // Check for possible full house
        if hasPossibleFullHouse(board) {
            return "Full House"
        }
        
        // Check for possible flush
        if hasPossibleFlush(board) {
            return "Flush"
        }
        
        // Check for possible straight
        if hasPossibleStraight(board) {
            return "Straight"
        }
        
        // Check for possible trips
        if hasPossibleTrips(board) {
            return "Three of a Kind"
        }
        
        // Check for possible two pair
        if hasPossibleTwoPair(board) {
            return "Two Pair"
        }
        
        // Otherwise one pair
        return "Pair"
    }
    
    var nutsDescription: String {
        if stats.handName == bestPossibleHand {
            return "🎯 You have the nuts!"
        } else {
            return "You need to improve to reach the nuts"
        }
    }
    
    // Helper functions to determine possible hands
    func hasPossibleStraightFlush(_ cards: [String]) -> Bool {
        let suits = cards.map { String($0.suffix(1)) }
        let suitCounts = Dictionary(suits.map { ($0, 1) }, uniquingKeysWith: +)
        return suitCounts.values.contains { $0 >= 3 }
    }
    
    func hasPossibleQuads(_ cards: [String]) -> Bool {
        let ranks = cards.map { String($0.prefix($0.count - 1)) }
        let rankCounts = Dictionary(ranks.map { ($0, 1) }, uniquingKeysWith: +)
        return rankCounts.values.contains { $0 >= 2 }
    }
    
    func hasPossibleFullHouse(_ cards: [String]) -> Bool {
        let ranks = cards.map { String($0.prefix($0.count - 1)) }
        let rankCounts = Dictionary(ranks.map { ($0, 1) }, uniquingKeysWith: +)
        let pairs = rankCounts.values.filter { $0 >= 2 }
        return pairs.count >= 1
    }
    
    func hasPossibleFlush(_ cards: [String]) -> Bool {
        let suits = cards.map { String($0.suffix(1)) }
        let suitCounts = Dictionary(suits.map { ($0, 1) }, uniquingKeysWith: +)
        return suitCounts.values.contains { $0 >= 3 }
    }
    
    func hasPossibleStraight(_ cards: [String]) -> Bool {
        return cards.count >= 3 // Simplified - with 3+ cards, straights are usually possible
    }
    
    func hasPossibleTrips(_ cards: [String]) -> Bool {
        let ranks = cards.map { String($0.prefix($0.count - 1)) }
        let rankCounts = Dictionary(ranks.map { ($0, 1) }, uniquingKeysWith: +)
        return rankCounts.values.contains { $0 >= 2 }
    }
    
    func hasPossibleTwoPair(_ cards: [String]) -> Bool {
        let ranks = cards.map { String($0.prefix($0.count - 1)) }
        let rankCounts = Dictionary(ranks.map { ($0, 1) }, uniquingKeysWith: +)
        let pairs = rankCounts.values.filter { $0 >= 2 }
        return pairs.count >= 2 || cards.count >= 4
    }
}

// MARK: - Hand Strength Indicator
struct HandStrengthIndicator: View {
    let strength: Int
    
    var body: some View {
        HStack(spacing: 3) {
            ForEach(1...9, id: \.self) { index in
                RoundedRectangle(cornerRadius: 2)
                    .fill(index <= strength ? strengthColor : Color.white.opacity(0.2))
                    .frame(width: 8, height: 16)
            }
        }
    }
    
    var strengthColor: Color {
        switch strength {
        case 1...3: return .red
        case 4...6: return .orange
        case 7...8: return .yellow
        case 9: return .green
        default: return .gray
        }
    }
}

// MARK: - Stats Grid
struct StatsGridView: View {
    let stats: PokerStats
    
    var body: some View {
        VStack(spacing: 16) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                ModernStatCard(
                    title: "Hand",
                    value: stats.handName,
                    subtitle: "Strength \(stats.handStrength)/9",
                    icon: "suit.diamond.fill",
                    gradient: [Color.purple, Color.purple.opacity(0.6)]
                )
                
                ModernStatCard(
                    title: "vs \(stats.playerCount - 1) Player\(stats.playerCount > 2 ? "s" : "")",
                    value: "\(stats.adjustedWinRate)%",
                    subtitle: "win probability",
                    icon: "person.3.fill",
                    gradient: [Color.blue, Color.cyan]
                )
                
                ModernStatCard(
                    title: "Hand Equity",
                    value: "\(String(format: "%.1f", stats.handEquity))%",
                    subtitle: "pot equity",
                    icon: "chart.pie.fill",
                    gradient: [Color.green, Color.green.opacity(0.7)]
                )
                
                ModernStatCard(
                    title: "Fold Equity",
                    value: "\(String(format: "%.1f", stats.foldEquity))%",
                    subtitle: "if you bet",
                    icon: "arrow.down.circle.fill",
                    gradient: [Color.orange, Color.yellow]
                )
            }
            
            // Second row
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                ModernStatCard(
                    title: "Outs",
                    value: "\(stats.outs)",
                    subtitle: "~\(String(format: "%.1f", stats.potOdds))% to hit",
                    icon: "target",
                    gradient: [Color.pink, Color.red.opacity(0.7)]
                )
                
                ModernStatCard(
                    title: "Action",
                    value: stats.recommendation.action,
                    subtitle: "Recommended",
                    icon: "brain.head.profile",
                    gradient: stats.recommendation.color
                )
            }
        }
        .padding(.horizontal, 20)
        .transition(.scale.combined(with: .opacity))
    }
}

// MARK: - Scanned Cards View
struct ScannedCardsView: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "checkmark.shield.fill")
                    .foregroundColor(.green)
                Text("Scanned Cards")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white.opacity(0.8))
            }
            
            Text((viewModel.holeCards + viewModel.communityCards).joined(separator: " • "))
                .font(.system(size: 13, weight: .medium, design: .monospaced))
                .foregroundColor(.green.opacity(0.9))
        }
        .padding(16)
        .frame(maxWidth: .infinity)
        .background(Color.green.opacity(0.1))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.green.opacity(0.3), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }
}

// MARK: - Modern Card View
struct ModernCardView: View {
    let card: String
    
    var rank: String {
        // Handle both 2-character cards (AS, KH) and 3-character cards (10D, 10S)
        String(card.prefix(card.count - 1))
    }
    
    var suit: String {
        String(card.suffix(1))
    }
    
    var suitSymbol: String {
        switch suit {
        case "S": return "♠"
        case "H": return "♥"
        case "D": return "♦"
        case "C": return "♣"
        default: return ""
        }
    }
    
    var suitColor: Color {
        suit == "H" || suit == "D" ? .red : .black
    }
    
    var body: some View {
        VStack(spacing: 2) {
            Text(rank)
                .font(.system(size: rank == "10" ? 20 : 24, weight: .bold))  // Smaller font for 10
            Text(suitSymbol)
                .font(.system(size: 32))
        }
        .foregroundColor(suitColor)
        .frame(width: 70, height: 100)
        .background(
            LinearGradient(
                colors: [Color.white, Color.white.opacity(0.95)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
        )
    }
}

// MARK: - Placeholder Card View
struct PlaceholderCardView: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 12)
            .fill(Color.white.opacity(0.05))
            .frame(width: 70, height: 100)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(style: StrokeStyle(lineWidth: 2, dash: [6, 4]))
                    .foregroundColor(.white.opacity(0.2))
            )
    }
}

// MARK: - Modern Stat Card
struct ModernStatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let gradient: [Color]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(.white.opacity(0.9))
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white.opacity(0.7))
                    .textCase(.uppercase)
                
                Text(value)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
                
                Text(subtitle)
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.6))
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                gradient: Gradient(colors: gradient),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .shadow(color: gradient[0].opacity(0.3), radius: 10, x: 0, y: 6)
    }
}

// MARK: - Scan Button Component
struct ScanButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity)
            .background(
                LinearGradient(
                    colors: [color.opacity(0.8), color],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(14)
            .shadow(color: color.opacity(0.4), radius: 10, x: 0, y: 5)
        }
    }
}

// MARK: - Player Count Selector
struct PlayerCountSelector: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        VStack(spacing: 12) {
            PlayerCountHeader(viewModel: viewModel)
            PlayerCountButtons(viewModel: viewModel)
        }
        .padding(18)
        .background(PlayerCountBackground())
        .shadow(color: Color.orange.opacity(0.2), radius: 15, x: 0, y: 8)
    }
}

struct PlayerCountHeader: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        HStack {
            Image(systemName: "person.3.fill")
                .font(.system(size: 16))
                .foregroundColor(.orange)
            Text("Number of Players at Table")
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(.white)
            Spacer()
            Text(gameTypeLabel)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.orange)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.orange.opacity(0.25))
                .cornerRadius(8)
        }
    }
    
    var gameTypeLabel: String {
        if viewModel.playerCount == 2 {
            return "Heads-Up"
        } else if viewModel.playerCount == 9 {
            return "Full Table"
        } else if viewModel.playerCount == 10 || viewModel.playerCount == 11 {
            return "Max Players"
        } else {
            return "\(viewModel.playerCount)-Handed"
        }
    }
}

struct PlayerCountButtons: View {
    @ObservedObject var viewModel: PokerViewModel
    
    var body: some View {
        VStack(spacing: 8) {
            // First row: 2-6
            HStack(spacing: 8) {
                ForEach([2, 3, 4, 5, 6], id: \.self) { count in
                    PlayerCountButton(
                        count: count,
                        isSelected: viewModel.playerCount == count,
                        action: {
                            withAnimation(.spring(response: 0.3)) {
                                viewModel.playerCount = count
                                if !viewModel.holeCards.isEmpty {
                                    viewModel.calculateStats()
                                }
                            }
                        }
                    )
                }
            }
            
            // Second row: 7-11
            HStack(spacing: 8) {
                ForEach([7, 8, 9, 10, 11], id: \.self) { count in
                    PlayerCountButton(
                        count: count,
                        isSelected: viewModel.playerCount == count,
                        action: {
                            withAnimation(.spring(response: 0.3)) {
                                viewModel.playerCount = count
                                if !viewModel.holeCards.isEmpty {
                                    viewModel.calculateStats()
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

struct PlayerCountButton: View {
    let count: Int
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text("\(count)")
                    .font(.system(size: 20, weight: .bold))
                Text("\(count-1) opp")
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundColor(isSelected ? .white : .white.opacity(0.6))
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(buttonBackground)
            .cornerRadius(12)
            .overlay(buttonBorder)
            .shadow(color: isSelected ? Color.orange.opacity(0.5) : Color.clear, radius: 10, x: 0, y: 5)
        }
    }
    
    var buttonBackground: some View {
        Group {
            if isSelected {
                LinearGradient(
                    colors: [Color.orange, Color.orange.opacity(0.8)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            } else {
                Color.white.opacity(0.1)
            }
        }
    }
    
    var buttonBorder: some View {
        RoundedRectangle(cornerRadius: 12)
            .stroke(isSelected ? Color.orange : Color.white.opacity(0.2), lineWidth: 2)
    }
}

struct PlayerCountBackground: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 18)
            .fill(
                LinearGradient(
                    colors: [Color.white.opacity(0.1), Color.white.opacity(0.05)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(
                        LinearGradient(
                            colors: [Color.orange.opacity(0.6), Color.orange.opacity(0.3)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 2
                    )
            )
    }
}

#Preview {
    ContentView()
}

