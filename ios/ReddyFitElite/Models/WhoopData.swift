//
//  WhoopData.swift
//  ReddyFitElite
//
//  Whoop-specific data models (Recovery, Strain, Sleep)
//

import Foundation

// MARK: - Recovery Data
struct WhoopRecovery: Codable, Identifiable {
    let id: String
    var userId: String
    var cycleId: String
    var sleepId: String

    var recoveryScore: Int // 0-100
    var hrvRmssdMilli: Double // Heart Rate Variability in milliseconds
    var restingHeartRate: Int
    var spo2Percentage: Double? // Blood oxygen

    var timestamp: Date
    var createdAt: Date

    // Recovery state
    var state: RecoveryState {
        switch recoveryScore {
        case 0..<33: return .red
        case 33..<67: return .yellow
        default: return .green
        }
    }

    var stateDescription: String {
        switch state {
        case .red: return "Focus on rest and recovery"
        case .yellow: return "Moderate activity recommended"
        case .green: return "Your body is ready to perform"
        }
    }

    enum RecoveryState: String {
        case red = "red"
        case yellow = "yellow"
        case green = "green"
    }
}

// MARK: - Strain Data
struct WhoopStrain: Codable, Identifiable {
    let id: String
    var userId: String

    var strain: Double // 0-21 scale
    var averageHeartRate: Int
    var maxHeartRate: Int
    var calories: Double

    var startTime: Date
    var endTime: Date
    var timezone: String

    var createdAt: Date

    // Strain level
    var level: StrainLevel {
        switch strain {
        case 0..<10: return .light
        case 10..<14: return .moderate
        case 14..<18: return .strenuous
        default: return .allOut
        }
    }

    var levelDescription: String {
        switch level {
        case .light: return "Light Activity"
        case .moderate: return "Moderate Effort"
        case .strenuous: return "Strenuous Training"
        case .allOut: return "All Out Effort"
        }
    }

    enum StrainLevel: String {
        case light = "light"
        case moderate = "moderate"
        case strenuous = "strenuous"
        case allOut = "all_out"
    }
}

// MARK: - Sleep Data
struct WhoopSleep: Codable, Identifiable {
    let id: String
    var userId: String

    // Sleep stages (all in minutes)
    var totalSleepMinutes: Int
    var lightSleepMinutes: Int
    var deepSleepMinutes: Int
    var remSleepMinutes: Int
    var awakeSleepMinutes: Int

    // Sleep quality
    var sleepPerformancePercentage: Double? // How well you slept vs. need
    var sleepConsistencyPercentage: Double?
    var sleepEfficiencyPercentage: Double?

    // Respiratory rate
    var respiratoryRate: Double?

    // Times
    var startTime: Date
    var endTime: Date
    var timezone: String

    var createdAt: Date

    // Computed
    var totalSleepHours: Double {
        Double(totalSleepMinutes) / 60
    }

    var sleepQuality: SleepQuality {
        guard let performance = sleepPerformancePercentage else { return .unknown }
        switch performance {
        case 0..<70: return .poor
        case 70..<85: return .good
        default: return .excellent
        }
    }

    enum SleepQuality: String {
        case poor = "poor"
        case good = "good"
        case excellent = "excellent"
        case unknown = "unknown"
    }
}

// MARK: - Whoop Cycle (24-hour cycle)
struct WhoopCycle: Codable, Identifiable {
    let id: String
    var userId: String

    var startTime: Date
    var endTime: Date?

    // Scores
    var strain: Double?
    var kilojoules: Double?
    var averageHeartRate: Int?
    var maxHeartRate: Int?

    var createdAt: Date

    var isComplete: Bool {
        endTime != nil
    }
}

// MARK: - Whoop Insights
struct WhoopInsights: Codable {
    var recoveryScore: Int
    var recoveryState: String // "red", "yellow", "green"
    var targetStrain: StrainTarget

    var recommendations: [String]
    var warnings: [String]

    var hrv: Double
    var restingHR: Int

    var lastUpdated: Date

    struct StrainTarget: Codable {
        var min: Double
        var max: Double
        var optimal: Double
    }
}

// MARK: - Example Data
extension WhoopRecovery {
    static var example: WhoopRecovery {
        WhoopRecovery(
            id: "recovery_123",
            userId: "user_123",
            cycleId: "cycle_456",
            sleepId: "sleep_789",
            recoveryScore: 67,
            hrvRmssdMilli: 45.2,
            restingHeartRate: 52,
            spo2Percentage: 97.5,
            timestamp: Date(),
            createdAt: Date()
        )
    }
}

extension WhoopStrain {
    static var example: WhoopStrain {
        WhoopStrain(
            id: "strain_123",
            userId: "user_123",
            strain: 14.2,
            averageHeartRate: 98,
            maxHeartRate: 178,
            calories: 2850,
            startTime: Date().addingTimeInterval(-86400),
            endTime: Date(),
            timezone: "America/New_York",
            createdAt: Date()
        )
    }
}

extension WhoopSleep {
    static var example: WhoopSleep {
        WhoopSleep(
            id: "sleep_123",
            userId: "user_123",
            totalSleepMinutes: 450,
            lightSleepMinutes: 210,
            deepSleepMinutes: 120,
            remSleepMinutes: 90,
            awakeSleepMinutes: 30,
            sleepPerformancePercentage: 88,
            sleepConsistencyPercentage: 75,
            sleepEfficiencyPercentage: 93,
            respiratoryRate: 14.5,
            startTime: Date().addingTimeInterval(-32400),
            endTime: Date().addingTimeInterval(-3900),
            timezone: "America/New_York",
            createdAt: Date()
        )
    }
}
