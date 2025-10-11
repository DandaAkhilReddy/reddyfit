//
//  AchievementsView.swift
//  ReddyFitElite
//
//  Achievements and photo steganography showcase
//

import SwiftUI

struct AchievementsView: View {
    @StateObject private var photoService = PhotoService()
    @State private var showingPhotoScanner = false

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.05, blue: 0.1)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Stats Overview
                        AchievementStatsCard()

                        // Photo Steganography Feature
                        PhotoSteganographyCard {
                            showingPhotoScanner = true
                        }

                        // Achievements Grid
                        AchievementsGrid()
                    }
                    .padding()
                }
            }
            .navigationTitle("Achievements")
            .sheet(isPresented: $showingPhotoScanner) {
                PhotoScannerView()
            }
        }
    }
}

struct AchievementStatsCard: View {
    var body: some View {
        VStack(spacing: 15) {
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    Text("0")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.white)

                    Text("Achievements Unlocked")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }

                Spacer()

                Image(systemName: "trophy.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.yellow)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

struct PhotoSteganographyCard: View {
    let action: () -> Void

    var body: some View {
        VStack(spacing: 15) {
            HStack {
                Image(systemName: "photo.badge.checkmark")
                    .font(.title)
                    .foregroundColor(.purple)

                Text("Photo Scanner")
                    .font(.headline)
                    .foregroundColor(.white)

                Spacer()
            }

            Text("Scan workout photos to see embedded achievements and stats. This is ReddyFit's unique feature!")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.8))
                .fixedSize(horizontal: false, vertical: true)

            Button(action: action) {
                HStack {
                    Image(systemName: "camera.viewfinder")
                    Text("Scan Photo")
                }
                .font(.headline)
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(
                    LinearGradient(
                        colors: [
                            Color.purple.opacity(0.3),
                            Color.blue.opacity(0.2)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 15)
                        .stroke(Color.purple.opacity(0.5), lineWidth: 1)
                )
        )
    }
}

struct AchievementsGrid: View {
    let achievements: [AchievementItem] = [
        AchievementItem(
            id: "first_workout",
            title: "First Steps",
            description: "Complete your first workout",
            icon: "figure.run",
            isUnlocked: false
        ),
        AchievementItem(
            id: "week_streak",
            title: "Week Warrior",
            description: "7-day workout streak",
            icon: "flame.fill",
            isUnlocked: false
        ),
        AchievementItem(
            id: "50_workouts",
            title: "Half Century",
            description: "Complete 50 workouts",
            icon: "50.circle.fill",
            isUnlocked: false
        ),
        AchievementItem(
            id: "whoop_connected",
            title: "Elite Tracker",
            description: "Connect Whoop device",
            icon: "waveform.path.ecg",
            isUnlocked: false
        ),
        AchievementItem(
            id: "photo_shared",
            title: "Social Star",
            description: "Share achievement photo",
            icon: "photo.badge.checkmark",
            isUnlocked: false
        ),
        AchievementItem(
            id: "perfect_recovery",
            title: "Peak Recovery",
            description: "100% recovery score",
            icon: "heart.circle.fill",
            isUnlocked: false
        )
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("All Achievements")
                .font(.headline)
                .foregroundColor(.white)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 15) {
                ForEach(achievements) { achievement in
                    AchievementCard(achievement: achievement)
                }
            }
        }
    }
}

struct AchievementItem: Identifiable {
    let id: String
    let title: String
    let description: String
    let icon: String
    let isUnlocked: Bool
}

struct AchievementCard: View {
    let achievement: AchievementItem

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: achievement.icon)
                .font(.system(size: 40))
                .foregroundColor(achievement.isUnlocked ? .yellow : .white.opacity(0.3))

            Text(achievement.title)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)

            Text(achievement.description)
                .font(.caption2)
                .foregroundColor(.white.opacity(0.6))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(achievement.isUnlocked ? 0.15 : 0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 15)
                        .stroke(
                            achievement.isUnlocked ? Color.yellow.opacity(0.5) : Color.clear,
                            lineWidth: 1
                        )
                )
        )
        .opacity(achievement.isUnlocked ? 1.0 : 0.5)
    }
}

struct PhotoScannerView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var photoService = PhotoService()
    @State private var scannedImage: UIImage?
    @State private var showingImagePicker = false

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if let metadata = photoService.scannedMetadata {
                    // Show scanned metadata
                    ScannedMetadataView(metadata: metadata)
                } else {
                    // Scanner UI
                    VStack(spacing: 30) {
                        Spacer()

                        Image(systemName: "photo.badge.checkmark")
                            .font(.system(size: 80))
                            .foregroundColor(.purple)

                        Text("Scan Workout Photo")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Text("Upload a ReddyFit workout photo to extract achievements and stats")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)

                        VStack(spacing: 15) {
                            Button(action: {
                                showingImagePicker = true
                            }) {
                                HStack {
                                    Image(systemName: "photo.on.rectangle")
                                    Text("Choose from Library")
                                }
                                .font(.headline)
                            }
                            .buttonStyle(PrimaryButtonStyle())
                            .padding(.horizontal, 40)

                            Button(action: {
                                // Open camera
                            }) {
                                HStack {
                                    Image(systemName: "camera")
                                    Text("Take Photo")
                                }
                                .font(.headline)
                            }
                            .buttonStyle(SecondaryButtonStyle())
                            .padding(.horizontal, 40)
                        }

                        if photoService.isProcessing {
                            ProgressView("Scanning photo...")
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .foregroundColor(.white)
                        }

                        if let errorMessage = photoService.errorMessage {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding()
                        }

                        Spacer()
                    }
                }
            }
            .padding()
            .background(Color(red: 0.05, green: 0.05, blue: 0.1))
            .navigationTitle("Photo Scanner")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
}

struct ScannedMetadataView: View {
    let metadata: PhotoExtractResponse

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Verification Badge
                if metadata.verified == true {
                    HStack {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundColor(.green)
                        Text("Verified ReddyFit Photo")
                            .font(.headline)
                            .foregroundColor(.white)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.green.opacity(0.2))
                    )
                }

                // Formatted Display
                if let display = metadata.formattedDisplay {
                    VStack(alignment: .leading, spacing: 15) {
                        Text(display.title)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Text("\(display.sport) • \(display.duration)")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.7))

                        Divider()

                        // Stats Grid
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 10) {
                            ForEach(Array(display.stats.keys.sorted()), id: \.self) { key in
                                if let value = display.stats[key] {
                                    StatRow(label: key, value: "\(value.value)")
                                }
                            }
                        }

                        if !display.achievements.isEmpty {
                            Divider()

                            VStack(alignment: .leading, spacing: 10) {
                                Text("Achievements")
                                    .font(.headline)
                                    .foregroundColor(.white)

                                ForEach(display.achievements, id: \.self) { achievement in
                                    HStack {
                                        Image(systemName: "trophy.fill")
                                            .foregroundColor(.yellow)
                                        Text(achievement)
                                            .foregroundColor(.white)
                                    }
                                }
                            }
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 15)
                            .fill(Color.white.opacity(0.1))
                    )
                }
            }
            .padding()
        }
    }
}

struct StatRow: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label)
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
            Text(value)
                .font(.headline)
                .foregroundColor(.white)
        }
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.white.opacity(0.1))
            .foregroundColor(.white)
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
    }
}

struct AchievementsView_Previews: PreviewProvider {
    static var previews: some View {
        AchievementsView()
    }
}
