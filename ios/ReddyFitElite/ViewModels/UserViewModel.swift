//
//  UserViewModel.swift
//  ReddyFitElite
//
//  User profile and subscription management
//

import Foundation
import FirebaseFirestore
import Combine

@MainActor
class UserViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let db = Firestore.firestore()
    private var listener: ListenerRegistration?

    var hasCompletedOnboarding: Bool {
        user?.hasCompletedOnboarding ?? false
    }

    var subscriptionTier: SubscriptionTier {
        user?.subscriptionTier ?? .starter
    }

    var primaryDataSource: DataSource {
        user?.primaryDataSource ?? .manual
    }

    // MARK: - Load User
    func loadUser(userId: String) {
        isLoading = true

        // Real-time listener
        listener = db.collection("users").document(userId).addSnapshotListener { [weak self] snapshot, error in
            guard let self = self else { return }

            Task { @MainActor in
                if let error = error {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                    return
                }

                guard let snapshot = snapshot, snapshot.exists else {
                    // User doesn't exist - create new user
                    self.createUser(userId: userId)
                    return
                }

                do {
                    self.user = try snapshot.data(as: User.self)
                    self.isLoading = false
                } catch {
                    self.errorMessage = "Failed to decode user: \(error.localizedDescription)"
                    self.isLoading = false
                }
            }
        }
    }

    // MARK: - Create User
    private func createUser(userId: String) {
        let newUser = User(
            id: userId,
            email: "",
            displayName: "",
            photoURL: nil,
            subscriptionTier: .starter,
            subscriptionStatus: "trial",
            subscriptionRenewsAt: nil,
            primaryDataSource: .manual,
            connectedDataSources: [.manual],
            whoopUserId: nil,
            whoopConnected: false,
            whoopLastSync: nil,
            healthKitEnabled: false,
            healthKitLastSync: nil,
            age: nil,
            gender: nil,
            height: nil,
            weight: nil,
            timezone: TimeZone.current.identifier,
            hasCompletedOnboarding: false,
            onboardingStep: 0,
            totalWorkouts: 0,
            totalCalories: 0,
            totalDistanceKm: 0,
            currentStreak: 0,
            createdAt: Date(),
            updatedAt: Date()
        )

        do {
            try db.collection("users").document(userId).setData(from: newUser)
            self.user = newUser
            isLoading = false
        } catch {
            errorMessage = "Failed to create user: \(error.localizedDescription)"
            isLoading = false
        }
    }

    // MARK: - Update User
    func updateUser(_ updates: [String: Any]) async {
        guard let userId = user?.id else { return }

        do {
            var updatedFields = updates
            updatedFields["updatedAt"] = Timestamp(date: Date())

            try await db.collection("users").document(userId).updateData(updatedFields)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Complete Onboarding
    func completeOnboarding() async {
        await updateUser([
            "hasCompletedOnboarding": true,
            "onboardingStep": 5
        ])
    }

    // MARK: - Update Subscription
    func updateSubscription(tier: SubscriptionTier) async {
        await updateUser([
            "subscriptionTier": tier.rawValue,
            "subscriptionStatus": "active",
            "subscriptionRenewsAt": Timestamp(date: Date().addingTimeInterval(30 * 24 * 3600))
        ])
    }

    // MARK: - Connect Whoop
    func connectWhoop(whoopUserId: String) async {
        var dataSources = user?.connectedDataSources ?? []
        if !dataSources.contains(.whoop) {
            dataSources.append(.whoop)
        }

        await updateUser([
            "whoopUserId": whoopUserId,
            "whoopConnected": true,
            "whoopLastSync": Timestamp(date: Date()),
            "primaryDataSource": DataSource.whoop.rawValue,
            "connectedDataSources": dataSources.map { $0.rawValue }
        ])
    }

    // MARK: - Enable HealthKit
    func enableHealthKit() async {
        var dataSources = user?.connectedDataSources ?? []
        if !dataSources.contains(.healthKit) {
            dataSources.append(.healthKit)
        }

        await updateUser([
            "healthKitEnabled": true,
            "healthKitLastSync": Timestamp(date: Date()),
            "connectedDataSources": dataSources.map { $0.rawValue }
        ])
    }

    // MARK: - Update Stats
    func incrementWorkoutStats(calories: Double, distanceKm: Double) async {
        guard let currentUser = user else { return }

        await updateUser([
            "totalWorkouts": currentUser.totalWorkouts + 1,
            "totalCalories": currentUser.totalCalories + calories,
            "totalDistanceKm": currentUser.totalDistanceKm + distanceKm
        ])
    }

    // MARK: - Cleanup
    deinit {
        listener?.remove()
    }
}
