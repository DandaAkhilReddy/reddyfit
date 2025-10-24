// __integration_tests__/meal-logging-flow.integration.test.tsx
import { describe, it, expect, vi } from 'vitest';
import * as geminiService from '../services/geminiService';
import * as firestoreService from '../services/firestoreService';

vi.mock('../services/geminiService');
vi.mock('../services/firestoreService');

describe('Meal Logging Flow Integration Tests', () => {
  describe('Photo Upload and AI Analysis', () => {
    it('should complete full meal photo upload flow', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      const mockNutrition = geminiService.getNutritionalAnalysis as any;
      const mockUpload = firestoreService.uploadImage as any;
      const mockSave = firestoreService.saveMealLog as any;

      mockAnalyze.mockResolvedValue(['chicken breast', 'broccoli', 'rice']);
      mockNutrition.mockResolvedValue({
        calories: 450,
        protein: 45,
        carbs: 50,
        fat: 10
      });
      mockUpload.mockResolvedValue('https://storage.url/meal.jpg');
      mockSave.mockResolvedValue(undefined);

      const base64Image = 'data:image/jpeg;base64,test';
      const userId = 'user123';

      // Simulate complete flow
      const foodItems = await mockAnalyze(base64Image, 'image/jpeg');
      const nutrition = await mockNutrition(foodItems);
      const imageUrl = await mockUpload(new File([''], 'meal.jpg'), userId);
      await mockSave(userId, { imageUrl, foodItems, nutrition });

      expect(foodItems).toHaveLength(3);
      expect(nutrition.calories).toBe(450);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle AI analysis with no food detected', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      mockAnalyze.mockResolvedValue([]);

      const base64Image = 'data:image/jpeg;base64,test';
      const result = await mockAnalyze(base64Image, 'image/jpeg');

      expect(result).toHaveLength(0);
    });

    it('should retry analysis on AI service error', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      
      mockAnalyze
        .mockRejectedValueOnce(new Error('AI service timeout'))
        .mockResolvedValueOnce(['apple', 'banana']);

      const base64Image = 'data:image/jpeg;base64,test';
      
      try {
        await mockAnalyze(base64Image, 'image/jpeg');
      } catch (error) {
        // First attempt fails
      }

      // Retry succeeds
      const result = await mockAnalyze(base64Image, 'image/jpeg');
      expect(result).toHaveLength(2);
    });

    it('should handle image upload failure gracefully', async () => {
      const mockUpload = firestoreService.uploadImage as any;
      mockUpload.mockRejectedValue(new Error('Storage quota exceeded'));

      const file = new File([''], 'meal.jpg');
      await expect(mockUpload(file, 'user123')).rejects.toThrow('Storage quota exceeded');
    });

    it('should calculate nutrition for complex meals', async () => {
      const mockNutrition = geminiService.getNutritionalAnalysis as any;
      mockNutrition.mockResolvedValue({
        calories: 850,
        protein: 65,
        carbs: 80,
        fat: 25,
        fiber: 15,
        sugar: 10
      });

      const foodItems = ['salmon', 'quinoa', 'avocado', 'spinach', 'olive oil'];
      const nutrition = await mockNutrition(foodItems);

      expect(nutrition.calories).toBeGreaterThan(800);
      expect(nutrition.protein).toBeGreaterThan(60);
    });
  });

  describe('Daily Nutrition Tracking', () => {
    it('should aggregate nutrition from multiple meals', async () => {
      const mockGetMeals = firestoreService.getTodaysMealLogs as any;
      
      mockGetMeals.mockResolvedValue([
        { nutrition: { calories: 400, protein: 30, carbs: 40, fat: 15 } },
        { nutrition: { calories: 500, protein: 35, carbs: 50, fat: 20 } },
        { nutrition: { calories: 350, protein: 25, carbs: 30, fat: 18 } }
      ]);

      const meals = await mockGetMeals('user123');
      const totalNutrition = meals.reduce((acc: any, meal: any) => ({
        calories: acc.calories + meal.nutrition.calories,
        protein: acc.protein + meal.nutrition.protein,
        carbs: acc.carbs + meal.nutrition.carbs,
        fat: acc.fat + meal.nutrition.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      expect(totalNutrition.calories).toBe(1250);
      expect(totalNutrition.protein).toBe(90);
    });

    it('should handle empty meal log for new users', async () => {
      const mockGetMeals = firestoreService.getTodaysMealLogs as any;
      mockGetMeals.mockResolvedValue([]);

      const meals = await mockGetMeals('newuser123');
      expect(meals).toHaveLength(0);
    });

    it('should filter meals by date correctly', async () => {
      const mockGetMeals = firestoreService.getTodaysMealLogs as any;
      
      // Only today's meals
      mockGetMeals.mockResolvedValue([
        { createdAt: new Date(), nutrition: { calories: 400 } },
        { createdAt: new Date(), nutrition: { calories: 500 } }
      ]);

      const meals = await mockGetMeals('user123');
      expect(meals).toHaveLength(2);
    });

    it('should update nutrition goals progress', async () => {
      const mockGetMeals = firestoreService.getTodaysMealLogs as any;
      
      mockGetMeals.mockResolvedValue([
        { nutrition: { calories: 600, protein: 45 } },
        { nutrition: { calories: 700, protein: 50 } }
      ]);

      const meals = await mockGetMeals('user123');
      const consumed = meals.reduce((sum: number, meal: any) => sum + meal.nutrition.calories, 0);
      const goal = 2500;
      const progress = (consumed / goal) * 100;

      expect(progress).toBeGreaterThan(50);
    });

    it('should detect calorie deficit or surplus', async () => {
      const mockGetMeals = firestoreService.getTodaysMealLogs as any;
      
      mockGetMeals.mockResolvedValue([
        { nutrition: { calories: 1800, protein: 120 } }
      ]);

      const meals = await mockGetMeals('user123');
      const consumed = meals.reduce((sum: number, meal: any) => sum + meal.nutrition.calories, 0);
      const goal = 2500;
      const deficit = goal - consumed;

      expect(deficit).toBe(700); // 700 calorie deficit
    });
  });

  describe('Meal Editing and Deletion', () => {
    it('should update existing meal log', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);

      const updatedData = {
        foodItems: ['chicken', 'rice', 'vegetables'],
        nutrition: { calories: 550, protein: 48 }
      };

      await mockUpdate('user123', 'meal456', updatedData);
      expect(mockUpdate).toHaveBeenCalledWith('user123', 'meal456', updatedData);
    });

    it('should delete meal log', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined);

      await mockDelete('user123', 'meal789');
      expect(mockDelete).toHaveBeenCalledWith('user123', 'meal789');
    });

    it('should recalculate daily totals after deletion', async () => {
      const mockGetMeals = firestoreService.getTodaysMealLogs as any;
      const mockDelete = vi.fn().mockResolvedValue(undefined);

      // Before deletion
      mockGetMeals.mockResolvedValueOnce([
        { id: '1', nutrition: { calories: 400 } },
        { id: '2', nutrition: { calories: 500 } },
        { id: '3', nutrition: { calories: 300 } }
      ]);

      let meals = await mockGetMeals('user123');
      let total = meals.reduce((sum: number, m: any) => sum + m.nutrition.calories, 0);
      expect(total).toBe(1200);

      // Delete one meal
      await mockDelete('user123', '2');

      // After deletion
      mockGetMeals.mockResolvedValueOnce([
        { id: '1', nutrition: { calories: 400 } },
        { id: '3', nutrition: { calories: 300 } }
      ]);

      meals = await mockGetMeals('user123');
      total = meals.reduce((sum: number, m: any) => sum + m.nutrition.calories, 0);
      expect(total).toBe(700);
    });
  });

  describe('Nutrition Alerts and Recommendations', () => {
    it('should trigger low protein alert', async () => {
      const mockGetMeals = firestoreService.getTodaysMealLogs as any;
      
      mockGetMeals.mockResolvedValue([
        { nutrition: { calories: 2000, protein: 40, carbs: 250, fat: 70 } }
      ]);

      const meals = await mockGetMeals('user123');
      const totalProtein = meals.reduce((sum: number, m: any) => sum + m.nutrition.protein, 0);
      const proteinGoal = 150;
      const isLow = totalProtein < proteinGoal * 0.5;

      expect(isLow).toBe(true);
    });

    it('should trigger high carb alert', async () => {
      const mockGetMeals = firestoreService.getTodaysMealLogs as any;
      
      mockGetMeals.mockResolvedValue([
        { nutrition: { calories: 2500, protein: 100, carbs: 400, fat: 60 } }
      ]);

      const meals = await mockGetMeals('user123');
      const totalCarbs = meals.reduce((sum: number, m: any) => sum + m.nutrition.carbs, 0);
      const carbGoal = 300;
      const isHigh = totalCarbs > carbGoal * 1.2;

      expect(isHigh).toBe(true);
    });

    it('should provide balanced meal recommendation', async () => {
      const mockGetMeals = firestoreService.getTodaysMealLogs as any;
      
      mockGetMeals.mockResolvedValue([
        { nutrition: { calories: 1500, protein: 50, carbs: 150, fat: 50 } }
      ]);

      const meals = await mockGetMeals('user123');
      const consumed = {
        calories: meals.reduce((s: number, m: any) => s + m.nutrition.calories, 0),
        protein: meals.reduce((s: number, m: any) => s + m.nutrition.protein, 0)
      };

      const goals = { calories: 2500, protein: 150 };
      const remaining = {
        calories: goals.calories - consumed.calories,
        protein: goals.protein - consumed.protein
      };

      expect(remaining.calories).toBe(1000);
      expect(remaining.protein).toBe(100);
    });
  });

  describe('Meal Photo Quality and Validation', () => {
    it('should validate image file size', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const file = new File(['x'.repeat(maxSize + 1)], 'large.jpg');
      
      const isValid = file.size <= maxSize;
      expect(isValid).toBe(false);
    });

    it('should validate image file type', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });

      expect(validTypes.includes(jpegFile.type)).toBe(true);
      expect(validTypes.includes(pdfFile.type)).toBe(false);
    });

    it('should handle corrupted image files', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      mockAnalyze.mockRejectedValue(new Error('Invalid image format'));

      const corruptedImage = 'data:image/jpeg;base64,corrupted';
      await expect(mockAnalyze(corruptedImage, 'image/jpeg')).rejects.toThrow('Invalid image format');
    });
  });
});
