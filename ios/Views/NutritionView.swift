//
//  NutritionView.swift
//  ReddyFitElite
//
//  Nutrition tracking with AI photo analysis
//

import SwiftUI

struct NutritionView: View {
    @State private var showingCamera = false

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.05, green: 0.05, blue: 0.1)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Daily Summary
                        DailyNutritionCard()

                        // Macros Chart
                        MacrosCard()

                        // Photo Food Tracking CTA
                        PhotoTrackingCTA {
                            showingCamera = true
                        }

                        // Meal List
                        MealListSection()
                    }
                    .padding()
                }
            }
            .navigationTitle("Nutrition")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingCamera = true
                    }) {
                        Image(systemName: "camera.fill")
                            .foregroundColor(.blue)
                    }
                }
            }
            .sheet(isPresented: $showingCamera) {
                PhotoFoodTrackerView()
            }
        }
    }
}

struct DailyNutritionCard: View {
    var body: some View {
        VStack(spacing: 15) {
            HStack {
                Text("Today")
                    .font(.headline)
                    .foregroundColor(.white)

                Spacer()

                Text("0 / 2000 kcal")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.7))
            }

            // Calorie Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.white.opacity(0.2))
                        .frame(height: 20)

                    RoundedRectangle(cornerRadius: 10)
                        .fill(LinearGradient(
                            colors: [.blue, .purple],
                            startPoint: .leading,
                            endPoint: .trailing
                        ))
                        .frame(width: 0, height: 20)
                }
            }
            .frame(height: 20)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

struct MacrosCard: View {
    var body: some View {
        VStack(spacing: 15) {
            Text("Macros")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 20) {
                MacroColumn(name: "Protein", value: "0g", goal: "150g", color: .blue)
                MacroColumn(name: "Carbs", value: "0g", goal: "200g", color: .green)
                MacroColumn(name: "Fat", value: "0g", goal: "67g", color: .orange)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 15)
                .fill(Color.white.opacity(0.1))
        )
    }
}

struct MacroColumn: View {
    let name: String
    let value: String
    let goal: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Circle()
                .fill(color.opacity(0.3))
                .frame(width: 60, height: 60)
                .overlay(
                    Text(value)
                        .font(.caption)
                        .foregroundColor(.white)
                )

            Text(name)
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))

            Text(goal)
                .font(.caption2)
                .foregroundColor(.white.opacity(0.5))
        }
        .frame(maxWidth: .infinity)
    }
}

struct PhotoTrackingCTA: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 15) {
                Image(systemName: "camera.fill")
                    .font(.title2)
                    .foregroundColor(.purple)
                    .frame(width: 60, height: 60)
                    .background(
                        Circle()
                            .fill(Color.purple.opacity(0.2))
                    )

                VStack(alignment: .leading, spacing: 5) {
                    Text("Track with AI")
                        .font(.headline)
                        .foregroundColor(.white)

                    Text("Take a photo and let AI analyze your meal")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(.white.opacity(0.5))
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 15)
                    .fill(Color.white.opacity(0.1))
            )
        }
    }
}

struct MealListSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Today's Meals")
                .font(.headline)
                .foregroundColor(.white)

            Text("No meals logged yet")
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

struct PhotoFoodTrackerView: View {
    @Environment(\.dismiss) var dismiss
    @State private var selectedMealType: NutritionEntry.MealType = .breakfast

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Spacer()

                // Camera placeholder
                RoundedRectangle(cornerRadius: 15)
                    .fill(Color.black)
                    .frame(height: 300)
                    .overlay(
                        VStack {
                            Image(systemName: "camera")
                                .font(.system(size: 60))
                                .foregroundColor(.white.opacity(0.5))
                            Text("Camera View")
                                .foregroundColor(.white.opacity(0.5))
                        }
                    )

                // Meal Type Selector
                Picker("Meal Type", selection: $selectedMealType) {
                    ForEach(NutritionEntry.MealType.allCases, id: \.self) { type in
                        Text("\(type.emoji) \(type.displayName)")
                            .tag(type)
                    }
                }
                .pickerStyle(.segmented)

                Button(action: {
                    // Capture and analyze
                    dismiss()
                }) {
                    Text("Capture & Analyze")
                        .font(.headline)
                }
                .buttonStyle(PrimaryButtonStyle())

                Spacer()
            }
            .padding()
            .background(Color(red: 0.05, green: 0.05, blue: 0.1))
            .navigationTitle("Food Tracking")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct NutritionView_Previews: PreviewProvider {
    static var previews: some View {
        NutritionView()
    }
}
