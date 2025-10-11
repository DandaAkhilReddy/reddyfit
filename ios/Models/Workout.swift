//
//  Workout.swift
//  ReddyFitElite
//
//  Universal workout model for Whoop, HealthKit, and Manual entries
//

import Foundation

// MARK: - Workout Model
struct Workout: Codable, Identifiable {
    let id: String
    var userId: String

    // Source
    var source: DataSource
    var sourceId: String? // Original ID from Whoop/HealthKit

    // Basic info
    var sportType: String // "running", "cycling", "strength", etc.
    var startTime: Date
    var endTime: Date
    var duration: TimeInterval // seconds

    // Heart rate data
    var averageHeartRate: Int?
    var maxHeartRate: Int?
    var heartRateZones: HeartRateZones?

    // Distance & Calories
    var distanceMeters: Double?
    var calories: Double?

    // Whoop-specific
    var whoopStrain: Double?
    var whoopKilojoules: Double?

    // Manual entry specific
    var manualNotes: String?
    var perceivedExertion: Int? // 1-10 scale

    // Location (optional)
    var locationName: String?
    var routeData: [LocationPoint]?

    // Metadata
    var createdAt: Date
    var updatedAt: Date
    var syncedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, userId, source, sourceId
        case sportType, startTime, endTime, duration
        case averageHeartRate, maxHeartRate, heartRateZones
        case distanceMeters, calories
        case whoopStrain, whoopKilojoules
        case manualNotes, perceivedExertion
        case locationName, routeData
        case createdAt, updatedAt, syncedAt
    }

    // MARK: - Computed Properties
    var durationMinutes: Int {
        Int(duration / 60)
    }

    var distanceKm: Double? {
        guard let meters = distanceMeters else { return nil }
        return meters / 1000
    }

    var distanceMiles: Double? {
        guard let meters = distanceMeters else { return nil }
        return meters * 0.000621371
    }

    var pace: Double? {
        guard let distance = distanceKm, distance > 0 else { return nil }
        return duration / 60 / distance // min/km
    }

    var formattedDuration: String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) / 60 % 60
        let seconds = Int(duration) % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%d:%02d", minutes, seconds)
        }
    }

    var sportEmoji: String {
        switch sportType.lowercased() {
        case "running": return "🏃"
        case "cycling": return "🚴"
        case "swimming": return "🏊"
        case "strength": return "💪"
        case "yoga": return "🧘"
        case "walking": return "🚶"
        case "hiking": return "🥾"
        default: return "⚡️"
        }
    }
}

// MARK: - Heart Rate Zones
struct HeartRateZones: Codable {
    var zone1Minutes: Int? // Very light (<60% max HR)
    var zone2Minutes: Int? // Light (60-70%)
    var zone3Minutes: Int? // Moderate (70-80%)
    var zone4Minutes: Int? // Hard (80-90%)
    var zone5Minutes: Int? // Maximum (90-100%)

    var totalMinutes: Int {
        (zone1Minutes ?? 0) + (zone2Minutes ?? 0) + (zone3Minutes ?? 0) +
        (zone4Minutes ?? 0) + (zone5Minutes ?? 0)
    }

    var dominantZone: Int {
        let zones = [
            (1, zone1Minutes ?? 0),
            (2, zone2Minutes ?? 0),
            (3, zone3Minutes ?? 0),
            (4, zone4Minutes ?? 0),
            (5, zone5Minutes ?? 0)
        ]
        return zones.max(by: { $0.1 < $1.1 })?.0 ?? 3
    }
}

// MARK: - Location Point
struct LocationPoint: Codable {
    var latitude: Double
    var longitude: Double
    var altitude: Double?
    var timestamp: Date
}

// MARK: - Workout Extensions
extension Workout {
    static var example: Workout {
        Workout(
            id: "workout_123",
            userId: "user_123",
            source: .whoop,
            sourceId: "whoop_workout_456",
            sportType: "running",
            startTime: Date().addingTimeInterval(-3600),
            endTime: Date(),
            duration: 3600,
            averageHeartRate: 152,
            maxHeartRate: 178,
            heartRateZones: HeartRateZones(
                zone1Minutes: 5,
                zone2Minutes: 10,
                zone3Minutes: 25,
                zone4Minutes: 15,
                zone5Minutes: 5
            ),
            distanceMeters: 10000,
            calories: 650,
            whoopStrain: 14.2,
            whoopKilojoules: 2720,
            manualNotes: nil,
            perceivedExertion: nil,
            locationName: "Central Park",
            routeData: nil,
            createdAt: Date(),
            updatedAt: Date(),
            syncedAt: Date()
        )
    }

    static var manualExample: Workout {
        Workout(
            id: "workout_manual_123",
            userId: "user_123",
            source: .manual,
            sourceId: nil,
            sportType: "strength",
            startTime: Date().addingTimeInterval(-2700),
            endTime: Date(),
            duration: 2700,
            averageHeartRate: nil,
            maxHeartRate: nil,
            heartRateZones: nil,
            distanceMeters: nil,
            calories: 300,
            whoopStrain: nil,
            whoopKilojoules: nil,
            manualNotes: "Full body workout - felt great!",
            perceivedExertion: 7,
            locationName: "Home Gym",
            routeData: nil,
            createdAt: Date(),
            updatedAt: Date(),
            syncedAt: nil
        )
    }
}
