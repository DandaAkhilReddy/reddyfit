//
//  HealthKitService.swift
//  ReddyFitElite
//
//  Apple HealthKit integration for automatic workout sync
//

import Foundation
import HealthKit
import Combine

@MainActor
class HealthKitService: ObservableObject {
    @Published var isAuthorized = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var lastSyncDate: Date?
    @Published var syncProgress: Double = 0.0

    private let healthStore = HKHealthStore()
    private var observerQueries: [HKObserverQuery] = []
    private let apiService = APIService.shared

    // MARK: - HealthKit Availability
    static var isHealthKitAvailable: Bool {
        return HKHealthStore.isHealthDataAvailable()
    }

    // MARK: - Data Types to Read
    private var typesToRead: Set<HKSampleType> {
        let types: [HKSampleType?] = [
            HKObjectType.workoutType(),
            HKObjectType.quantityType(forIdentifier: .heartRate),
            HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN),
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned),
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning),
            HKObjectType.quantityType(forIdentifier: .distanceCycling),
            HKObjectType.quantityType(forIdentifier: .distanceSwimming),
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis),
            HKObjectType.quantityType(forIdentifier: .restingHeartRate),
            HKObjectType.quantityType(forIdentifier: .stepCount),
            HKObjectType.quantityType(forIdentifier: .vo2Max)
        ]
        return Set(types.compactMap { $0 })
    }

    // MARK: - Request Authorization
    func requestAuthorization() async -> Bool {
        guard Self.isHealthKitAvailable else {
            errorMessage = "HealthKit is not available on this device"
            return false
        }

        isLoading = true
        errorMessage = nil

        do {
            try await healthStore.requestAuthorization(toShare: [], read: typesToRead)

            // Check if authorized
            let workoutType = HKObjectType.workoutType()
            let status = healthStore.authorizationStatus(for: workoutType)

            isAuthorized = (status == .sharingAuthorized)
            isLoading = false

            return isAuthorized
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }

    // MARK: - Fetch Workouts
    func fetchWorkouts(from startDate: Date, to endDate: Date) async throws -> [Workout] {
        guard isAuthorized else {
            throw HealthKitError.notAuthorized
        }

        let workoutType = HKObjectType.workoutType()
        let predicate = HKQuery.predicateForSamples(
            withStart: startDate,
            end: endDate,
            options: .strictStartDate
        )

        let sortDescriptor = NSSortDescriptor(
            key: HKSampleSortIdentifierStartDate,
            ascending: false
        )

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: workoutType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let workouts = samples as? [HKWorkout] else {
                    continuation.resume(returning: [])
                    return
                }

                Task { @MainActor in
                    // Transform to ReddyFit workouts
                    var reddyFitWorkouts: [Workout] = []

                    for (index, workout) in workouts.enumerated() {
                        self.syncProgress = Double(index) / Double(workouts.count)

                        let reddyFitWorkout = await self.transformToReddyFitWorkout(
                            workout: workout,
                            userId: "current_user" // Will be replaced with actual user ID
                        )
                        reddyFitWorkouts.append(reddyFitWorkout)
                    }

                    self.syncProgress = 1.0
                    continuation.resume(returning: reddyFitWorkouts)
                }
            }

            healthStore.execute(query)
        }
    }

    // MARK: - Transform HKWorkout to Workout
    private func transformToReddyFitWorkout(workout: HKWorkout, userId: String) async -> Workout {
        // Fetch heart rate data for this workout
        let heartRateData = await fetchHeartRateData(for: workout)

        return Workout(
            id: UUID().uuidString,
            userId: userId,
            source: .healthKit,
            sourceId: workout.uuid.uuidString,
            sportType: mapWorkoutType(workout.workoutActivityType),
            startTime: workout.startDate,
            endTime: workout.endDate,
            duration: workout.duration,
            averageHeartRate: heartRateData.average,
            maxHeartRate: heartRateData.max,
            heartRateZones: heartRateData.zones,
            distanceMeters: workout.totalDistance?.doubleValue(for: .meter()),
            calories: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
            whoopStrain: nil,
            whoopKilojoules: nil,
            manualNotes: nil,
            perceivedExertion: nil,
            locationName: nil,
            routeData: nil,
            createdAt: Date(),
            updatedAt: Date(),
            syncedAt: Date()
        )
    }

    // MARK: - Map Workout Type
    private func mapWorkoutType(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running: return "running"
        case .cycling: return "cycling"
        case .swimming: return "swimming"
        case .walking: return "walking"
        case .hiking: return "hiking"
        case .traditionalStrengthTraining: return "strength"
        case .functionalStrengthTraining: return "strength"
        case .crossTraining: return "strength"
        case .yoga: return "yoga"
        case .pilates: return "pilates"
        case .rowing: return "rowing"
        case .elliptical: return "cardio"
        case .stairClimbing: return "stairs"
        case .mixedCardio: return "cardio"
        case .dance: return "dance"
        case .boxing: return "boxing"
        case .martialArts: return "martial_arts"
        default: return "other"
        }
    }

    // MARK: - Fetch Heart Rate Data
    private func fetchHeartRateData(for workout: HKWorkout) async -> HeartRateData {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            return HeartRateData(average: nil, max: nil, zones: nil)
        }

        let predicate = HKQuery.predicateForSamples(
            withStart: workout.startDate,
            end: workout.endDate,
            options: .strictStartDate
        )

        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: heartRateType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, error in
                guard let samples = samples as? [HKQuantitySample], !samples.isEmpty else {
                    continuation.resume(returning: HeartRateData(average: nil, max: nil, zones: nil))
                    return
                }

                let heartRates = samples.map { sample in
                    Int(sample.quantity.doubleValue(for: HKUnit(from: "count/min")))
                }

                let average = heartRates.reduce(0, +) / heartRates.count
                let max = heartRates.max()

                // Calculate heart rate zones (simplified)
                let zones = self.calculateHeartRateZones(
                    heartRates: heartRates,
                    maxHR: max ?? 180,
                    duration: workout.duration
                )

                continuation.resume(returning: HeartRateData(
                    average: average,
                    max: max,
                    zones: zones
                ))
            }

            healthStore.execute(query)
        }
    }

    // MARK: - Calculate Heart Rate Zones
    private func calculateHeartRateZones(heartRates: [Int], maxHR: Int, duration: TimeInterval) -> HeartRateZones {
        let durationMinutes = Int(duration / 60)

        var zone1Count = 0
        var zone2Count = 0
        var zone3Count = 0
        var zone4Count = 0
        var zone5Count = 0

        for hr in heartRates {
            let percentage = Double(hr) / Double(maxHR)

            switch percentage {
            case 0..<0.6:
                zone1Count += 1
            case 0.6..<0.7:
                zone2Count += 1
            case 0.7..<0.8:
                zone3Count += 1
            case 0.8..<0.9:
                zone4Count += 1
            default:
                zone5Count += 1
            }
        }

        let totalSamples = heartRates.count
        guard totalSamples > 0 else {
            return HeartRateZones(
                zone1Minutes: nil,
                zone2Minutes: nil,
                zone3Minutes: nil,
                zone4Minutes: nil,
                zone5Minutes: nil
            )
        }

        return HeartRateZones(
            zone1Minutes: (zone1Count * durationMinutes) / totalSamples,
            zone2Minutes: (zone2Count * durationMinutes) / totalSamples,
            zone3Minutes: (zone3Count * durationMinutes) / totalSamples,
            zone4Minutes: (zone4Count * durationMinutes) / totalSamples,
            zone5Minutes: (zone5Count * durationMinutes) / totalSamples
        )
    }

    // MARK: - Fetch Latest HRV
    func fetchLatestHRV() async -> Double? {
        guard let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else {
            return nil
        }

        let sortDescriptor = NSSortDescriptor(
            key: HKSampleSortIdentifierStartDate,
            ascending: false
        )

        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: hrvType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                guard let sample = samples?.first as? HKQuantitySample else {
                    continuation.resume(returning: nil)
                    return
                }

                let hrv = sample.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli))
                continuation.resume(returning: hrv)
            }

            healthStore.execute(query)
        }
    }

    // MARK: - Fetch Resting Heart Rate
    func fetchRestingHeartRate() async -> Int? {
        guard let restingHRType = HKObjectType.quantityType(forIdentifier: .restingHeartRate) else {
            return nil
        }

        let sortDescriptor = NSSortDescriptor(
            key: HKSampleSortIdentifierStartDate,
            ascending: false
        )

        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: restingHRType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                guard let sample = samples?.first as? HKQuantitySample else {
                    continuation.resume(returning: nil)
                    return
                }

                let restingHR = Int(sample.quantity.doubleValue(for: HKUnit(from: "count/min")))
                continuation.resume(returning: restingHR)
            }

            healthStore.execute(query)
        }
    }

    // MARK: - Enable Background Sync
    func enableBackgroundSync(userId: String) {
        guard isAuthorized else { return }

        let workoutType = HKObjectType.workoutType()

        let query = HKObserverQuery(sampleType: workoutType, predicate: nil) { [weak self] query, completionHandler, error in
            guard let self = self else {
                completionHandler()
                return
            }

            if let error = error {
                print("Observer query error: \(error.localizedDescription)")
                completionHandler()
                return
            }

            Task { @MainActor in
                // Fetch new workouts since last sync
                let lastSync = self.lastSyncDate ?? Date().addingTimeInterval(-24 * 3600)

                do {
                    let newWorkouts = try await self.fetchWorkouts(from: lastSync, to: Date())

                    // Upload to backend
                    for workout in newWorkouts {
                        var uploadWorkout = workout
                        uploadWorkout.userId = userId

                        try? await self.apiService.createManualWorkout(workout: uploadWorkout)
                    }

                    self.lastSyncDate = Date()

                } catch {
                    print("Background sync error: \(error.localizedDescription)")
                }

                completionHandler()
            }
        }

        healthStore.execute(query)
        observerQueries.append(query)

        // Enable background delivery
        healthStore.enableBackgroundDelivery(
            for: workoutType,
            frequency: .immediate
        ) { success, error in
            if let error = error {
                print("Background delivery error: \(error.localizedDescription)")
            } else if success {
                print("✅ Background delivery enabled for workouts")
            }
        }
    }

    // MARK: - Disable Background Sync
    func disableBackgroundSync() {
        for query in observerQueries {
            healthStore.stop(query)
        }
        observerQueries.removeAll()

        let workoutType = HKObjectType.workoutType()
        healthStore.disableBackgroundDelivery(for: workoutType) { success, error in
            if let error = error {
                print("Error disabling background delivery: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Manual Sync
    func syncNow(userId: String) async throws {
        isLoading = true
        errorMessage = nil

        let lastSync = lastSyncDate ?? Date().addingTimeInterval(-30 * 24 * 3600) // Last 30 days

        let workouts = try await fetchWorkouts(from: lastSync, to: Date())

        // Upload each workout
        for workout in workouts {
            var uploadWorkout = workout
            uploadWorkout.userId = userId

            do {
                _ = try await apiService.createManualWorkout(workout: uploadWorkout)
            } catch {
                print("Failed to upload workout: \(error.localizedDescription)")
            }
        }

        lastSyncDate = Date()
        isLoading = false
    }

    // MARK: - Cleanup
    deinit {
        disableBackgroundSync()
    }
}

// MARK: - Supporting Types
struct HeartRateData {
    let average: Int?
    let max: Int?
    let zones: HeartRateZones?
}

enum HealthKitError: Error, LocalizedError {
    case notAuthorized
    case notAvailable
    case fetchFailed

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "HealthKit access not authorized. Please enable in Settings."
        case .notAvailable:
            return "HealthKit is not available on this device."
        case .fetchFailed:
            return "Failed to fetch HealthKit data."
        }
    }
}
