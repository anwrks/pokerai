//
//  HandHistoryView.swift
//  PokerAI
//
//  View for browsing hand history and sessions
//

import SwiftUI

struct HandHistoryView: View {
    @StateObject private var historyManager = HandHistoryManager.shared
    @State private var selectedTab = 0
    @State private var selectedHand: AnalyzedHand?
    @State private var showingExportOptions = false
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                BackgroundView()
                
                VStack(spacing: 0) {
                    // Tab selector
                    Picker("View", selection: $selectedTab) {
                        Text("Hands").tag(0)
                        Text("Sessions").tag(1)
                        Text("Stats").tag(2)
                    }
                    .pickerStyle(.segmented)
                    .padding()
                    
                    // Content
                    TabView(selection: $selectedTab) {
                        HandsListView(
                            hands: historyManager.hands,
                            selectedHand: $selectedHand
                        )
                        .tag(0)
                        
                        SessionsListView()
                            .tag(1)
                        
                        StatsOverviewView()
                            .tag(2)
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                }
            }
            .navigationTitle("Hand History")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.white.opacity(0.6))
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showingExportOptions = true }) {
                            Label("Export Data", systemImage: "square.and.arrow.up")
                        }
                        
                        Button(role: .destructive, action: {
                            historyManager.clearAllHands()
                        }) {
                            Label("Clear All", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.system(size: 24))
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
            }
            .sheet(item: $selectedHand) { hand in
                HandDetailView(hand: hand)
            }
            .confirmationDialog("Export Format", isPresented: $showingExportOptions) {
                Button("Export as JSON") {
                    exportJSON()
                }
                Button("Export as CSV") {
                    exportCSV()
                }
                Button("Cancel", role: .cancel) {}
            }
        }
    }
    
    private func exportJSON() {
        guard let json = historyManager.exportJSON() else { return }
        shareText(json, filename: "poker-hands.json")
    }
    
    private func exportCSV() {
        let csv = historyManager.exportCSV()
        shareText(csv, filename: "poker-hands.csv")
    }
    
    private func shareText(_ text: String, filename: String) {
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        try? text.write(to: tempURL, atomically: true, encoding: .utf8)
        
        let activityVC = UIActivityViewController(activityItems: [tempURL], applicationActivities: nil)
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            rootVC.present(activityVC, animated: true)
        }
    }
}

// MARK: - Hands List
struct HandsListView: View {
    let hands: [AnalyzedHand]
    @Binding var selectedHand: AnalyzedHand?
    
    var body: some View {
        ScrollView {
            if hands.isEmpty {
                EmptyHandsView()
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(hands) { hand in
                        HandCard(hand: hand)
                            .onTapGesture {
                                selectedHand = hand
                            }
                    }
                }
                .padding()
            }
        }
    }
}

struct EmptyHandsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "tray")
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.3))
            
            Text("No Hands Yet")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.white)
            
            Text("Analyze some hands to see them here!")
                .font(.system(size: 16))
                .foregroundColor(.white.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct HandCard: View {
    let hand: AnalyzedHand
    
    var body: some View {
        HStack(spacing: 16) {
            // Left: Cards
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 4) {
                    ForEach(hand.holeCards, id: \.self) { card in
                        MiniCardView(card: card)
                    }
                }
                
                if !hand.communityCards.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(hand.communityCards, id: \.self) { card in
                            MiniCardView(card: card)
                        }
                    }
                }
            }
            
            // Middle: Hand info
            VStack(alignment: .leading, spacing: 6) {
                Text(hand.handName)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(handColor(hand.handStrength))
                
                HStack(spacing: 12) {
                    Label("\(hand.adjustedWinRate)%", systemImage: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                    
                    Label(hand.gameState, systemImage: "flag.fill")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                }
                
                Text(hand.timestamp, style: .relative)
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.5))
            }
            
            Spacer()
            
            // Right: Recommendation badge
            Text(hand.recommendation)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(recommendationColor(hand.recommendation))
                .cornerRadius(8)
        }
        .padding(16)
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
    
    func handColor(_ strength: Int) -> Color {
        switch strength {
        case 1...3: return .red
        case 4...6: return .orange
        case 7...8: return .yellow
        case 9: return .green
        default: return .gray
        }
    }
    
    func recommendationColor(_ rec: String) -> Color {
        switch rec {
        case "BET/RAISE": return .green
        case "CALL": return .blue
        case "CHECK/CALL": return .orange
        case "FOLD": return .red
        default: return .gray
        }
    }
}

struct MiniCardView: View {
    let card: String
    
    var rank: String {
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
                .font(.system(size: 10, weight: .bold))
            Text(suitSymbol)
                .font(.system(size: 12))
        }
        .foregroundColor(suitColor)
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(Color.white)
        .cornerRadius(4)
    }
}

// MARK: - Sessions List
struct SessionsListView: View {
    @StateObject private var historyManager = HandHistoryManager.shared
    
    var body: some View {
        ScrollView {
            if historyManager.sessions.isEmpty {
                EmptySessionsView()
            } else {
                LazyVStack(spacing: 12) {
                    // Current session (if active)
                    if let current = historyManager.currentSession {
                        SessionCard(session: current, isActive: true)
                    }
                    
                    // Past sessions
                    ForEach(historyManager.sessions.filter { !$0.isActive }) { session in
                        SessionCard(session: session, isActive: false)
                    }
                }
                .padding()
            }
        }
    }
}

struct EmptySessionsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "clock")
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.3))
            
            Text("No Sessions Yet")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.white)
            
            Text("Your poker sessions will appear here")
                .font(.system(size: 16))
                .foregroundColor(.white.opacity(0.6))
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct SessionCard: View {
    let session: PokerSession
    let isActive: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(session.gameMode)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text(session.startTime, style: .date)
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.6))
                }
                
                Spacer()
                
                if isActive {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        Text("Active")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.green)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.green.opacity(0.2))
                    .cornerRadius(8)
                }
            }
            
            Divider()
                .background(Color.white.opacity(0.2))
            
            HStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Hands")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.6))
                    Text("\(session.handCount)")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.cyan)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Duration")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.6))
                    Text(session.durationString)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.orange)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Players")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.6))
                    Text("\(session.playerCount)")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.purple)
                }
                
                Spacer()
            }
        }
        .padding(16)
        .background(isActive ? Color.green.opacity(0.1) : Color.white.opacity(0.05))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isActive ? Color.green.opacity(0.3) : Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}

// MARK: - Stats Overview
struct StatsOverviewView: View {
    @StateObject private var historyManager = HandHistoryManager.shared
    
    var overallStats: (totalHands: Int, avgWinRate: Double, strongestHand: String) {
        historyManager.overallStats
    }
    
    var handDistribution: [String: Int] {
        historyManager.handDistribution
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Overall stats cards
                HStack(spacing: 12) {
                    StatCard(
                        title: "Total Hands",
                        value: "\(overallStats.totalHands)",
                        icon: "suit.spade.fill",
                        color: .cyan
                    )
                    
                    StatCard(
                        title: "Avg Win Rate",
                        value: "\(String(format: "%.1f", overallStats.avgWinRate))%",
                        icon: "chart.line.uptrend.xyaxis",
                        color: .green
                    )
                }
                
                StatCard(
                    title: "Strongest Hand",
                    value: overallStats.strongestHand,
                    icon: "crown.fill",
                    color: .yellow,
                    fullWidth: true
                )
                
                // Hand distribution
                if !handDistribution.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Hand Distribution")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        ForEach(handDistribution.sorted(by: { $0.value > $1.value }), id: \.key) { hand, count in
                            HandDistributionBar(
                                handName: hand,
                                count: count,
                                total: overallStats.totalHands
                            )
                        }
                    }
                    .padding()
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(16)
                }
            }
            .padding()
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    var fullWidth: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(color)
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.6))
                Text(value)
                    .font(.system(size: fullWidth ? 28 : 24, weight: .bold))
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)
            }
        }
        .padding(16)
        .frame(maxWidth: fullWidth ? .infinity : nil)
        .background(
            LinearGradient(
                colors: [color.opacity(0.3), color.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
    }
}

struct HandDistributionBar: View {
    let handName: String
    let count: Int
    let total: Int
    
    var percentage: Double {
        guard total > 0 else { return 0 }
        return Double(count) / Double(total)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(handName)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                Spacer()
                Text("\(count) (\(String(format: "%.1f", percentage * 100))%)")
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.6))
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.1))
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: [.cyan, .blue],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * percentage)
                }
            }
            .frame(height: 8)
        }
        .padding(.horizontal)
    }
}

// MARK: - Hand Detail View
struct HandDetailView: View {
    let hand: AnalyzedHand
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ZStack {
                BackgroundView()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Cards
                        VStack(spacing: 12) {
                            Text("Hole Cards")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white.opacity(0.6))
                            
                            HStack(spacing: 12) {
                                ForEach(hand.holeCards, id: \.self) { card in
                                    ModernCardView(card: card)
                                }
                            }
                        }
                        
                        if !hand.communityCards.isEmpty {
                            VStack(spacing: 12) {
                                Text("Community Cards")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.6))
                                
                                HStack(spacing: 12) {
                                    ForEach(hand.communityCards, id: \.self) { card in
                                        ModernCardView(card: card)
                                    }
                                }
                            }
                        }
                        
                        // Hand details
                        VStack(spacing: 16) {
                            DetailRow(label: "Hand", value: hand.handName, color: .cyan)
                            DetailRow(label: "Strength", value: "\(hand.handStrength)/9", color: .green)
                            DetailRow(label: "Win Rate", value: "\(hand.adjustedWinRate)%", color: .orange)
                            DetailRow(label: "Players", value: "\(hand.playerCount)", color: .purple)
                            DetailRow(label: "Outs", value: "\(hand.outs)", color: .pink)
                            DetailRow(label: "Recommendation", value: hand.recommendation, color: .yellow)
                        }
                        .padding()
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(16)
                        
                        // AI Commentary
                        VStack(alignment: .leading, spacing: 12) {
                            Text("AI Analysis")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            
                            Text(hand.aiCommentary)
                                .font(.system(size: 14))
                                .foregroundColor(.white.opacity(0.8))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color.purple.opacity(0.1))
                        .cornerRadius(16)
                    }
                    .padding()
                }
            }
            .navigationTitle("Hand Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct DetailRow: View {
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.white.opacity(0.6))
            Spacer()
            Text(value)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(color)
        }
    }
}

#Preview {
    HandHistoryView()
}
