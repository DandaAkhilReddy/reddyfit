//
//  HealthKitSetupView.swift
//  ReddyFitElite
//
//  HealthKit onboarding and permission request
//

import SwiftUI

struct HealthKitSetupView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var userViewModel: UserViewModel
    @StateObject private var healthKitViewModel = HealthKitViewModel()

    @State private var setupState: SetupState = .intro
    @State private var showingSettings = false

    enum SetupState {
        case intro
        case requesting
        case syncing
        case success
        case failed
    }

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.05, blue: 0.1)
                    .ignoresSafeArea()

                VStack(spacing: 30) {
                    Spacer()

                    // Icon
                    Image(systemName: iconName)
                        .font(.system(size: 80))
                        .foregroundColor(iconColor)

                    // Title
                    Text(titleText)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)

                    // Description
                    Text(descriptionText)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    // Permissions List (intro state only)
                    if setupState == .intro {
                        PermissionsList()
                    }

                    // Sync Progress
                    if setupState == .syncing {
                        VStack(spacing: 10) {
                            ProgressView(value: healthKitViewModel.syncProgress)
                                .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                                .padding(.horizontal, 40)

                            Text("\(Int(healthKitViewModel.syncProgress * 100))% complete")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.7))
                        }
                    }

                    // Error Message
                    if let errorMessage = healthKitViewModel.errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(Color.red.opacity(0.2))
                            )
                            .padding(.horizontal)
                    }

                    // Action Button
                    actionButton

                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Apple HealthKit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if setupState != .syncing {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") {
                            dismiss()
                        }
                        .foregroundColor(.white)
                    }
                }
            }
        }
        .alert("Open Settings", isPresented: $showingSettings) {
            Button("Cancel", role: .cancel) { }
            Button("Open Settings") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
        } message: {
            Text("Please enable HealthKit access in Settings to sync your Apple Watch workouts.")
        }
    }

    // MARK: - Dynamic Content
    private var iconName: String {
        switch setupState {
        case .intro, .requesting: return "heart.fill"
        case .syncing: return "arrow.triangle.2.circlepath"
        case .success: return "checkmark.circle.fill"
        case .failed: return "exclamationmark.triangle.fill"
        }
    }

    private var iconColor: Color {
        switch setupState {
        case .intro, .requesting: return .red
        case .syncing: return .blue
        case .success: return .green
        case .failed: return .orange
        }
    }

    private var titleText: String {
        switch setupState {
        case .intro: return "Connect Apple HealthKit"
        case .requesting: return "Requesting Permission..."
        case .syncing: return "Syncing Your Workouts"
        case .success: return "All Set!"
        case .failed: return "Permission Denied"
        }
    }

    private var descriptionText: String {
        switch setupState {
        case .intro:
            return "Automatically sync your Apple Watch workouts, heart rate data, and health metrics to ReddyFit."
        case .requesting:
            return "Please allow access to your health data in the popup."
        case .syncing:
            return "We're syncing your recent workouts. This may take a moment..."
        case .success:
            return "Your Apple Watch is now connected! Workouts will sync automatically."
        case .failed:
            return "We need access to your health data to sync workouts. You can enable this in Settings."
        }
    }

    @ViewBuilder
    private var actionButton: some View {
        switch setupState {
        case .intro:
            Button(action: requestPermission) {
                Text("Connect HealthKit")
                    .font(.headline)
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.horizontal, 40)

        case .requesting:
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))

        case .syncing:
            // No button, show progress

            EmptyView()

        case .success:
            Button(action: {
                dismiss()
            }) {
                Text("Done")
                    .font(.headline)
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.horizontal, 40)

        case .failed:
            VStack(spacing: 15) {
                Button(action: {
                    showingSettings = true
                }) {
                    Text("Open Settings")
                        .font(.headline)
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.horizontal, 40)

                Button(action: requestPermission) {
                    Text("Try Again")
                        .font(.headline)
                }
                .buttonStyle(SecondaryButtonStyle())
                .padding(.horizontal, 40)
            }
        }
    }

    // MARK: - Actions
    private func requestPermission() {
        setupState = .requesting

        Task {
            let success = await healthKitViewModel.connect()

            if success {
                // Start initial sync
                setupState = .syncing

                if let userId = userViewModel.user?.id {
                    await healthKitViewModel.initialSync(userId: userId)

                    // Update user profile
                    await userViewModel.enableHealthKit()

                    setupState = .success
                } else {
                    setupState = .failed
                }
            } else {
                setupState = .failed
            }
        }
    }
}

// MARK: - Permissions List
struct PermissionsList: View {
    let permissions = [
        PermissionItem(icon: "figure.run", title: "Workouts", description: "Your exercise sessions"),
        PermissionItem(icon: "heart.fill", title: "Heart Rate", description: "Real-time HR data"),
        PermissionItem(icon: "waveform.path.ecg", title: "HRV", description: "Heart rate variability"),
        PermissionItem(icon: "bed.double.fill", title: "Sleep", description: "Sleep analysis"),
        PermissionItem(icon: "flame.fill", title: "Calories", description: "Active energy burned")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("We'll access:")
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
                .padding(.horizontal)

            VStack(spacing: 10) {
                ForEach(permissions) { permission in
                    HStack(spacing: 12) {
                        Image(systemName: permission.icon)
                            .font(.body)
                            .foregroundColor(.blue)
                            .frame(width: 30)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(permission.title)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.white)

                            Text(permission.description)
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.6))
                        }

                        Spacer()
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.05))
            )
        }
        .padding(.horizontal, 20)
    }
}

struct PermissionItem: Identifiable {
    let id = UUID()
    let icon: String
    let title: String
    let description: String
}

struct HealthKitSetupView_Previews: PreviewProvider {
    static var previews: some View {
        HealthKitSetupView()
            .environmentObject(UserViewModel())
    }
}
