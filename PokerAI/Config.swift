//
//  Config.swift
//  PokerAI
//
//  Configuration management for API keys and environment variables
//

import Foundation

struct Config {
    /// Anthropic API Key
    /// Priority: Environment Variable > Info.plist > Compile-time default
    static var anthropicAPIKey: String {
        // 1. Try environment variable first (for local dev)
        if let envKey = ProcessInfo.processInfo.environment["ANTHROPIC_API_KEY"], !envKey.isEmpty {
            return envKey
        }
        
        // 2. Try Info.plist (for app distribution)
        if let plistKey = Bundle.main.object(forInfoDictionaryKey: "ANTHROPIC_API_KEY") as? String, !plistKey.isEmpty {
            return plistKey
        }
        
        // 3. Fallback to empty (will show error to user)
        return ""
    }
    
    /// Check if API key is configured
    static var hasValidAPIKey: Bool {
        !anthropicAPIKey.isEmpty
    }
    
    /// AI Model Configuration
    struct AI {
        static let visionModel = "claude-3-5-haiku-20241022"  // Fast vision for card detection
        static let textModel = "claude-3-5-haiku-20241022"    // Fast text for hand evaluation
        static let apiVersion = "2023-06-01"
        static let apiBaseURL = "https://api.anthropic.com/v1/messages"
    }
    
    /// App Configuration
    struct App {
        static let appName = "Poker AI"
        static let version = "1.0.0"
    }
}
