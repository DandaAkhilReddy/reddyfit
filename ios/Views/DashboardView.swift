//
//  DashboardView.swift
//  ReddyFitElite
//
//  Main dashboard with recovery, strain, and insights
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var userViewModel: UserViewModel
    @StateObject private var whoopService = WhoopService()
    @StateObject private var healthKitViewModel = HealthKitViewModel()
    @State private var showingWhoopConnect = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    DashboardHeader(user: userViewModel.user)

                    // Data source specific content
                    switch userViewModel.primaryDataSource {
                    case .whoop:
                        WhoopDashboardContent(whoopService: whoopService)

                    case .healthKit:
                        HealthKitDashboardContent(healthKitViewModel: healthKitViewModel)

                    case .manual:
                        ManualDashboardContent()
                    }

                    // Quick Actions
                    QuickActionsSection()

                    // Recent Workouts
                    RecentWorkoutsSection()
                }
                .padding()
            }
            .background(Color(red: 0.05, green: 0.05, blue: 0.1))
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if userViewModel.primaryDataSource == .whoop {
                        Button(action: {
                            Task {
                                if let userId = userViewModel.user?.id {
                                    await whoopService.syncData(userId: userId)
                                }
                            }
                        }) {
                            Image(systemName: "arrow.clockwise")
                                .foregroundColor(.white)
                        }
                    } else if userViewModel.primaryDataSource == .healthKit {
                        Button(action: {
                            Task {
                                if let userId = userViewModel.user?.id {
                                    await healthKitViewModel.syncNow(userId: userId)
                                }
                            }
                        }) {
                            Image(systemName: "arrow.clockwise")
                                .foregroundColor(.white)
                        }
                    }
                }
            }
        }
        .onAppear {
            if userViewModel.primaryDataSource == .whoop,
               let userId = userViewModel.user?.id {
                Task {
                    await whoopService.syncData(userId: userId)
                }
            } else if userViewModel.primaryDataSource == .healthKit,
                      let userId = userViewModel.user?.id {
                Task {
                    await healthKitViewModel.loadRecentWorkouts()
                    await healthKitViewModel.calculateTodayStats()
                }
            }
        }
    }
}

// MARK: - Dashboard Header
struct DashboardHeader: View {
    let user: User?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Welcome back,")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.7))

            Text(user?.displayName ?? "Elite Member")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)

            HStack {
                Image(systemName: "crown.fill")
                    .foregroundColor(.yellow)
                Text(user?.subscriptionTier.displayName ?? "Starter")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

// MARK: - Whoop Dashboard Content
struct WhoopDashboardContent: View {
    @ObservedObject var whoopService: WhoopService

    var body: some View {
        VStack(spacing: 20) {
            // Recovery Ring
            if let insights = whoopService.insights {
                RecoveryCard(insights: insights)
            } else {
                LoadingCard(title: "Loading Recovery Data...")
            }

            // Strain Target
            if let insights = whoopService.insights {
                StrainCard(insights: insights)
            }

            // Sleep Quality
            if let sleep = whoopService.latestSleep {
                SleepCard(sleep: sleep)
            }

            // Recommendations
            if let insights = whoopService.insights {
                RecommendationsCard(insights: insights)
            }
        }
    }
}

// MARK: - Recovery Card
struct RecoveryCard: View {
    let insights: WhoopInsights

    var recoveryColor: Color {
        switch insights.recoveryState {
        case "green": return .green
        case "yellow": return .yellow
        default: return .red
        }
    }

    var body: some View {
        VStack(spacing: 15) {
            Text("Recovery")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, alignment: .leading)

            ZStack {
                // Background circle
                Circle()
                    .stroke(Color.white.opacity(0.2), lineWidth: 15)
                    .frame(width: 180, height: 180)

                // Progress circle
                Circle()
                    .trim(from: 0, to: Double(insights.recoveryScore) / 100)
                    .stroke(recoveryColor, lineWidth: 15)
                    .frame(width: 180, height: 180)
                    .rotationEffect(.degrees(-90))

                // Score
                VStack(spacing: 5) {
                    Text("\(insights.recoveryScore)%")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(.white)

                    Text(insights.recoveryState.uppercased())
                        .font(.caption)
                        .foregroundColor(recoveryColor)
                }
            }

            // HRV and Resting HR
            HStack(spacing: 40) {
                VStack(spacing: 5) {
                    Text("HRV")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                    Text(String(format: "%.1f ms", insights.hrv))
                        .font(.headline)
                        .foregroundColor(.white)
                }

                VStack(spacing: 5) {
                    Text("Resting HR")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                    Text("\(insights.restingHR) bpm")
                        .font(.headline)
                        .foregroundColor(.white)
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

// MARK: - Strain Card
struct StrainCard: View {
    let insights: WhoopInsights

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Target Strain")
                .font(.headline)
                .foregroundColor(.white)

            HStack(spacing: 30) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Optimal")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                    Text(String(format: "%.1f", insights.targetStrain.optimal))
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }

                VStack(alignment: .leading, spacing: 5) {
                    Text("Range")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                    Text(String(format: "%.1f - %.1f", insights.targetStrain.min, insights.targetStrain.max))
                        .font(.subheadline)
                        .foregroundColor(.white)
                }

                Spacer()
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

// MARK: - Sleep Card
struct SleepCard: View {
    let sleep: WhoopSleep

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Last Night's Sleep")
                .font(.headline)
                .foregroundColor(.white)

            HStack(spacing: 30) {
                VStack(alignment: .leading) {
                    Text(String(format: "%.1fh", sleep.totalSleepHours))
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    Text("Total Sleep")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }

                VStack(alignment: .leading, spacing: 5) {
                    SleepStageRow(stage: "Deep", minutes: sleep.deepSleepMinutes, color: .purple)
                    SleepStageRow(stage: "REM", minutes: sleep.remSleepMinutes, color: .blue)
                    SleepStageRow(stage: "Light", minutes: sleep.lightSleepMinutes, color: .cyan)
                }

                Spacer()
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

struct SleepStageRow: View {
    let stage: String
    let minutes: Int
    let color: Color

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text("\(stage): \(minutes)m")
                .font(.caption)
                .foregroundColor(.white.opacity(0.8))
        }
    }
}

// MARK: - Recommendations Card
struct RecommendationsCard: View {
    let insights: WhoopInsights

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("AI Recommendations")
                .font(.headline)
                .foregroundColor(.white)

            VStack(alignment: .leading, spacing: 10) {
                ForEach(insights.recommendations, id: \.self) { recommendation in
                    HStack(spacing: 10) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundColor(.yellow)
                            .font(.caption)

                        Text(recommendation)
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.9))
                    }
                }
            }

            if !insights.warnings.isEmpty {
                Divider()
                    .background(Color.white.opacity(0.3))

                VStack(alignment: .leading, spacing: 10) {
                    ForEach(insights.warnings, id: \.self) { warning in
                        HStack(spacing: 10) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                                .font(.caption)

                            Text(warning)
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.9))
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

// MARK: - HealthKit Dashboard Content
struct HealthKitDashboardContent: View {
    @ObservedObject var healthKitViewModel: HealthKitViewModel

    var body: some View {
        VStack(spacing: 20) {
            if healthKitViewModel.isLoading {
                LoadingCard(title: "Loading Apple Watch data...")
            } else {
                // Activity Rings
                if let stats = healthKitViewModel.todayStats {
                    ActivityRingsView(
                        moveProgress: Double(stats.totalCalories) / 500.0,
                        exerciseProgress: Double(stats.totalDurationMinutes) / 30.0,
                        standProgress: 0.8, // Hardcoded for now - HealthKit doesn't provide stand hours easily
                        moveGoal: 500,
                        exerciseGoal: 30,
                        standGoal: 12
                    )
                } else {
                    ActivityRingsView(
                        moveProgress: 0,
                        exerciseProgress: 0,
                        standProgress: 0,
                        moveGoal: 500,
                        exerciseGoal: 30,
                        standGoal: 12
                    )
                }

                // Today's Stats
                if let stats = healthKitViewModel.todayStats {
                    TodayStatsCard(stats: stats)
                }

                // Recent Workouts
                if !healthKitViewModel.recentWorkouts.isEmpty {
                    RecentHealthKitWorkoutsCard(workouts: healthKitViewModel.recentWorkouts)
                }

                // Last Sync
                if let lastSync = healthKitViewModel.lastSyncDate {
                    Text("Last synced: \(lastSync.formatted())")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
            }
        }
    }
}

// MARK: - Today Stats Card
struct TodayStatsCard: View {
    let stats: TodayStats

    var body: some View {
        VStack(spacing: 15) {
            Text("Today's Activity")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 20) {
                StatBox(
                    icon: "figure.run",
                    value: "\(stats.workoutCount)",
                    label: "Workouts",
                    color: .blue
                )

                StatBox(
                    icon: "clock",
                    value: stats.formattedDuration,
                    label: "Active",
                    color: .green
                )

                StatBox(
                    icon: "flame.fill",
                    value: "\(stats.totalCalories)",
                    label: "Calories",
                    color: .orange
                )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

struct StatBox: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text(label)
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Recent HealthKit Workouts Card
struct RecentHealthKitWorkoutsCard: View {
    let workouts: [Workout]

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Recent Workouts")
                .font(.headline)
                .foregroundColor(.white)

            VStack(spacing: 10) {
                ForEach(workouts.prefix(3)) { workout in
                    HealthKitWorkoutRow(workout: workout)
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

struct HealthKitWorkoutRow: View {
    let workout: Workout

    var body: some View {
        HStack(spacing: 12) {
            Text(workout.sportEmoji)
                .font(.title2)

            VStack(alignment: .leading, spacing: 3) {
                Text(workout.sportType.capitalized)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)

                HStack(spacing: 10) {
                    if let avgHR = workout.averageHeartRate {
                        Label("\(avgHR) bpm", systemImage: "heart.fill")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.7))
                    }

                    if let distance = workout.distanceKm {
                        Label(String(format: "%.1f km", distance), systemImage: "location.fill")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.7))
                    }

                    Label(workout.formattedDuration, systemImage: "clock")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
            }

            Spacer()

            if let calories = workout.calories {
                Text("\(Int(calories)) cal")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.white.opacity(0.05))
        )
    }
}

// MARK: - Manual Dashboard Content
struct ManualDashboardContent: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "figure.run")
                .font(.system(size: 60))
                .foregroundColor(.blue)

            Text("Start tracking your workouts")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(.white)

            Text("Log workouts manually or upgrade to Pro for automatic tracking")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

// MARK: - Quick Actions
struct QuickActionsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.white)

            HStack(spacing: 15) {
                QuickActionButton(
                    icon: "plus.circle.fill",
                    title: "Log Workout",
                    color: .blue
                ) {
                    // Navigate to log workout
                }

                QuickActionButton(
                    icon: "camera.fill",
                    title: "Scan Photo",
                    color: .purple
                ) {
                    // Navigate to photo scanner
                }
            }
        }
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.title)
                    .foregroundColor(color)

                Text(title)
                    .font(.caption)
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 15)
                    .fill(Color.white.opacity(0.1))
            )
        }
    }
}

// MARK: - Recent Workouts
struct RecentWorkoutsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Recent Workouts")
                .font(.headline)
                .foregroundColor(.white)

            Text("No workouts yet")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.6))
                .frame(maxWidth: .infinity)
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 15)
                        .fill(Color.white.opacity(0.1))
                )
        }
    }
}

// MARK: - Loading Card
struct LoadingCard: View {
    let title: String

    var body: some View {
        VStack(spacing: 15) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))

            Text(title)
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.7))
        }
        .frame(height: 200)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
            .environmentObject(UserViewModel())
    }
}
