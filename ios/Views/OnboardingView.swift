//
//  OnboardingView.swift
//  ReddyFitElite
//
//  Onboarding flow for selecting data source and subscription
//

import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var userViewModel: UserViewModel
    @State private var currentStep = 0
    @State private var selectedTier: SubscriptionTier = .starter
    @State private var selectedDataSource: DataSource = .manual

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.1)
                .ignoresSafeArea()

            TabView(selection: $currentStep) {
                // Step 1: Welcome
                WelcomeStep()
                    .tag(0)

                // Step 2: Select Data Source
                DataSourceStep(selectedDataSource: $selectedDataSource)
                    .tag(1)

                // Step 3: Select Subscription
                SubscriptionStep(selectedTier: $selectedTier)
                    .tag(2)

                // Step 4: Profile Setup
                ProfileStep()
                    .tag(3)

                // Step 5: Complete
                CompleteStep(
                    selectedTier: selectedTier,
                    selectedDataSource: selectedDataSource
                )
                .tag(4)
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
            .indexViewStyle(.page(backgroundDisplayMode: .always))
        }
        .onChange(of: selectedDataSource) { newSource in
            // Auto-select tier based on data source
            switch newSource {
            case .manual:
                selectedTier = .starter
            case .healthKit:
                selectedTier = .pro
            case .whoop:
                selectedTier = .elite
            }
        }
    }
}

// MARK: - Welcome Step
struct WelcomeStep: View {
    var body: some View {
        VStack(spacing: 30) {
            Spacer()

            Image(systemName: "figure.run.circle.fill")
                .font(.system(size: 100))
                .foregroundColor(.blue)

            Text("Welcome to ReddyFit")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)

            Text("Elite fitness tracking with AI insights")
                .font(.title3)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)

            Spacer()

            Text("Swipe to continue")
                .font(.caption)
                .foregroundColor(.white.opacity(0.5))
                .padding(.bottom, 50)
        }
        .padding()
    }
}

// MARK: - Data Source Step
struct DataSourceStep: View {
    @Binding var selectedDataSource: DataSource

    var body: some View {
        VStack(spacing: 30) {
            Text("How do you track workouts?")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)

            VStack(spacing: 20) {
                DataSourceCard(
                    source: .whoop,
                    icon: "waveform.path.ecg",
                    title: "Whoop",
                    description: "Most accurate - HRV, Recovery, Strain",
                    isSelected: selectedDataSource == .whoop
                ) {
                    selectedDataSource = .whoop
                }

                DataSourceCard(
                    source: .healthKit,
                    icon: "applewatch",
                    title: "Apple Watch",
                    description: "Automatic sync with HealthKit",
                    isSelected: selectedDataSource == .healthKit
                ) {
                    selectedDataSource = .healthKit
                }

                DataSourceCard(
                    source: .manual,
                    icon: "pencil.circle",
                    title: "Manual Entry",
                    description: "Log workouts yourself",
                    isSelected: selectedDataSource == .manual
                ) {
                    selectedDataSource = .manual
                }
            }
            .padding(.horizontal)

            Spacer()
        }
        .padding()
    }
}

// MARK: - Data Source Card
struct DataSourceCard: View {
    let source: DataSource
    let icon: String
    let title: String
    let description: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 15) {
                Image(systemName: icon)
                    .font(.system(size: 30))
                    .foregroundColor(isSelected ? .blue : .white)
                    .frame(width: 50)

                VStack(alignment: .leading, spacing: 5) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.white)

                    Text(description)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 15)
                    .fill(isSelected ? Color.blue.opacity(0.2) : Color.white.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 15)
                            .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
                    )
            )
        }
    }
}

// MARK: - Subscription Step
struct SubscriptionStep: View {
    @Binding var selectedTier: SubscriptionTier

    var body: some View {
        VStack(spacing: 20) {
            Text("Choose Your Plan")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.white)

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
            }

            Spacer()
        }
        .padding()
    }
}

// MARK: - Subscription Card
struct SubscriptionCard: View {
    let tier: SubscriptionTier
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text(tier.displayName)
                        .font(.title2)
                        .fontWeight(.bold)

                    Spacer()

                    Text("$\(Int(tier.price))/mo")
                        .font(.title3)
                        .fontWeight(.semibold)
                }

                Divider()

                VStack(alignment: .leading, spacing: 5) {
                    ForEach(tier.features, id: \.self) { feature in
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                                .font(.caption)

                            Text(feature)
                                .font(.subheadline)
                        }
                    }
                }
            }
            .foregroundColor(.white)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 15)
                    .fill(isSelected ? Color.blue.opacity(0.3) : Color.white.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 15)
                            .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
                    )
            )
        }
    }
}

// MARK: - Profile Step
struct ProfileStep: View {
    @State private var age = ""
    @State private var weight = ""
    @State private var selectedGender = "male"

    var body: some View {
        VStack(spacing: 30) {
            Text("Complete Your Profile")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.white)

            VStack(spacing: 20) {
                // Age
                VStack(alignment: .leading, spacing: 8) {
                    Text("Age")
                        .foregroundColor(.white.opacity(0.7))
                    TextField("", text: $age)
                        .keyboardType(.numberPad)
                        .textFieldStyle(ReddyFitTextFieldStyle())
                }

                // Weight
                VStack(alignment: .leading, spacing: 8) {
                    Text("Weight (kg)")
                        .foregroundColor(.white.opacity(0.7))
                    TextField("", text: $weight)
                        .keyboardType(.decimalPad)
                        .textFieldStyle(ReddyFitTextFieldStyle())
                }

                // Gender
                VStack(alignment: .leading, spacing: 8) {
                    Text("Gender")
                        .foregroundColor(.white.opacity(0.7))
                    Picker("Gender", selection: $selectedGender) {
                        Text("Male").tag("male")
                        Text("Female").tag("female")
                        Text("Other").tag("other")
                    }
                    .pickerStyle(.segmented)
                }
            }
            .padding(.horizontal)

            Spacer()

            Text("Optional - helps us provide better insights")
                .font(.caption)
                .foregroundColor(.white.opacity(0.5))
        }
        .padding()
    }
}

// MARK: - Complete Step
struct CompleteStep: View {
    @EnvironmentObject var userViewModel: UserViewModel
    let selectedTier: SubscriptionTier
    let selectedDataSource: DataSource

    var body: some View {
        VStack(spacing: 30) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 100))
                .foregroundColor(.green)

            Text("You're All Set!")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)

            VStack(spacing: 10) {
                Text("Plan: \(selectedTier.displayName)")
                    .foregroundColor(.white.opacity(0.8))
                Text("Data Source: \(selectedDataSource.displayName)")
                    .foregroundColor(.white.opacity(0.8))
            }

            Button(action: {
                Task {
                    await userViewModel.updateSubscription(tier: selectedTier)
                    await userViewModel.updateUser([
                        "primaryDataSource": selectedDataSource.rawValue
                    ])
                    await userViewModel.completeOnboarding()
                }
            }) {
                Text("Get Started")
                    .font(.headline)
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.horizontal, 40)

            Spacer()
        }
        .padding()
    }
}

struct OnboardingView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingView()
            .environmentObject(UserViewModel())
    }
}
