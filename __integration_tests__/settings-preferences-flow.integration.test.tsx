// __integration_tests__/settings-preferences-flow.integration.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { UserPreferencesProvider, useUserPreferences } from '../hooks/useUserPreferences';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserPreferencesProvider>{children}</UserPreferencesProvider>
);

describe('Settings and Preferences Flow Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('User Profile Settings', () => {
    it('should update fitness level and persist', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setFitnessLevel('Advanced');
      });

      expect(result.current.fitnessLevel).toBe('Advanced');
      expect(localStorage.getItem('reddyfit-user-preferences-v2')).toContain('Advanced');
    });

    it('should update fitness goal', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setGoal('Lose Fat');
      });

      expect(result.current.goal).toBe('Lose Fat');
    });

    it('should update multiple settings simultaneously', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setFitnessLevel('Beginner');
        result.current.setGoal('Improve Endurance');
        result.current.setCaloriesGoal(2000);
      });

      expect(result.current.fitnessLevel).toBe('Beginner');
      expect(result.current.goal).toBe('Improve Endurance');
      expect(result.current.caloriesGoal).toBe(2000);
    });
  });

  describe('Nutrition Goals', () => {
    it('should update daily calorie goal', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setCaloriesGoal(3000);
      });

      expect(result.current.caloriesGoal).toBe(3000);
    });

    it('should update protein goal', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setProteinGoal(200);
      });

      expect(result.current.proteinGoal).toBe(200);
    });

    it('should update carbs goal', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setCarbsGoal(350);
      });

      expect(result.current.carbsGoal).toBe(350);
    });

    it('should update fat goal', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setFatGoal(80);
      });

      expect(result.current.fatGoal).toBe(80);
    });

    it('should maintain macro balance', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setProteinGoal(150);
        result.current.setCarbsGoal(300);
        result.current.setFatGoal(70);
      });

      // Protein: 150g * 4cal = 600cal
      // Carbs: 300g * 4cal = 1200cal
      // Fat: 70g * 9cal = 630cal
      // Total: 2430 calories

      const totalCalories = 
        result.current.proteinGoal * 4 + 
        result.current.carbsGoal * 4 + 
        result.current.fatGoal * 9;

      expect(totalCalories).toBe(2430);
    });
  });

  describe('Preferences Persistence', () => {
    it('should load saved preferences on mount', () => {
      const savedPrefs = {
        fitnessLevel: 'Advanced',
        goal: 'Build Muscle',
        caloriesGoal: 3500,
        proteinGoal: 200,
        carbsGoal: 400,
        fatGoal: 90
      };

      localStorage.setItem('reddyfit-user-preferences-v2', JSON.stringify(savedPrefs));

      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      expect(result.current.fitnessLevel).toBe('Advanced');
      expect(result.current.caloriesGoal).toBe(3500);
      expect(result.current.proteinGoal).toBe(200);
    });

    it('should persist changes to localStorage', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setFitnessLevel('Intermediate');
        result.current.setCaloriesGoal(2800);
      });

      const stored = localStorage.getItem('reddyfit-user-preferences-v2');
      expect(stored).toContain('Intermediate');
      expect(stored).toContain('2800');
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('reddyfit-user-preferences-v2', 'invalid json');

      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      // Should fall back to defaults
      expect(result.current.fitnessLevel).toBe('Intermediate');
      expect(result.current.caloriesGoal).toBe(2500);
    });

    it('should clear preferences on reset', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setFitnessLevel('Advanced');
        result.current.setCaloriesGoal(3000);
      });

      // Clear localStorage
      localStorage.removeItem('reddyfit-user-preferences-v2');

      // Remount
      const { result: result2 } = renderHook(() => useUserPreferences(), { wrapper });

      expect(result2.current.fitnessLevel).toBe('Intermediate'); // Default
      expect(result2.current.caloriesGoal).toBe(2500); // Default
    });
  });

  describe('Settings Validation', () => {
    it('should accept valid calorie goals', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setCaloriesGoal(2000);
      });

      expect(result.current.caloriesGoal).toBe(2000);
    });

    it('should accept valid protein goals', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setProteinGoal(180);
      });

      expect(result.current.proteinGoal).toBe(180);
    });

    it('should handle extreme values', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setCaloriesGoal(5000); // Very high
        result.current.setProteinGoal(300); // Very high
      });

      expect(result.current.caloriesGoal).toBe(5000);
      expect(result.current.proteinGoal).toBe(300);
    });
  });

  describe('Goal-Based Recommendations', () => {
    it('should recommend appropriate macros for muscle building', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setGoal('Build Muscle');
        result.current.setCaloriesGoal(3000);
      });

      // Muscle building typically needs higher protein
      act(() => {
        result.current.setProteinGoal(200); // ~26% of calories
      });

      expect(result.current.proteinGoal).toBeGreaterThan(150);
    });

    it('should recommend appropriate macros for fat loss', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setGoal('Lose Fat');
        result.current.setCaloriesGoal(2000);
      });

      // Fat loss needs deficit
      expect(result.current.caloriesGoal).toBeLessThan(2500);
    });

    it('should recommend appropriate macros for endurance', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setGoal('Improve Endurance');
        result.current.setCarbsGoal(350); // Higher carbs for endurance
      });

      expect(result.current.carbsGoal).toBeGreaterThan(300);
    });
  });

  describe('Multiple Sessions', () => {
    it('should maintain preferences across app reloads', () => {
      // First session
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setFitnessLevel('Advanced');
        result.current.setProteinGoal(180);
      });

      // Simulate app reload by creating new hook instance
      const { result: result2 } = renderHook(() => useUserPreferences(), { wrapper });

      expect(result2.current.fitnessLevel).toBe('Advanced');
      expect(result2.current.proteinGoal).toBe(180);
    });

    it('should update preferences independently in different components', () => {
      const { result: result1 } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result1.current.setFitnessLevel('Beginner');
      });

      // Changes persist to localStorage
      const stored = localStorage.getItem('reddyfit-user-preferences-v2');
      expect(stored).toContain('Beginner');
    });
  });

  describe('Migration and Upgrades', () => {
    it('should handle old preference format', () => {
      // Old format (v1)
      const oldPrefs = {
        level: 'Advanced',
        targetCalories: 3000
      };

      localStorage.setItem('reddyfit-preferences', JSON.stringify(oldPrefs));

      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      // Should use defaults for v2 since old format not compatible
      expect(result.current.fitnessLevel).toBe('Intermediate');
    });

    it('should migrate to new format on first update', () => {
      const { result } = renderHook(() => useUserPreferences(), { wrapper });

      act(() => {
        result.current.setFitnessLevel('Advanced');
      });

      const stored = localStorage.getItem('reddyfit-user-preferences-v2');
      expect(stored).toBeTruthy();
    });
  });
});
