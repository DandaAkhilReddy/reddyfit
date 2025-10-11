//
//  HealthKitViewModel.swift
//  ReddyFitElite
//
//  ViewModel for managing HealthKit state and sync
//

import Foundation
import Combine

@MainActor
class HealthKitViewModel: ObservableObject {
    @Published var isConnected = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var lastSyncDate: Date?
    @Published var syncProgress: Double = 0.0
    @Published var recentWorkouts: [Workout] = []
    @Published var todayStats: TodayStats?

    private let healthKitService = HealthKitService()
    private var cancellables = Set<AnyCancellable>()

    init() {
        // Subscribe to service updates
        healthKitService.$isAuthorized
            .assign(to: &$isConnected)

        healthKitService.$isLoading
            .assign(to: &$isLoading)

        healthKitService.$errorMessage
            .assign(to: &$errorMessage)

        healthKitService.$lastSyncDate
            .assign(to: &$lastSyncDate)

        healthKitService.$syncProgress
            .assign(to: &$syncProgress)
    }

    // MARK: - Connect HealthKit
    func connect() async -> Bool {
        guard HealthKitService.isHealthKitAvailable else {
            errorMessage = "HealthKit is not available on this device"
            return false
        }

        isLoading = true
        let success = await healthKitService.requestAuthorization()
        isLoading = false

        return success
    }

    // MARK: - Initial Sync
    func initialSync(userId: String) async {
        isLoading = true
        errorMessage = nil

        do {
            // Fetch last 30 days
            let startDate = Date().addingTimeInterval(-30 * 24 * 3600)
            let workouts = try await healthKitService.fetchWorkouts(
                from: startDate,
                to: Date()
            )

            // Upload to backend
            for workout in workouts {
                var uploadWorkout = workout
                uploadWorkout.userId = userId

                do {
                    _ = try await APIService.shared.createManualWorkout(workout: uploadWorkout)
                } catch {
                    print("Failed to upload workout: \(error.localizedDescription)")
                }
            }

            lastSyncDate = Date()
            recentWorkouts = Array(workouts.prefix(5))

            // Calculate today's stats
            await calculateTodayStats()

            // Enable background sync
            healthKitService.enableBackgroundSync(userId: userId)

        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Manual Sync
    func syncNow(userId: String) async {
        isLoading = true
        errorMessage = nil

        do {
            try await healthKitService.syncNow(userId: userId)

            // Refresh recent workouts
            await loadRecentWorkouts()

            // Refresh today's stats
            await calculateTodayStats()

        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Load Recent Workouts
    func loadRecentWorkouts() async {
        do {
            let workouts = try await healthKitService.fetchWorkouts(
                from: Date().addingTimeInterval(-7 * 24 * 3600),
                to: Date()
            )
            recentWorkouts = Array(workouts.prefix(5))
        } catch {
            print("Failed to load recent workouts: \(error.localizedDescription)")
        }
    }

    // MARK: - Calculate Today's Stats
    func calculateTodayStats() async {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? Date()

        do {
            let todayWorkouts = try await healthKitService.fetchWorkouts(
                from: startOfDay,
                to: endOfDay
            )

            let totalDuration = todayWorkouts.reduce(0.0) { $0 + $1.duration }
            let totalCalories = todayWorkouts.reduce(0.0) { $0 + ($1.calories ?? 0) }
            let totalDistance = todayWorkouts.reduce(0.0) { $0 + ($1.distanceMeters ?? 0) }

            todayStats = TodayStats(
                workoutCount: todayWorkouts.count,
                totalDurationMinutes: Int(totalDuration / 60),
                totalCalories: Int(totalCalories),
                totalDistanceKm: totalDistance / 1000
            )

        } catch {
            print("Failed to calculate today's stats: \(error.localizedDescription)")
        }
    }

    // MARK: - Get Latest HRV
    func getLatestHRV() async -> Double? {
        return await healthKitService.fetchLatestHRV()
    }

    // MARK: - Get Resting Heart Rate
    func getRestingHeartRate() async -> Int? {
        return await healthKitService.fetchRestingHeartRate()
    }

    // MARK: - Disconnect
    func disconnect() {
        healthKitService.disableBackgroundSync()
        isConnected = false
        lastSyncDate = nil
        recentWorkouts = []
        todayStats = nil
    }
}

// MARK: - Today Stats Model
struct TodayStats {
    let workoutCount: Int
    let totalDurationMinutes: Int
    let totalCalories: Int
    let totalDistanceKm: Double

    var formattedDuration: String {
        let hours = totalDurationMinutes / 60
        let minutes = totalDurationMinutes % 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    var formattedDistance: String {
        return String(format: "%.1f km", totalDistanceKm)
    }
}
