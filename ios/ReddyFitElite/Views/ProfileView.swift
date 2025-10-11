//
//  ProfileView.swift
//  ReddyFitElite
//
//  User profile, settings, and integrations
//

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var userViewModel: UserViewModel
    @StateObject private var whoopService = WhoopService()

    @State private var showingSubscriptionChange = false
    @State private var showingWhoopConnect = false
    @State private var showingHealthKitConnect = false

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.05, blue: 0.1)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Profile Header
                        ProfileHeaderCard(user: userViewModel.user)

                        // Subscription Card
                        SubscriptionCard(
                            tier: userViewModel.subscriptionTier,
                            onUpgrade: {
                                showingSubscriptionChange = true
                            }
                        )

                        // Integrations Section
                        IntegrationsSection(
                            user: userViewModel.user,
                            whoopService: whoopService,
                            onConnectWhoop: {
                                showingWhoopConnect = true
                            },
                            onConnectHealthKit: {
                                showingHealthKitConnect = true
                            }
                        )

                        // Settings Section
                        SettingsSection()

                        // Sign Out Button
                        Button(action: {
                            authViewModel.signOut()
                        }) {
                            HStack {
                                Image(systemName: "arrow.right.square")
                                Text("Sign Out")
                            }
                            .font(.headline)
                            .foregroundColor(.red)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(Color.white.opacity(0.1))
                        )
                    }
                    .padding()
                }
            }
            .navigationTitle("Profile")
            .sheet(isPresented: $showingSubscriptionChange) {
                SubscriptionChangeView()
            }
            .sheet(isPresented: $showingWhoopConnect) {
                WhoopConnectView(whoopService: whoopService)
            }
            .sheet(isPresented: $showingHealthKitConnect) {
                HealthKitSetupView()
            }
        }
    }
}

// MARK: - Profile Header Card
struct ProfileHeaderCard: View {
    let user: User?

    var body: some View {
        HStack(spacing: 15) {
            // Profile Photo
            Circle()
                .fill(
                    LinearGradient(
                        colors: [.blue, .purple],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 80, height: 80)
                .overlay(
                    Text(user?.displayName.prefix(2).uppercased() ?? "RF")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                )

            VStack(alignment: .leading, spacing: 5) {
                Text(user?.displayName ?? "Elite Member")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                Text(user?.email ?? "")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.7))

                HStack(spacing: 5) {
                    Image(systemName: "crown.fill")
                        .foregroundColor(.yellow)
                        .font(.caption)

                    Text(user?.subscriptionTier.displayName ?? "Starter")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                }
            }

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

// MARK: - Subscription Card
struct SubscriptionCard: View {
    let tier: SubscriptionTier
    let onUpgrade: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Text("Subscription")
                    .font(.headline)
                    .foregroundColor(.white)

                Spacer()

                Text("$\(Int(tier.price))/mo")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
            }

            VStack(alignment: .leading, spacing: 8) {
                ForEach(tier.features.prefix(3), id: \.self) { feature in
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)

                        Text(feature)
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
            }

            if tier != .platinum {
                Button(action: onUpgrade) {
                    HStack {
                        Image(systemName: "arrow.up.circle")
                        Text("Upgrade Plan")
                    }
                    .font(.headline)
                }
                .buttonStyle(PrimaryButtonStyle())
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

// MARK: - Integrations Section
struct IntegrationsSection: View {
    let user: User?
    @ObservedObject var whoopService: WhoopService
    let onConnectWhoop: () -> Void
    let onConnectHealthKit: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Integrations")
                .font(.headline)
                .foregroundColor(.white)

            // Whoop
            IntegrationRow(
                icon: "waveform.path.ecg",
                title: "Whoop",
                subtitle: user?.whoopConnected == true ? "Connected" : "Not connected",
                isConnected: user?.whoopConnected ?? false,
                action: onConnectWhoop
            )

            // Apple HealthKit
            IntegrationRow(
                icon: "heart.fill",
                title: "Apple HealthKit",
                subtitle: user?.healthKitEnabled == true ? "Connected" : "Not connected",
                isConnected: user?.healthKitEnabled ?? false,
                action: onConnectHealthKit
            )
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

struct IntegrationRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let isConnected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 15) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(isConnected ? .green : .white.opacity(0.5))
                    .frame(width: 40)

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.white)

                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(isConnected ? .green : .white.opacity(0.6))
                }

                Spacer()

                if isConnected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else {
                    Image(systemName: "plus.circle")
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.white.opacity(0.05))
            )
        }
    }
}

// MARK: - Settings Section
struct SettingsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Settings")
                .font(.headline)
                .foregroundColor(.white)

            VStack(spacing: 0) {
                SettingsRow(icon: "bell.fill", title: "Notifications")
                Divider().background(Color.white.opacity(0.2))

                SettingsRow(icon: "lock.fill", title: "Privacy")
                Divider().background(Color.white.opacity(0.2))

                SettingsRow(icon: "questionmark.circle.fill", title: "Help & Support")
                Divider().background(Color.white.opacity(0.2))

                SettingsRow(icon: "doc.text.fill", title: "Terms & Privacy")
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String

    var body: some View {
        Button(action: {
            // Navigate to setting
        }) {
            HStack(spacing: 15) {
                Image(systemName: icon)
                    .font(.body)
                    .foregroundColor(.blue)
                    .frame(width: 30)

                Text(title)
                    .font(.body)
                    .foregroundColor(.white)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
            }
            .padding(.vertical, 12)
        }
    }
}

// MARK: - Subscription Change View
struct SubscriptionChangeView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var userViewModel: UserViewModel
    @State private var selectedTier: SubscriptionTier = .pro

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 15) {
                    ForEach(SubscriptionTier.allCases, id: \.self) { tier in
                        SubscriptionCard(
                            tier: tier,
                            isSelected: selectedTier == tier
                        ) {
                            selectedTier = tier
                        }
                    }
                }
                .padding()
            }
            .background(Color(red: 0.05, green: 0.05, blue: 0.1))
            .navigationTitle("Change Plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Confirm") {
                        Task {
                            await userViewModel.updateSubscription(tier: selectedTier)
                            dismiss()
                        }
                    }
                    .foregroundColor(.blue)
                }
            }
        }
    }
}

// MARK: - Whoop Connect View
struct WhoopConnectView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var userViewModel: UserViewModel
    @ObservedObject var whoopService: WhoopService

    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                Spacer()

                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)

                VStack(spacing: 10) {
                    Text("Connect Whoop")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Text("Get the most accurate fitness data with Whoop integration")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                VStack(alignment: .leading, spacing: 10) {
                    FeatureItem(text: "Real-time Recovery tracking")
                    FeatureItem(text: "HRV monitoring")
                    FeatureItem(text: "Strain optimization")
                    FeatureItem(text: "Sleep analysis")
                }

                Button(action: {
                    Task {
                        if let userId = userViewModel.user?.id {
                            await whoopService.connectWhoop(userId: userId)
                            if whoopService.isConnected {
                                await userViewModel.connectWhoop(
                                    whoopUserId: userViewModel.user?.whoopUserId ?? ""
                                )
                                dismiss()
                            }
                        }
                    }
                }) {
                    if whoopService.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Connect Whoop")
                            .font(.headline)
                    }
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.horizontal, 40)

                if let errorMessage = whoopService.errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                }

                Spacer()
            }
            .padding()
            .background(Color(red: 0.05, green: 0.05, blue: 0.1))
            .navigationTitle("Whoop")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
}

struct FeatureItem: View {
    let text: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)

            Text(text)
                .foregroundColor(.white)
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
            .environmentObject(AuthViewModel())
            .environmentObject(UserViewModel())
    }
}
