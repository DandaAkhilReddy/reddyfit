//
//  ActivityRingsView.swift
//  ReddyFitElite
//
//  Display Apple Watch activity rings (Move, Exercise, Stand)
//

import SwiftUI

struct ActivityRingsView: View {
    let moveProgress: Double      // 0.0 to 1.0+
    let exerciseProgress: Double  // 0.0 to 1.0+
    let standProgress: Double     // 0.0 to 1.0+

    let moveGoal: Int             // calories
    let exerciseGoal: Int         // minutes
    let standGoal: Int            // hours

    var body: some View {
        VStack(spacing: 15) {
            Text("Activity Rings")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 30) {
                // Activity Rings Visualization
                ZStack {
                    // Stand Ring (outer)
                    RingView(
                        progress: standProgress,
                        color: .cyan,
                        lineWidth: 12,
                        diameter: 150
                    )

                    // Exercise Ring (middle)
                    RingView(
                        progress: exerciseProgress,
                        color: .green,
                        lineWidth: 12,
                        diameter: 115
                    )

                    // Move Ring (inner)
                    RingView(
                        progress: moveProgress,
                        color: .red,
                        lineWidth: 12,
                        diameter: 80
                    )

                    // Center text
                    VStack(spacing: 2) {
                        Text("Today")
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.6))
                    }
                }

                // Stats
                VStack(alignment: .leading, spacing: 15) {
                    RingStatRow(
                        color: .red,
                        title: "Move",
                        current: Int(Double(moveGoal) * moveProgress),
                        goal: moveGoal,
                        unit: "cal"
                    )

                    RingStatRow(
                        color: .green,
                        title: "Exercise",
                        current: Int(Double(exerciseGoal) * exerciseProgress),
                        goal: exerciseGoal,
                        unit: "min"
                    )

                    RingStatRow(
                        color: .cyan,
                        title: "Stand",
                        current: Int(Double(standGoal) * standProgress),
                        goal: standGoal,
                        unit: "hrs"
                    )
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

// MARK: - Ring View
struct RingView: View {
    let progress: Double
    let color: Color
    let lineWidth: CGFloat
    let diameter: CGFloat

    var body: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(color.opacity(0.2), lineWidth: lineWidth)
                .frame(width: diameter, height: diameter)

            // Progress ring
            Circle()
                .trim(from: 0, to: min(progress, 1.0))
                .stroke(
                    color,
                    style: StrokeStyle(
                        lineWidth: lineWidth,
                        lineCap: .round
                    )
                )
                .frame(width: diameter, height: diameter)
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut, value: progress)
        }
    }
}

// MARK: - Ring Stat Row
struct RingStatRow: View {
    let color: Color
    let title: String
    let current: Int
    let goal: Int
    let unit: String

    var progress: Double {
        Double(current) / Double(goal)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 5) {
                Circle()
                    .fill(color)
                    .frame(width: 8, height: 8)

                Text(title)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.7))
            }

            HStack(spacing: 3) {
                Text("\(current)")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                Text("/ \(goal)")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))

                Text(unit)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
            }

            ProgressView(value: min(progress, 1.0))
                .progressViewStyle(LinearProgressViewStyle(tint: color))
                .frame(width: 100)
        }
    }
}

// MARK: - Example Usage
struct ActivityRingsView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color(red: 0.05, green: 0.05, blue: 0.1)
                .ignoresSafeArea()

            VStack {
                ActivityRingsView(
                    moveProgress: 0.75,
                    exerciseProgress: 0.6,
                    standProgress: 0.9,
                    moveGoal: 500,
                    exerciseGoal: 30,
                    standGoal: 12
                )

                ActivityRingsView(
                    moveProgress: 1.2,  // Over goal
                    exerciseProgress: 1.0,
                    standProgress: 0.5,
                    moveGoal: 600,
                    exerciseGoal: 45,
                    standGoal: 12
                )
            }
            .padding()
        }
    }
}
