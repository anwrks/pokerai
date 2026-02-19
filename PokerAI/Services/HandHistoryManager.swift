//
//  HandHistoryManager.swift
//  PokerAI
//
//  Manages hand history persistence and retrieval
//

import Foundation
import Combine

class HandHistoryManager: ObservableObject {
    static let shared = HandHistoryManager()
    
    @Published var hands: [AnalyzedHand] = []
    @Published var sessions: [PokerSession] = []
    @Published var currentSession: PokerSession?
    
    private let handsKey = "saved_hands"
    private let sessionsKey = "saved_sessions"
    private let currentSessionKey = "current_session"
    
    private init() {
        loadHands()
        loadSessions()
        loadCurrentSession()
    }
    
    // MARK: - Hand Management
    
    /// Save a new analyzed hand
    func saveHand(_ hand: AnalyzedHand) {
        var updatedHand = hand
        updatedHand.sessionId = currentSession?.id
        
        hands.insert(updatedHand, at: 0)  // Most recent first
        persistHands()
        
        // Update session hand count
        if var session = currentSession {
            session.handCount += 1
            updateSession(session)
        }
        
        print("💾 Saved hand: \(hand.handName) (\(hand.gameState))")
    }
    
    /// Get hands for a specific session
    func hands(for sessionId: UUID) -> [AnalyzedHand] {
        hands.filter { $0.sessionId == sessionId }
    }
    
    /// Get hands by game mode
    func hands(gameMode: String) -> [AnalyzedHand] {
        hands.filter { $0.gameMode == gameMode }
    }
    
    /// Get recent hands (last N)
    func recentHands(count: Int = 10) -> [AnalyzedHand] {
        Array(hands.prefix(count))
    }
    
    /// Delete a hand
    func deleteHand(_ hand: AnalyzedHand) {
        hands.removeAll { $0.id == hand.id }
        persistHands()
    }
    
    /// Clear all hands
    func clearAllHands() {
        hands.removeAll()
        persistHands()
    }
    
    // MARK: - Session Management
    
    /// Start a new session
    func startSession(gameMode: String, playerCount: Int) {
        // End current session if active
        if let current = currentSession, current.isActive {
            endSession()
        }
        
        let newSession = PokerSession(
            gameMode: gameMode,
            playerCount: playerCount
        )
        
        currentSession = newSession
        sessions.insert(newSession, at: 0)
        persistSessions()
        persistCurrentSession()
        
        print("🎬 Started new session: \(newSession.id)")
    }
    
    /// End the current session
    func endSession() {
        guard var session = currentSession else { return }
        
        session.endTime = Date()
        updateSession(session)
        currentSession = nil
        persistCurrentSession()
        
        print("🏁 Ended session: \(session.id) - \(session.handCount) hands in \(session.durationString)")
    }
    
    /// Update an existing session
    func updateSession(_ session: PokerSession) {
        if let index = sessions.firstIndex(where: { $0.id == session.id }) {
            sessions[index] = session
        }
        
        if currentSession?.id == session.id {
            currentSession = session
        }
        
        persistSessions()
        persistCurrentSession()
    }
    
    /// Get session statistics
    func stats(for sessionId: UUID) -> SessionStats {
        let sessionHands = hands(for: sessionId)
        return SessionStats(hands: sessionHands, sessionId: sessionId)
    }
    
    /// Delete a session (and its hands)
    func deleteSession(_ session: PokerSession) {
        // Delete all hands from this session
        hands.removeAll { $0.sessionId == session.id }
        
        // Delete session
        sessions.removeAll { $0.id == session.id }
        
        if currentSession?.id == session.id {
            currentSession = nil
        }
        
        persistHands()
        persistSessions()
        persistCurrentSession()
    }
    
    // MARK: - Analytics
    
    /// Overall statistics across all hands
    var overallStats: (totalHands: Int, avgWinRate: Double, strongestHand: String) {
        guard !hands.isEmpty else {
            return (0, 0, "N/A")
        }
        
        let avgWinRate = Double(hands.map { $0.adjustedWinRate }.reduce(0, +)) / Double(hands.count)
        let strongestHand = hands.max(by: { $0.handStrength < $1.handStrength })?.handName ?? "N/A"
        
        return (hands.count, avgWinRate, strongestHand)
    }
    
    /// Hand type distribution
    var handDistribution: [String: Int] {
        Dictionary(hands.map { ($0.handName, 1) }, uniquingKeysWith: +)
    }
    
    /// Win rate by hand type
    func averageWinRate(for handName: String) -> Double {
        let handsWithType = hands.filter { $0.handName == handName }
        guard !handsWithType.isEmpty else { return 0 }
        
        let totalWinRate = handsWithType.map { $0.adjustedWinRate }.reduce(0, +)
        return Double(totalWinRate) / Double(handsWithType.count)
    }
    
    // MARK: - Persistence
    
    private func persistHands() {
        if let encoded = try? JSONEncoder().encode(hands) {
            UserDefaults.standard.set(encoded, forKey: handsKey)
        }
    }
    
    private func loadHands() {
        if let data = UserDefaults.standard.data(forKey: handsKey),
           let decoded = try? JSONDecoder().decode([AnalyzedHand].self, from: data) {
            hands = decoded
            print("📖 Loaded \(hands.count) hands from history")
        }
    }
    
    private func persistSessions() {
        if let encoded = try? JSONEncoder().encode(sessions) {
            UserDefaults.standard.set(encoded, forKey: sessionsKey)
        }
    }
    
    private func loadSessions() {
        if let data = UserDefaults.standard.data(forKey: sessionsKey),
           let decoded = try? JSONDecoder().decode([PokerSession].self, from: data) {
            sessions = decoded
            print("📖 Loaded \(sessions.count) sessions from history")
        }
    }
    
    private func persistCurrentSession() {
        if let session = currentSession,
           let encoded = try? JSONEncoder().encode(session) {
            UserDefaults.standard.set(encoded, forKey: currentSessionKey)
        } else {
            UserDefaults.standard.removeObject(forKey: currentSessionKey)
        }
    }
    
    private func loadCurrentSession() {
        if let data = UserDefaults.standard.data(forKey: currentSessionKey),
           let decoded = try? JSONDecoder().decode(PokerSession.self, from: data) {
            // Only restore if session is active and less than 24 hours old
            if decoded.isActive && decoded.duration < 86400 {
                currentSession = decoded
                print("🔄 Restored active session: \(decoded.id)")
            }
        }
    }
    
    // MARK: - Export
    
    /// Export hands as JSON
    func exportJSON() -> String? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        encoder.dateEncodingStrategy = .iso8601
        
        if let data = try? encoder.encode(hands),
           let json = String(data: data, encoding: .utf8) {
            return json
        }
        return nil
    }
    
    /// Export hands as CSV
    func exportCSV() -> String {
        var csv = "Timestamp,Game Mode,Players,Hole Cards,Community Cards,Street,Hand,Strength,Win Rate,Outs,Recommendation\n"
        
        for hand in hands {
            let row = [
                ISO8601DateFormatter().string(from: hand.timestamp),
                hand.gameMode,
                "\(hand.playerCount)",
                hand.holeCards.joined(separator: " "),
                hand.communityCards.joined(separator: " "),
                hand.gameState,
                hand.handName,
                "\(hand.handStrength)",
                "\(hand.adjustedWinRate)%",
                "\(hand.outs)",
                hand.recommendation
            ].map { "\"\($0)\"" }.joined(separator: ",")
            
            csv += row + "\n"
        }
        
        return csv
    }
}
