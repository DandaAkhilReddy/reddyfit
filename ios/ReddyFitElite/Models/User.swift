//
//  User.swift
//  ReddyFitElite
//
//  User model with subscription tiers and data sources
//

import Foundation

// MARK: - Subscription Tiers
enum SubscriptionTier: String, Codable, CaseIterable {
    case starter    // $29/mo - Manual entry
    case pro        // $69/mo - HealthKit
    case elite      // $149/mo - Whoop
    case platinum   // $299/mo - Everything + Human coach

    var displayName: String {
        switch self {
        case .starter: return "Starter"
        case .pro: return "Pro"
        case .elite: return "Elite"
        case .platinum: return "Platinum"
        }
    }

    var price: Double {
        switch self {
        case .starter: return 29.0
        case .pro: return 69.0
        case .elite: return 149.0
        case .platinum: return 299.0
        }
    }

    var features: [String] {
        switch self {
        case .starter:
            return [
                "Manual workout logging",
                "Photo food tracking with AI",
                "Basic achievements",
                "Community access"
            ]
        case .pro:
            return [
                "All Starter features",
                "Apple HealthKit integration",
                "Apple Watch sync",
                "Advanced insights",
                "Heart rate zones"
            ]
        case .elite:
            return [
                "All Pro features",
                "Whoop integration",
                "HRV tracking",
                "Recovery optimization",
                "Strain tracking",
                "Photo steganography"
            ]
        case .platinum:
            return [
                "All Elite features",
                "Human coach (1-on-1)",
                "White-glove concierge",
                "Unlimited Supermemory AI",
                "Priority support"
            ]
        }
    }
}

// MARK: - Data Source
enum DataSource: String, Codable {
    case manual
    case healthKit = "healthkit"
    case whoop

    var displayName: String {
        switch self {
        case .manual: return "Manual Entry"
        case .healthKit: return "Apple HealthKit"
        case .whoop: return "Whoop"
        }
    }
}

// MARK: - User Model
struct User: Codable, Identifiable {
    let id: String
    var email: String
    var displayName: String
    var photoURL: String?

    // Subscription
    var subscriptionTier: SubscriptionTier
    var subscriptionStatus: String // "active", "canceled", "past_due"
    var subscriptionRenewsAt: Date?

    // Data sources
    var primaryDataSource: DataSource
    var connectedDataSources: [DataSource]

    // Whoop integration
    var whoopUserId: String?
    var whoopConnected: Bool
    var whoopLastSync: Date?

    // HealthKit
    var healthKitEnabled: Bool
    var healthKitLastSync: Date?

    // Profile
    var age: Int?
    var gender: String?
    var height: Double? // cm
    var weight: Double? // kg
    var timezone: String

    // Onboarding
    var hasCompletedOnboarding: Bool
    var onboardingStep: Int

    // Stats
    var totalWorkouts: Int
    var totalCalories: Double
    var totalDistanceKm: Double
    var currentStreak: Int

    // Timestamps
    var createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email, displayName, photoURL
        case subscriptionTier, subscriptionStatus, subscriptionRenewsAt
        case primaryDataSource, connectedDataSources
        case whoopUserId, whoopConnected, whoopLastSync
        case healthKitEnabled, healthKitLastSync
        case age, gender, height, weight, timezone
        case hasCompletedOnboarding, onboardingStep
        case totalWorkouts, totalCalories, totalDistanceKm, currentStreak
        case createdAt, updatedAt
    }

    // MARK: - Helpers
    var hasWhoopAccess: Bool {
        subscriptionTier == .elite || subscriptionTier == .platinum
    }

    var hasHealthKitAccess: Bool {
        subscriptionTier == .pro || subscriptionTier == .elite || subscriptionTier == .platinum
    }

    var hasHumanCoach: Bool {
        subscriptionTier == .platinum
    }

    var canUsePhotoSteganography: Bool {
        subscriptionTier == .elite || subscriptionTier == .platinum
    }
}

// MARK: - User Extensions
extension User {
    static var example: User {
        User(
            id: "user123",
            email: "elite@reddyfit.com",
            displayName: "Elite Member",
            photoURL: nil,
            subscriptionTier: .elite,
            subscriptionStatus: "active",
            subscriptionRenewsAt: Date().addingTimeInterval(30 * 24 * 3600),
            primaryDataSource: .whoop,
            connectedDataSources: [.whoop, .healthKit],
            whoopUserId: "whoop_123",
            whoopConnected: true,
            whoopLastSync: Date(),
            healthKitEnabled: true,
            healthKitLastSync: Date(),
            age: 32,
            gender: "male",
            height: 178,
            weight: 75,
            timezone: "America/New_York",
            hasCompletedOnboarding: true,
            onboardingStep: 5,
            totalWorkouts: 145,
            totalCalories: 82500,
            totalDistanceKm: 487.3,
            currentStreak: 12,
            createdAt: Date().addingTimeInterval(-90 * 24 * 3600),
            updatedAt: Date()
        )
    }
}
