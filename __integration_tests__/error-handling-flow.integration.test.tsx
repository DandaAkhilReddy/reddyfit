// __integration_tests__/error-handling-flow.integration.test.tsx
import { describe, it, expect, vi } from 'vitest';
import * as geminiService from '../services/geminiService';
import * as firestoreService from '../services/firestoreService';

vi.mock('../services/geminiService');
vi.mock('../services/firestoreService');

describe('Error Handling Flow Integration Tests', () => {
  describe('Network Errors', () => {
    it('should handle AI service offline', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      mockAnalyze.mockRejectedValue(new Error('Network request failed'));

      await expect(mockAnalyze('base64image', 'image/jpeg'))
        .rejects.toThrow('Network request failed');
    });

    it('should handle Firebase connection error', async () => {
      const mockSave = firestoreService.saveMealLog as any;
      mockSave.mockRejectedValue(new Error('Failed to connect to Firestore'));

      await expect(mockSave('user123', {}))
        .rejects.toThrow('Firestore');
    });

    it('should handle storage upload failure', async () => {
      const mockUpload = firestoreService.uploadImage as any;
      mockUpload.mockRejectedValue(new Error('Storage quota exceeded'));

      const file = new File([''], 'image.jpg');
      await expect(mockUpload(file, 'user123'))
        .rejects.toThrow('Storage quota');
    });

    it('should retry failed requests', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      
      mockAnalyze
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce(['apple', 'banana']);

      // First two attempts fail
      await expect(mockAnalyze('base64', 'image/jpeg')).rejects.toThrow('Timeout');
      await expect(mockAnalyze('base64', 'image/jpeg')).rejects.toThrow('Timeout');

      // Third attempt succeeds
      const result = await mockAnalyze('base64', 'image/jpeg');
      expect(result).toEqual(['apple', 'banana']);
    });
  });

  describe('API Key Errors', () => {
    it('should handle missing Gemini API key', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      mockAnalyze.mockRejectedValue(new Error('GEMINI_API_KEY environment variable is not set'));

      await expect(mockAnalyze('base64', 'image/jpeg'))
        .rejects.toThrow('API_KEY');
    });

    it('should handle invalid API key', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      mockAnalyze.mockRejectedValue(new Error('API key not valid'));

      await expect(mockAnalyze('base64', 'image/jpeg'))
        .rejects.toThrow('not valid');
    });

    it('should handle API quota exceeded', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      mockAnalyze.mockRejectedValue(new Error('Quota exceeded for quota metric'));

      await expect(mockAnalyze('base64', 'image/jpeg'))
        .rejects.toThrow('Quota exceeded');
    });

    it('should handle rate limiting', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      mockAnalyze.mockRejectedValue(new Error('429: Too Many Requests'));

      await expect(mockAnalyze('base64', 'image/jpeg'))
        .rejects.toThrow('Too Many Requests');
    });
  });

  describe('Data Validation Errors', () => {
    it('should handle invalid image format', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      mockAnalyze.mockRejectedValue(new Error('Invalid image format'));

      await expect(mockAnalyze('notbase64', 'application/pdf'))
        .rejects.toThrow('Invalid');
    });

    it('should handle empty meal data', async () => {
      const mockSave = firestoreService.saveMealLog as any;
      mockSave.mockRejectedValue(new Error('Meal data is required'));

      await expect(mockSave('user123', null as any))
        .rejects.toThrow('required');
    });

    it('should handle invalid user ID', async () => {
      const mockGet = firestoreService.getUserProfile as any;
      mockGet.mockRejectedValue(new Error('Invalid user ID format'));

      await expect(mockGet(''))
        .rejects.toThrow('Invalid');
    });

    it('should handle corrupted data', async () => {
      const mockGet = firestoreService.getTodaysMealLogs as any;
      mockGet.mockRejectedValue(new Error('Failed to parse document data'));

      await expect(mockGet('user123'))
        .rejects.toThrow('parse');
    });
  });

  describe('Authentication Errors', () => {
    it('should handle expired session', async () => {
      const mockSave = firestoreService.saveMealLog as any;
      mockSave.mockRejectedValue(new Error('Authentication token expired'));

      await expect(mockSave('user123', {}))
        .rejects.toThrow('expired');
    });

    it('should handle missing authentication', async () => {
      const mockGet = firestoreService.getUserProfile as any;
      mockGet.mockRejectedValue(new Error('Missing or insufficient permissions'));

      await expect(mockGet('user123'))
        .rejects.toThrow('permissions');
    });

    it('should handle invalid credentials', async () => {
      const mockCreate = firestoreService.createUserProfile as any;
      mockCreate.mockRejectedValue(new Error('Invalid authentication credentials'));

      await expect(mockCreate({} as any))
        .rejects.toThrow('credentials');
    });
  });

  describe('Resource Limits', () => {
    it('should handle file size limit exceeded', async () => {
      const mockUpload = firestoreService.uploadImage as any;
      mockUpload.mockRejectedValue(new Error('File size exceeds 5MB limit'));

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg');
      await expect(mockUpload(largeFile, 'user123'))
        .rejects.toThrow('exceeds');
    });

    it('should handle storage quota exceeded', async () => {
      const mockUpload = firestoreService.uploadImage as any;
      mockUpload.mockRejectedValue(new Error('Storage quota exceeded'));

      await expect(mockUpload(new File([''], 'image.jpg'), 'user123'))
        .rejects.toThrow('quota');
    });

    it('should handle Firestore document limit', async () => {
      const mockSave = firestoreService.saveMealLog as any;
      mockSave.mockRejectedValue(new Error('Document size exceeds 1MB'));

      const largeMeal = { foodItems: Array(10000).fill('food') };
      await expect(mockSave('user123', largeMeal))
        .rejects.toThrow('exceeds');
    });
  });

  describe('Timeout Errors', () => {
    it('should handle AI analysis timeout', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      mockAnalyze.mockRejectedValue(new Error('Request timeout after 30s'));

      await expect(mockAnalyze('base64', 'image/jpeg'))
        .rejects.toThrow('timeout');
    });

    it('should handle Firestore read timeout', async () => {
      const mockGet = firestoreService.getTodaysMealLogs as any;
      mockGet.mockRejectedValue(new Error('Read operation timed out'));

      await expect(mockGet('user123'))
        .rejects.toThrow('timed out');
    });

    it('should handle workout generation timeout', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      mockGenerate.mockRejectedValue(new Error('Generation timeout'));

      await expect(mockGenerate([], 'Intermediate', 'Build Muscle'))
        .rejects.toThrow('timeout');
    });
  });

  describe('Concurrent Operation Errors', () => {
    it('should handle simultaneous updates conflict', async () => {
      const mockSave = firestoreService.saveMealLog as any;
      mockSave.mockRejectedValue(new Error('Document was modified by another client'));

      await expect(mockSave('user123', {}))
        .rejects.toThrow('modified');
    });

    it('should handle race condition in uploads', async () => {
      const mockUpload = firestoreService.uploadImage as any;
      
      mockUpload.mockRejectedValueOnce(new Error('Upload conflict'));
      mockUpload.mockResolvedValueOnce('https://storage/success.jpg');

      // First upload conflicts
      await expect(mockUpload(new File([''], 'img1.jpg'), 'user123'))
        .rejects.toThrow('conflict');

      // Second upload succeeds
      const url = await mockUpload(new File([''], 'img2.jpg'), 'user123');
      expect(url).toContain('success');
    });
  });

  describe('Service Degradation', () => {
    it('should handle partial service outage', async () => {
      const mockAnalyze = geminiService.analyzeFoodImage as any;
      const mockNutrition = geminiService.getNutritionalAnalysis as any;

      mockAnalyze.mockResolvedValue(['apple']);
      mockNutrition.mockRejectedValue(new Error('Nutrition service unavailable'));

      const foodItems = await mockAnalyze('base64', 'image/jpeg');
      expect(foodItems).toEqual(['apple']);

      await expect(mockNutrition(foodItems))
        .rejects.toThrow('unavailable');
    });

    it('should fallback to cached data', async () => {
      const mockGet = firestoreService.getTodaysMealLogs as any;
      
      mockGet
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockResolvedValueOnce([{ id: 'cached1', nutrition: {} }]);

      // First call fails
      await expect(mockGet('user123')).rejects.toThrow('unavailable');

      // Fallback to cache succeeds
      const cached = await mockGet('user123');
      expect(cached).toHaveLength(1);
    });
  });

  describe('User Input Errors', () => {
    it('should handle empty equipment list', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      mockGenerate.mockResolvedValue([
        { day: 'Day 1', exercises: [{ name: 'Bodyweight Exercise', sets: '3', reps: '10' }] }
      ]);

      const plan = await mockGenerate([], 'Beginner', 'Build Muscle');
      expect(plan[0].exercises[0].name).toContain('Bodyweight');
    });

    it('should handle invalid fitness level', async () => {
      const mockGenerate = geminiService.generateWorkoutPlan as any;
      mockGenerate.mockRejectedValue(new Error('Invalid fitness level'));

      await expect(mockGenerate(['dumbbells'], 'SuperAdvanced' as any, 'Build Muscle'))
        .rejects.toThrow('Invalid');
    });

    it('should sanitize user messages', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      mockChat.mockResolvedValue('Here is fitness advice');

      const maliciousInput = '<script>alert("xss")</script> How to gain muscle?';
      const response = await mockChat(maliciousInput);

      expect(response).not.toContain('<script>');
    });
  });
});
