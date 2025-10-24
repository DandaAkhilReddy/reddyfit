import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  calculateNutritionTargets,
  calculateBMI,
  classifyBMI,
  validateUserMetrics,
  type UserMetrics
} from '../nutritionCalculator';

describe('nutritionCalculator', () => {
  const sampleMaleMetrics: UserMetrics = {
    age: 30,
    sex: 'male',
    weight_kg: 75,
    height_cm: 180,
    activity_level: 1.55,
    goal: 'maintain'
  };

  const sampleFemaleMetrics: UserMetrics = {
    age: 28,
    sex: 'female',
    weight_kg: 60,
    height_cm: 165,
    activity_level: 1.375,
    goal: 'lose'
  };

  describe('calculateBMR', () => {
    it('should calculate BMR correctly for male', () => {
      const bmr = calculateBMR(sampleMaleMetrics);
      // 10*75 + 6.25*180 - 5*30 + 5 = 750 + 1125 - 150 + 5 = 1730
      expect(bmr).toBe(1730);
    });

    it('should calculate BMR correctly for female', () => {
      const bmr = calculateBMR(sampleFemaleMetrics);
      // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25
      expect(bmr).toBeCloseTo(1330, 0);
    });

    it('should handle "other" sex by using average', () => {
      const metrics = { ...sampleMaleMetrics, sex: 'other' as const };
      const bmr = calculateBMR(metrics);
      expect(bmr).toBeGreaterThan(0);
      expect(bmr).toBeLessThan(calculateBMR(sampleMaleMetrics));
    });
  });

  describe('calculateTDEE', () => {
    it('should multiply BMR by activity level', () => {
      const bmr = 1730;
      const tdee = calculateTDEE(bmr, 1.55);
      expect(tdee).toBe(Math.round(1730 * 1.55)); // 2682
    });

    it('should handle sedentary activity level', () => {
      const bmr = 1500;
      const tdee = calculateTDEE(bmr, 1.2);
      expect(tdee).toBe(1800);
    });
  });

  describe('calculateTargetCalories', () => {
    const tdee = 2000;

    it('should reduce calories by 20% for weight loss', () => {
      const target = calculateTargetCalories(tdee, 'lose');
      expect(target).toBe(1600); // 2000 * 0.8
    });

    it('should increase calories by 15% for weight gain', () => {
      const target = calculateTargetCalories(tdee, 'gain');
      expect(target).toBe(2300); // 2000 * 1.15
    });

    it('should maintain calories for maintenance goal', () => {
      const target = calculateTargetCalories(tdee, 'maintain');
      expect(target).toBe(2000);
    });
  });

  describe('calculateMacros', () => {
    it('should calculate macros for maintenance', () => {
      const macros = calculateMacros(2000, 75, 'maintain');
      
      expect(macros.protein_g).toBe(120); // 75 * 1.6
      expect(macros.fat_g).toBeCloseTo(60, 0); // (2000 * 0.27) / 9
      expect(macros.carbs_g).toBeGreaterThan(0);
      expect(macros.fiber_g).toBe(28); // (2000/1000) * 14
    });

    it('should have higher protein for weight loss', () => {
      const macros = calculateMacros(1600, 75, 'lose');
      expect(macros.protein_g).toBe(165); // 75 * 2.2
    });

    it('should balance calories across macros', () => {
      const calories = 2000;
      const macros = calculateMacros(calories, 75, 'maintain');
      
      const protein_cal = macros.protein_g * 4;
      const fat_cal = macros.fat_g * 9;
      const carbs_cal = macros.carbs_g * 4;
      const total = protein_cal + fat_cal + carbs_cal;
      
      expect(total).toBeCloseTo(calories, -1); // Within 10 calories
    });
  });

  describe('calculateNutritionTargets', () => {
    it('should calculate complete nutrition targets', () => {
      const targets = calculateNutritionTargets(sampleMaleMetrics);
      
      expect(targets.bmr).toBeGreaterThan(0);
      expect(targets.tdee).toBeGreaterThan(targets.bmr);
      expect(targets.calories).toBeGreaterThan(0);
      expect(targets.protein_g).toBeGreaterThan(0);
      expect(targets.carbs_g).toBeGreaterThan(0);
      expect(targets.fat_g).toBeGreaterThan(0);
      expect(targets.fiber_g).toBeGreaterThan(0);
      
      // Check micronutrients exist
      expect(targets.vitamin_d_mcg).toBe(15);
      expect(targets.calcium_mg).toBe(1000);
      expect(targets.iron_mg).toBe(8); // Male
    });

    it('should have different iron RDA for females', () => {
      const targets = calculateNutritionTargets(sampleFemaleMetrics);
      expect(targets.iron_mg).toBe(18); // Female < 50
    });

    it('should adjust calories based on goal', () => {
      const maintain = calculateNutritionTargets({ ...sampleMaleMetrics, goal: 'maintain' });
      const lose = calculateNutritionTargets({ ...sampleMaleMetrics, goal: 'lose' });
      const gain = calculateNutritionTargets({ ...sampleMaleMetrics, goal: 'gain' });
      
      expect(lose.calories).toBeLessThan(maintain.calories);
      expect(gain.calories).toBeGreaterThan(maintain.calories);
    });
  });

  describe('calculateBMI', () => {
    it('should calculate BMI correctly', () => {
      const bmi = calculateBMI(75, 180);
      // 75 / (1.8 ^ 2) = 75 / 3.24 = 23.1
      expect(bmi).toBeCloseTo(23.1, 1);
    });

    it('should handle edge cases', () => {
      expect(calculateBMI(50, 150)).toBeCloseTo(22.2, 1);
      expect(calculateBMI(100, 200)).toBe(25.0);
    });
  });

  describe('classifyBMI', () => {
    it('should classify underweight correctly', () => {
      expect(classifyBMI(17)).toBe('Underweight');
    });

    it('should classify normal weight correctly', () => {
      expect(classifyBMI(22)).toBe('Normal weight');
    });

    it('should classify overweight correctly', () => {
      expect(classifyBMI(27)).toBe('Overweight');
    });

    it('should classify obese correctly', () => {
      expect(classifyBMI(32)).toBe('Obese');
    });
  });

  describe('validateUserMetrics', () => {
    it('should pass validation for valid metrics', () => {
      const errors = validateUserMetrics(sampleMaleMetrics);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid age', () => {
      const errors = validateUserMetrics({ ...sampleMaleMetrics, age: 10 });
      expect(errors).toContain('Age must be between 13 and 120');
    });

    it('should reject invalid weight', () => {
      const errors = validateUserMetrics({ ...sampleMaleMetrics, weight_kg: 20 });
      expect(errors).toContain('Weight must be between 30 and 300 kg');
    });

    it('should reject invalid height', () => {
      const errors = validateUserMetrics({ ...sampleMaleMetrics, height_cm: 90 });
      expect(errors).toContain('Height must be between 100 and 250 cm');
    });

    it('should reject invalid sex', () => {
      const errors = validateUserMetrics({ ...sampleMaleMetrics, sex: 'invalid' as any });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject missing required fields', () => {
      const errors = validateUserMetrics({ age: 30 } as any);
      expect(errors.length).toBeGreaterThan(1);
    });
  });
});
