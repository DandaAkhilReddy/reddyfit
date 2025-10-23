import { describe, it, expect, beforeEach } from 'vitest';
import * as dbService from '../dbService';

describe('dbService', () => {
  beforeEach(async () => {
    await dbService.initDB();
    await dbService.clearAllData();
  });

  describe('initDB', () => {
    it('should initialize the database', async () => {
      await expect(dbService.initDB()).resolves.not.toThrow();
    });
  });

  describe('set and get', () => {
    it('should store and retrieve a value', async () => {
      const testData = { name: 'Test Workout', exercises: ['Squat', 'Bench'] };
      
      await dbService.set('workoutPlans', 'test-key', testData);
      const result = await dbService.get('workoutPlans', 'test-key');
      
      expect(result).toEqual(testData);
    });

    it('should return undefined for non-existent key', async () => {
      const result = await dbService.get('workoutPlans', 'non-existent');
      
      expect(result).toBeUndefined();
    });

    it('should overwrite existing value', async () => {
      const data1 = { value: 'first' };
      const data2 = { value: 'second' };
      
      await dbService.set('workoutPlans', 'test-key', data1);
      await dbService.set('workoutPlans', 'test-key', data2);
      
      const result = await dbService.get('workoutPlans', 'test-key');
      
      expect(result).toEqual(data2);
    });

    it('should handle complex objects', async () => {
      const complexData = {
        plan: [
          { day: 'Monday', exercises: [{ name: 'Squat', sets: '3', reps: '10' }] },
          { day: 'Tuesday', exercises: [{ name: 'Bench', sets: '4', reps: '8' }] },
        ],
        equipment: 'Barbell, Dumbbells',
        createdAt: new Date().toISOString(),
      };
      
      await dbService.set('workoutPlans', 'complex-key', complexData);
      const result = await dbService.get('workoutPlans', 'complex-key');
      
      expect(result).toEqual(complexData);
    });
  });

  describe('clearAllData', () => {
    it('should clear all data from all stores', async () => {
      await dbService.set('workoutPlans', 'key1', { data: 'test1' });
      await dbService.set('workoutPlans', 'key2', { data: 'test2' });
      
      await dbService.clearAllData();
      
      const result1 = await dbService.get('workoutPlans', 'key1');
      const result2 = await dbService.get('workoutPlans', 'key2');
      
      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });
  });

  describe('multiple keys', () => {
    it('should store multiple values independently', async () => {
      const data1 = { plan: 'Plan A' };
      const data2 = { plan: 'Plan B' };
      const data3 = { plan: 'Plan C' };
      
      await dbService.set('workoutPlans', 'key1', data1);
      await dbService.set('workoutPlans', 'key2', data2);
      await dbService.set('workoutPlans', 'key3', data3);
      
      expect(await dbService.get('workoutPlans', 'key1')).toEqual(data1);
      expect(await dbService.get('workoutPlans', 'key2')).toEqual(data2);
      expect(await dbService.get('workoutPlans', 'key3')).toEqual(data3);
    });
  });
});
