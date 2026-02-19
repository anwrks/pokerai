//
//  HandHistory.swift
//  PokerAI
//
//  Hand history and session tracking models
//

import Foundation

/// Represents a single poker hand analysis
struct AnalyzedHand: Codable, Identifiable {
    let id: UUID
    let timestamp: Date
    let gameMode: String
    let playerCount: Int
    
    // Cards
    let holeCards: [String]
    let communityCards: [String]
    let gameState: String  // pre-flop, flop, turn, river
    
    // Analysis results
    let handName: String
    let handStrength: Int
    let winRate: Int
    let adjustedWinRate: Int
    let outs: Int
    let potOdds: Double
    let handEquity: Double
    let foldEquity: Double
    let recommendation: String
    let aiCommentary: String
    
    // Optional Omaha data
    let lowHand: String?
    let omahaAnalysis: String?
    
    // Session tracking
    var sessionId: UUID?
    var notes: String?
    var tags: [String]
    
    init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        gameMode: String,
        playerCount: Int,
        holeCards: [String],
        communityCards: [String],
        gameState: String,
        stats: PokerStats,
        sessionId: UUID? = nil,
        notes: String? = nil,
        tags: [String] = []
    ) {
        self.id = id
        self.timestamp = timestamp
        self.gameMode = gameMode
        self.playerCount = playerCount
        self.holeCards = holeCards
        self.communityCards = communityCards
        self.gameState = gameState
        self.handName = stats.handName
        self.handStrength = stats.handStrength
        self.winRate = stats.winRate
        self.adjustedWinRate = stats.adjustedWinRate
        self.outs = stats.outs
        self.potOdds = stats.potOdds
        self.handEquity = stats.handEquity
        self.foldEquity = stats.foldEquity
        self.recommendation = stats.recommendation.action
        self.aiCommentary = stats.aiCommentary
        self.lowHand = stats.lowHand
        self.omahaAnalysis = stats.omahaAnalysis
        self.sessionId = sessionId
        self.notes = notes
        self.tags = tags
    }
    
    /// All cards combined
    var allCards: [String] {
        holeCards + communityCards
    }
    
    /// Hand identifier for grouping similar hands
    var handIdentifier: String {
        let sortedHole = holeCards.sorted().joined(separator: "-")
        return "\(gameMode)-\(sortedHole)-\(gameState)"
    }
}

/// Represents a poker session (multiple hands)
struct PokerSession: Codable, Identifiable {
    let id: UUID
    let startTime: Date
    var endTime: Date?
    var gameMode: String
    var playerCount: Int
    var handCount: Int
    var notes: String?
    
    init(
        id: UUID = UUID(),
        startTime: Date = Date(),
        endTime: Date? = nil,
        gameMode: String,
        playerCount: Int,
        handCount: Int = 0,
        notes: String? = nil
    ) {
        self.id = id
        self.startTime = startTime
        self.endTime = endTime
        self.gameMode = gameMode
        self.playerCount = playerCount
        self.handCount = handCount
        self.notes = notes
    }
    
    var isActive: Bool {
        endTime == nil
    }
    
    var duration: TimeInterval {
        let end = endTime ?? Date()
        return end.timeIntervalSince(startTime)
    }
    
    var durationString: String {
        let minutes = Int(duration) / 60
        let hours = minutes / 60
        let remainingMinutes = minutes % 60
        
        if hours > 0 {
            return "\(hours)h \(remainingMinutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

/// Session statistics
struct SessionStats: Codable {
    let sessionId: UUID
    let totalHands: Int
    let uniqueHandTypes: Set<String>
    let averageWinRate: Double
    let averageHandStrength: Double
    let mostCommonHand: String
    let strongestHand: String
    let recommendationBreakdown: [String: Int]  // "FOLD": 5, "CALL": 3, etc.
    
    init(hands: [AnalyzedHand], sessionId: UUID) {
        self.sessionId = sessionId
        self.totalHands = hands.count
        
        guard !hands.isEmpty else {
            self.uniqueHandTypes = []
            self.averageWinRate = 0
            self.averageHandStrength = 0
            self.mostCommonHand = "N/A"
            self.strongestHand = "N/A"
            self.recommendationBreakdown = [:]
            return
        }
        
        self.uniqueHandTypes = Set(hands.map { $0.handName })
        self.averageWinRate = Double(hands.map { $0.adjustedWinRate }.reduce(0, +)) / Double(hands.count)
        self.averageHandStrength = Double(hands.map { $0.handStrength }.reduce(0, +)) / Double(hands.count)
        
        // Most common hand
        let handCounts = Dictionary(hands.map { ($0.handName, 1) }, uniquingKeysWith: +)
        self.mostCommonHand = handCounts.max(by: { $0.value < $1.value })?.key ?? "N/A"
        
        // Strongest hand
        self.strongestHand = hands.max(by: { $0.handStrength < $1.handStrength })?.handName ?? "N/A"
        
        // Recommendation breakdown
        self.recommendationBreakdown = Dictionary(hands.map { ($0.recommendation, 1) }, uniquingKeysWith: +)
    }
}
