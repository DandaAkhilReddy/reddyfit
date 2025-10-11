//
//  NutritionEntry.swift
//  ReddyFitElite
//
//  Nutrition tracking with AI photo analysis
//

import Foundation
import UIKit

// MARK: - Nutrition Entry
struct NutritionEntry: Codable, Identifiable {
    let id: String
    var userId: String

    // Meal info
    var mealType: MealType
    var mealName: String?
    var description: String?

    // Macros
    var calories: Double?
    var protein: Double?
    var carbs: Double?
    var fat: Double?
    var fiber: Double?

    // Photo
    var photoURL: String?
    var photoAnalyzedWithAI: Bool

    // AI Analysis
    var aiConfidence: Double? // 0-1
    var detectedFoods: [DetectedFood]?

    // Timestamps
    var consumedAt: Date
    var createdAt: Date
    var updatedAt: Date

    enum MealType: String, Codable, CaseIterable {
        case breakfast
        case lunch
        case dinner
        case snack

        var emoji: String {
            switch self {
            case .breakfast: return "🌅"
            case .lunch: return "☀️"
            case .dinner: return "🌙"
            case .snack: return "🍎"
            }
        }

        var displayName: String {
            rawValue.capitalized
        }
    }

    // MARK: - Computed Properties
    var totalMacros: Double {
        (protein ?? 0) + (carbs ?? 0) + (fat ?? 0)
    }

    var proteinPercentage: Double? {
        guard let protein = protein, totalMacros > 0 else { return nil }
        return (protein * 4) / (calories ?? 1) * 100
    }

    var carbsPercentage: Double? {
        guard let carbs = carbs, totalMacros > 0 else { return nil }
        return (carbs * 4) / (calories ?? 1) * 100
    }

    var fatPercentage: Double? {
        guard let fat = fat, totalMacros > 0 else { return nil }
        return (fat * 9) / (calories ?? 1) * 100
    }
}

// MARK: - Detected Food
struct DetectedFood: Codable, Identifiable {
    let id: String
    var name: String
    var confidence: Double
    var estimatedCalories: Double?
    var estimatedProtein: Double?
    var estimatedCarbs: Double?
    var estimatedFat: Double?
}

// MARK: - Daily Nutrition Summary
struct DailyNutritionSummary: Codable {
    var date: Date
    var totalCalories: Double
    var totalProtein: Double
    var totalCarbs: Double
    var totalFat: Double
    var totalFiber: Double

    var mealCount: Int
    var waterIntakeOz: Double?

    // Goals
    var calorieGoal: Double?
    var proteinGoal: Double?
    var carbsGoal: Double?
    var fatGoal: Double?

    // Computed
    var calorieProgress: Double? {
        guard let goal = calorieGoal, goal > 0 else { return nil }
        return min(totalCalories / goal, 1.0)
    }

    var proteinProgress: Double? {
        guard let goal = proteinGoal, goal > 0 else { return nil }
        return min(totalProtein / goal, 1.0)
    }

    var isOnTrack: Bool {
        guard let calorieProgress = calorieProgress,
              let proteinProgress = proteinProgress else {
            return false
        }
        return calorieProgress >= 0.8 && calorieProgress <= 1.1 &&
               proteinProgress >= 0.8
    }
}

// MARK: - Nutrition Goals
struct NutritionGoals: Codable {
    var dailyCalories: Double
    var dailyProtein: Double
    var dailyCarbs: Double
    var dailyFat: Double
    var dailyFiber: Double
    var dailyWaterOz: Double

    // Macro split
    var proteinPercentage: Int // 30%
    var carbsPercentage: Int   // 40%
    var fatPercentage: Int     // 30%

    static var defaultGoals: NutritionGoals {
        NutritionGoals(
            dailyCalories: 2000,
            dailyProtein: 150,
            dailyCarbs: 200,
            dailyFat: 67,
            dailyFiber: 30,
            dailyWaterOz: 64,
            proteinPercentage: 30,
            carbsPercentage: 40,
            fatPercentage: 30
        )
    }

    // Calculate goals based on body weight and activity
    static func calculate(
        weight: Double,
        activityLevel: ActivityLevel,
        goal: FitnessGoal
    ) -> NutritionGoals {
        var calorieMultiplier: Double

        switch activityLevel {
        case .sedentary: calorieMultiplier = 1.2
        case .lightlyActive: calorieMultiplier = 1.375
        case .moderatelyActive: calorieMultiplier = 1.55
        case .veryActive: calorieMultiplier = 1.725
        case .extraActive: calorieMultiplier = 1.9
        }

        // Adjust for goal
        switch goal {
        case .lose: calorieMultiplier *= 0.85
        case .maintain: break
        case .gain: calorieMultiplier *= 1.15
        }

        let bmr = weight * 24 // Simplified BMR
        let tdee = bmr * calorieMultiplier

        let protein = weight * 2.2 // 2.2g per kg for active individuals
        let fat = tdee * 0.25 / 9 // 25% of calories from fat
        let carbs = (tdee - (protein * 4) - (fat * 9)) / 4

        return NutritionGoals(
            dailyCalories: tdee,
            dailyProtein: protein,
            dailyCarbs: carbs,
            dailyFat: fat,
            dailyFiber: 30,
            dailyWaterOz: weight * 0.5, // Half ounce per kg
            proteinPercentage: 30,
            carbsPercentage: 45,
            fatPercentage: 25
        )
    }

    enum ActivityLevel {
        case sedentary
        case lightlyActive
        case moderatelyActive
        case veryActive
        case extraActive
    }

    enum FitnessGoal {
        case lose
        case maintain
        case gain
    }
}

// MARK: - Example Data
extension NutritionEntry {
    static var example: NutritionEntry {
        NutritionEntry(
            id: "nutrition_123",
            userId: "user_123",
            mealType: .breakfast,
            mealName: "Protein Oatmeal Bowl",
            description: "Oatmeal with protein powder, banana, and almond butter",
            calories: 520,
            protein: 35,
            carbs: 65,
            fat: 12,
            fiber: 8,
            photoURL: "https://example.com/photo.jpg",
            photoAnalyzedWithAI: true,
            aiConfidence: 0.92,
            detectedFoods: [
                DetectedFood(
                    id: "food_1",
                    name: "Oatmeal",
                    confidence: 0.95,
                    estimatedCalories: 150,
                    estimatedProtein: 5,
                    estimatedCarbs: 27,
                    estimatedFat: 3
                ),
                DetectedFood(
                    id: "food_2",
                    name: "Banana",
                    confidence: 0.88,
                    estimatedCalories: 105,
                    estimatedProtein: 1,
                    estimatedCarbs: 27,
                    estimatedFat: 0
                )
            ],
            consumedAt: Date().addingTimeInterval(-3600),
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

extension DailyNutritionSummary {
    static var example: DailyNutritionSummary {
        DailyNutritionSummary(
            date: Date(),
            totalCalories: 1850,
            totalProtein: 145,
            totalCarbs: 180,
            totalFat: 62,
            totalFiber: 28,
            mealCount: 4,
            waterIntakeOz: 56,
            calorieGoal: 2000,
            proteinGoal: 150,
            carbsGoal: 200,
            fatGoal: 67
        )
    }
}
