//
//  WorkoutsView.swift
//  ReddyFitElite
//
//  Workout history and logging
//

import SwiftUI

struct WorkoutsView: View {
    @State private var showingAddWorkout = false

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.05, blue: 0.1)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Stats Summary
                        WorkoutStatsCard()

                        // Workout List
                        WorkoutListSection()
                    }
                    .padding()
                }
            }
            .navigationTitle("Workouts")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingAddWorkout = true
                    }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.blue)
                    }
                }
            }
            .sheet(isPresented: $showingAddWorkout) {
                AddWorkoutView()
            }
        }
    }
}

struct WorkoutStatsCard: View {
    var body: some View {
        VStack(spacing: 15) {
            Text("This Week")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 20) {
                StatColumn(value: "0", label: "Workouts", icon: "figure.run")
                StatColumn(value: "0", label: "Minutes", icon: "clock")
                StatColumn(value: "0", label: "Calories", icon: "flame.fill")
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

struct StatColumn: View {
    let value: String
    let label: String
    let icon: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text(label)
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
    }
}

struct WorkoutListSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Recent Activity")
                .font(.headline)
                .foregroundColor(.white)

            VStack(spacing: 0) {
                Text("No workouts yet")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.6))
                    .padding()

                Text("Tap + to log your first workout")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
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

struct AddWorkoutView: View {
    @Environment(\.dismiss) var dismiss
    @State private var sportType = "Running"
    @State private var duration = ""
    @State private var distance = ""
    @State private var calories = ""
    @State private var notes = ""

    let sportTypes = ["Running", "Cycling", "Swimming", "Strength", "Yoga", "Walking", "Other"]

    var body: some View {
        NavigationView {
            Form {
                Section("Workout Details") {
                    Picker("Type", selection: $sportType) {
                        ForEach(sportTypes, id: \.self) { sport in
                            Text(sport).tag(sport)
                        }
                    }

                    TextField("Duration (minutes)", text: $duration)
                        .keyboardType(.numberPad)

                    TextField("Distance (km)", text: $distance)
                        .keyboardType(.decimalPad)

                    TextField("Calories", text: $calories)
                        .keyboardType(.numberPad)
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(height: 100)
                }
            }
            .navigationTitle("Log Workout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        // Save workout
                        dismiss()
                    }
                }
            }
        }
    }
}

struct WorkoutsView_Previews: PreviewProvider {
    static var previews: some View {
        WorkoutsView()
    }
}
