import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { UserPreferencesProvider, useUserPreferences } from '../useUserPreferences';

describe('useUserPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide default preferences', () => {
    const { result } = renderHook(() => useUserPreferences(), {
      wrapper: UserPreferencesProvider,
    });

    expect(result.current.fitnessLevel).toBe('Intermediate');
    expect(result.current.goal).toBe('Build Muscle');
    expect(result.current.caloriesGoal).toBe(2500);
    expect(result.current.proteinGoal).toBe(150);
    expect(result.current.carbsGoal).toBe(300);
    expect(result.current.fatGoal).toBe(70);
  });

  it('should update fitness level', () => {
    const { result } = renderHook(() => useUserPreferences(), {
      wrapper: UserPreferencesProvider,
    });

    act(() => {
      result.current.setFitnessLevel('Advanced');
    });

    expect(result.current.fitnessLevel).toBe('Advanced');
  });

  it('should update goal', () => {
    const { result } = renderHook(() => useUserPreferences(), {
      wrapper: UserPreferencesProvider,
    });

    act(() => {
      result.current.setGoal('Lose Fat');
    });

    expect(result.current.goal).toBe('Lose Fat');
  });

  it('should update nutrition goals', () => {
    const { result } = renderHook(() => useUserPreferences(), {
      wrapper: UserPreferencesProvider,
    });

    act(() => {
      result.current.setCaloriesGoal(2000);
      result.current.setProteinGoal(180);
      result.current.setCarbsGoal(250);
      result.current.setFatGoal(60);
    });

    expect(result.current.caloriesGoal).toBe(2000);
    expect(result.current.proteinGoal).toBe(180);
    expect(result.current.carbsGoal).toBe(250);
    expect(result.current.fatGoal).toBe(60);
  });

  it('should persist preferences to localStorage', () => {
    const { result } = renderHook(() => useUserPreferences(), {
      wrapper: UserPreferencesProvider,
    });

    act(() => {
      result.current.setFitnessLevel('Beginner');
      result.current.setGoal('Improve Endurance');
    });

    const stored = localStorage.getItem('reddyfit-user-preferences-v2');
    expect(stored).toBeTruthy();
    
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.fitnessLevel).toBe('Beginner');
      expect(parsed.goal).toBe('Improve Endurance');
    }
  });

  it('should load preferences from localStorage', () => {
    const testPrefs = {
      fitnessLevel: 'Advanced',
      goal: 'Build Muscle',
      caloriesGoal: 3000,
      proteinGoal: 200,
      carbsGoal: 400,
      fatGoal: 80,
    };

    localStorage.setItem('reddyfit-user-preferences-v2', JSON.stringify(testPrefs));

    const { result } = renderHook(() => useUserPreferences(), {
      wrapper: UserPreferencesProvider,
    });

    expect(result.current.fitnessLevel).toBe('Advanced');
    expect(result.current.caloriesGoal).toBe(3000);
    expect(result.current.proteinGoal).toBe(200);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useUserPreferences());
    }).toThrow('useUserPreferences must be used within a UserPreferencesProvider');
  });
});
