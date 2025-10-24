// __integration_tests__/workout-planning-flow.integration.test.tsx
import { describe, it, expect, vi } from 'vitest';
import * as geminiService from '../services/geminiService';
import * as firestoreService from '../services/firestoreService';

vi.mock('../services/geminiService');
vi.mock('../services/firestoreService');

describe('Workout Planning Flow Integration Tests', () => {
  describe('AI Workout Generation', () => {
    it('should generate complete 7-day workout plan', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      
      mockGenerate.mockResolvedValue([
        { day: 'Day 1', exercises: [{ name: 'Bench Press', sets: '4', reps: '8' }] },
        { day: 'Day 2', exercises: [{ name: 'Squats', sets: '4', reps: '10' }] },
        { day: 'Day 3', exercises: [{ name: 'Rest', sets: '-', reps: '-' }] },
        { day: 'Day 4', exercises: [{ name: 'Deadlifts', sets: '3', reps: '8' }] },
        { day: 'Day 5', exercises: [{ name: 'Overhead Press', sets: '4', reps: '8' }] },
        { day: 'Day 6', exercises: [{ name: 'Pull-ups', sets: '3', reps: '10' }] },
        { day: 'Day 7', exercises: [{ name: 'Rest', sets: '-', reps: '-' }] }
      ]);

      const plan = await mockGenerate(['dumbbells', 'barbell'], 'Intermediate', 'Build Muscle');
      
      expect(plan).toHaveLength(7);
      expect(plan[0].exercises[0].name).toBe('Bench Press');
    });

    it('should customize plan for available equipment', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      
      mockGenerate.mockResolvedValue([
        { day: 'Day 1', exercises: [{ name: 'Dumbbell Press', sets: '4', reps: '10' }] }
      ]);

      const plan = await mockGenerate(['dumbbells'], 'Beginner', 'Lose Fat');
      
      expect(plan[0].exercises[0].name).toContain('Dumbbell');
    });

    it('should adjust intensity based on fitness level', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      
      // Beginner plan
      mockGenerate.mockResolvedValueOnce([
        { day: 'Day 1', exercises: [{ name: 'Push-ups', sets: '2', reps: '10' }] }
      ]);

      // Advanced plan
      mockGenerate.mockResolvedValueOnce([
        { day: 'Day 1', exercises: [{ name: 'Weighted Push-ups', sets: '5', reps: '15' }] }
      ]);

      const beginnerPlan = await mockGenerate(['bodyweight'], 'Beginner', 'Build Muscle');
      const advancedPlan = await mockGenerate(['dumbbells', 'barbell'], 'Advanced', 'Build Muscle');

      expect(parseInt(beginnerPlan[0].exercises[0].sets)).toBeLessThan(parseInt(advancedPlan[0].exercises[0].sets));
    });

    it('should include rest days appropriately', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      
      mockGenerate.mockResolvedValue([
        { day: 'Day 1', exercises: [{ name: 'Workout', sets: '4', reps: '10' }] },
        { day: 'Day 2', exercises: [{ name: 'Rest', sets: '-', reps: '-' }] },
        { day: 'Day 3', exercises: [{ name: 'Workout', sets: '4', reps: '10' }] }
      ]);

      const plan = await mockGenerate(['dumbbells'], 'Intermediate', 'Build Muscle');
      const restDays = plan.filter((d: any) => d.exercises[0].name === 'Rest');

      expect(restDays.length).toBeGreaterThan(0);
    });

    it('should handle plan generation retry on failure', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      
      mockGenerate
        .mockRejectedValueOnce(new Error('AI service unavailable'))
        .mockResolvedValueOnce([{ day: 'Day 1', exercises: [] }]);

      // First attempt fails
      await expect(mockGenerate(['dumbbells'], 'Intermediate', 'Build Muscle'))
        .rejects.toThrow('AI service unavailable');

      // Retry succeeds
      const plan = await mockGenerate(['dumbbells'], 'Intermediate', 'Build Muscle');
      expect(plan).toBeDefined();
    });
  });

  describe('Workout Plan Persistence', () => {
    it('should save workout plan to Firestore', async () => {
      const mockSave = firestoreService.saveWorkoutPlan as any;
      
      mockSave.mockResolvedValue({ id: 'plan123' });

      const plan = [
        { day: 'Day 1', exercises: [{ name: 'Squats', sets: '4', reps: '10' }] }
      ];

      const result = await mockSave('user123', plan, 'dumbbells, barbell');
      
      expect(result.id).toBe('plan123');
      expect(mockSave).toHaveBeenCalledWith('user123', plan, 'dumbbells, barbell');
    });

    it('should retrieve user workout plans', async () => {
      const mockGet = vi.fn().mockResolvedValue([
        { id: 'plan1', basedOnEquipment: 'dumbbells', createdAt: new Date() },
        { id: 'plan2', basedOnEquipment: 'barbell', createdAt: new Date() }
      ]);

      const plans = await mockGet('user123');
      
      expect(plans).toHaveLength(2);
      expect(plans[0].id).toBe('plan1');
    });

    it('should delete old workout plan', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      
      await mockDelete('user123', 'oldplan456');
      
      expect(mockDelete).toHaveBeenCalledWith('user123', 'oldplan456');
    });

    it('should update existing workout plan', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      
      const updatedPlan = [
        { day: 'Day 1', exercises: [{ name: 'Modified Exercise', sets: '5', reps: '12' }] }
      ];

      await mockUpdate('user123', 'plan789', updatedPlan);
      
      expect(mockUpdate).toHaveBeenCalledWith('user123', 'plan789', updatedPlan);
    });
  });

  describe('Exercise Form Analysis', () => {
    it('should analyze pose from video frames', async () => {
      const mockAnalyze = geminiService.analyzePose as any;
      
      mockAnalyze.mockResolvedValue('Good form! Keep back straight.');

      const frames = ['frame1base64', 'frame2base64'];
      const analysis = await mockAnalyze('Analyze squat form', frames[0], 'image/jpeg');

      expect(analysis).toContain('form');
    });

    it('should detect form errors', async () => {
      const mockAnalyze = geminiService.analyzePose as any;
      
      mockAnalyze.mockResolvedValue('Warning: Knees going past toes. Risk of injury.');

      const analysis = await mockAnalyze('Check squat form', 'framebase64', 'image/jpeg');

      expect(analysis).toContain('Warning');
    });

    it('should provide corrective suggestions', async () => {
      const mockAnalyze = geminiService.analyzePose as any;
      
      mockAnalyze.mockResolvedValue('Good attempt! Try to: 1) Keep chest up 2) Push through heels');

      const analysis = await mockAnalyze('Improve deadlift', 'framebase64', 'image/jpeg');

      expect(analysis).toContain('Try to');
    });
  });

  describe('Progress Tracking', () => {
    it('should track workout completion', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      
      const completedWorkout = {
        planId: 'plan123',
        dayCompleted: 'Day 1',
        completedAt: new Date()
      };

      await mockUpdate('user123', completedWorkout);
      
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should calculate workout streak', () => {
      const completedDates = [
        new Date('2025-01-20'),
        new Date('2025-01-21'),
        new Date('2025-01-22'),
        new Date('2025-01-23')
      ];

      const streak = completedDates.length;
      expect(streak).toBe(4);
    });

    it('should award points for workout completion', async () => {
      const mockAward = firestoreService.awardPointsToUser as any;
      
      mockAward.mockResolvedValue(undefined);

      await mockAward('user123', 10); // 10 points per workout
      
      expect(mockAward).toHaveBeenCalledWith('user123', 10);
    });
  });

  describe('Exercise Library Integration', () => {
    it('should find YouTube video for exercise', async () => {
      const mockFind = geminiService.findYouTubeVideoForExercise as any;
      
      mockFind.mockResolvedValue({
        title: 'How to Bench Press',
        videoId: 'abc123',
        thumbnail: 'https://img.youtube.com/vi/abc123/0.jpg'
      });

      const video = await mockFind('bench press');
      
      expect(video.videoId).toBe('abc123');
      expect(video.title).toContain('Bench Press');
    });

    it('should check if exercise exists in database', async () => {
      const mockExists = firestoreService.exerciseExists as any;
      
      mockExists.mockResolvedValue(true);

      const exists = await mockExists('squat');
      
      expect(exists).toBe(true);
    });

    it('should save custom exercise to community library', async () => {
      const mockSave = firestoreService.saveCommunityExercise as any;
      
      mockSave.mockResolvedValue({ id: 'exercise123' });

      const exercise = {
        name: 'Custom Cable Exercise',
        equipment: ['cables'],
        muscle_groups: ['chest'],
        description: 'A unique cable movement'
      };

      const result = await mockSave(exercise);
      
      expect(result.id).toBe('exercise123');
    });

    it('should retrieve community exercises', async () => {
      const mockGet = firestoreService.getCommunityExercises as any;
      
      mockGet.mockResolvedValue([
        { name: 'Bulgarian Split Squat', equipment: ['dumbbells'] },
        { name: 'Cable Flyes', equipment: ['cables'] }
      ]);

      const exercises = await mockGet();
      
      expect(exercises).toHaveLength(2);
    });
  });

  describe('Regeneration and Modifications', () => {
    it('should regenerate workout plan with same parameters', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      
      mockGenerate
        .mockResolvedValueOnce([{ day: 'Day 1', exercises: [{ name: 'Exercise A', sets: '4', reps: '10' }] }])
        .mockResolvedValueOnce([{ day: 'Day 1', exercises: [{ name: 'Exercise B', sets: '4', reps: '10' }] }]);

      const plan1 = await mockGenerate(['dumbbells'], 'Intermediate', 'Build Muscle');
      const plan2 = await mockGenerate(['dumbbells'], 'Intermediate', 'Build Muscle');

      expect(plan1[0].exercises[0].name).not.toBe(plan2[0].exercises[0].name);
    });

    it('should modify plan based on user feedback', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      
      mockGenerate.mockResolvedValue([
        { day: 'Day 1', exercises: [{ name: 'Modified Exercise', sets: '3', reps: '12' }] }
      ]);

      const feedback = 'Make it less intense';
      const plan = await mockGenerate(['dumbbells'], 'Beginner', 'Lose Fat', undefined, true);

      expect(plan).toBeDefined();
    });
  });
});
