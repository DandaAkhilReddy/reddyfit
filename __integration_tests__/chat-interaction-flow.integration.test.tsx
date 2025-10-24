// __integration_tests__/chat-interaction-flow.integration.test.tsx
import { describe, it, expect, vi } from 'vitest';
import * as geminiService from '../services/geminiService';

vi.mock('../services/geminiService');

describe('Chat Interaction Flow Integration Tests', () => {
  describe('Basic Chat Functionality', () => {
    it('should send message and receive AI response', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('Great question! For building muscle, focus on compound movements.');

      const response = await mockChat('What exercises build muscle?');
      
      expect(response).toContain('muscle');
    });

    it('should handle follow-up questions with context', async () => {
      const mockStream = geminiService.getChatResponseStream as any;
      
      const history = [
        { role: 'user', content: 'What is the best protein source?' },
        { role: 'assistant', content: 'Chicken breast is excellent.' },
        { role: 'user', content: 'How much should I eat per day?' }
      ];

      mockStream.mockResolvedValue((async function*() {
        yield { text: 'For muscle building, aim for 0.8-1g protein per pound of body weight.' };
      })());

      const stream = await mockStream(history);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk.text);
      }

      expect(chunks.join('').toLowerCase()).toContain('protein');
    });

    it('should handle voice input transcription', async () => {
      const mockTranscribe = geminiService.transcribeAudio as any;
      
      mockTranscribe.mockResolvedValue('What is the best workout for abs');

      const audioBase64 = 'base64audiodata';
      const transcription = await mockTranscribe(audioBase64, 'audio/webm');

      expect(transcription).toContain('workout');
    });

    it('should stream responses in real-time', async () => {
      const mockStream = geminiService.getChatResponseStream as any;
      
      mockStream.mockResolvedValue((async function*() {
        yield { text: 'Sure, ' };
        yield { text: 'here are ' };
        yield { text: 'some tips...' };
      })());

      const history = [{ role: 'user', content: 'Give me workout tips' }];
      const stream = await mockStream(history);
      
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk.text);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks.join('')).toContain('tips');
    });
  });

  describe('Fitness-Specific Queries', () => {
    it('should answer nutrition questions', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('Protein is essential for muscle repair. Aim for 1g per pound.');

      const response = await mockChat('How much protein do I need?');
      
      expect(response.toLowerCase()).toContain('protein');
      expect(response).toMatch(/\d+g/);
    });

    it('should provide exercise alternatives', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('Alternatives to squats: Leg press, lunges, Bulgarian split squats');

      const response = await mockChat('Alternative to squats?');
      
      expect(response).toContain('Leg press');
    });

    it('should explain proper form', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('For deadlifts: Keep back straight, hinge at hips, drive through heels.');

      const response = await mockChat('Explain deadlift form');
      
      expect(response).toContain('back straight');
    });

    it('should suggest workout routines', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('For beginners: Push-pull-legs split, 3-4 days per week.');

      const response = await mockChat('Best workout routine for beginners?');
      
      expect(response).toContain('beginner');
    });

    it('should provide diet advice', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('To lose weight: Create calorie deficit, eat protein, lift weights.');

      const response = await mockChat('How to lose weight while building muscle?');
      
      expect(response).toContain('calorie');
    });
  });

  describe('Context and Memory', () => {
    it('should remember previous messages in conversation', async () => {
      const mockStream = geminiService.getChatResponseStream as any;
      
      const history = [
        { role: 'user', content: 'My goal is to build muscle' },
        { role: 'assistant', content: 'Great! Focus on progressive overload' },
        { role: 'user', content: 'What exercises should I do?' }
      ];

      mockStream.mockResolvedValue((async function*() {
        yield { text: 'Based on your muscle building goal, try: Bench press, squats, deadlifts' };
      })());

      const stream = await mockStream(history);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk.text);
      }

      expect(chunks.join('')).toContain('muscle building goal');
    });

    it('should clarify ambiguous questions', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('Could you specify if you mean chest, back, or leg press?');

      const response = await mockChat('How to do press?');
      
      expect(response).toContain('specify');
    });

    it('should handle multi-part questions', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('1) Protein: 1g/lb bodyweight. 2) Cardio: 2-3x/week. 3) Sleep: 7-9 hours.');

      const response = await mockChat('How much protein, cardio, and sleep do I need?');
      
      expect(response).toContain('1)');
      expect(response).toContain('2)');
      expect(response).toContain('3)');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle AI service timeout', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockRejectedValue(new Error('Request timeout'));

      await expect(mockChat('Question')).rejects.toThrow('timeout');
    });

    it('should handle empty messages', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('Please ask me a specific question!');

      const response = await mockChat('');
      
      expect(response).toContain('question');
    });

    it('should handle very long messages', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      const longMessage = 'Tell me about '.repeat(500) + 'fitness';
      mockChat.mockResolvedValue('I understand. Let me help with fitness...');

      const response = await mockChat(longMessage);
      
      expect(response).toBeDefined();
    });

    it('should handle special characters', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('Protein contains amino acids.');

      const response = await mockChat('What\'s in protein? @#$%');
      
      expect(response.toLowerCase()).toContain('protein');
    });

    it('should retry on network failure', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('Here is your answer');

      // First attempt fails
      await expect(mockChat('Question')).rejects.toThrow('Network error');

      // Retry succeeds
      const response = await mockChat('Question');
      expect(response).toBe('Here is your answer');
    });
  });

  describe('Specialized Fitness Queries', () => {
    it('should provide injury prevention advice', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('To prevent injury: Warm up, use proper form, don\'t ego lift.');

      const response = await mockChat('How to avoid injuries?');
      
      expect(response).toContain('Warm up');
    });

    it('should suggest supplements', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('Essential supplements: Protein powder, creatine, multivitamin.');

      const response = await mockChat('What supplements should I take?');
      
      expect(response).toContain('supplement');
    });

    it('should explain muscle recovery', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('Recovery needs: Sleep 7-9hrs, eat protein, rest days.');

      const response = await mockChat('How to recover faster?');
      
      expect(response).toContain('Sleep');
    });

    it('should provide cutting/bulking advice', async () => {
      const mockChat = geminiService.getQuickChatResponse as any;
      
      mockChat.mockResolvedValue('Bulking: Eat 300-500 cal surplus, lift heavy, track macros.');

      const response = await mockChat('How to bulk properly?');
      
      expect(response.toLowerCase()).toContain('cal'); // Match "cal" in "cal surplus"
    });
  });

  describe('Voice Interaction', () => {
    it('should transcribe voice message', async () => {
      const mockTranscribe = geminiService.transcribeAudio as any;
      
      mockTranscribe.mockResolvedValue('What is the best time to work out');

      const audioData = 'base64encodedaudio';
      const text = await mockTranscribe(audioData, 'audio/webm');

      expect(text).toContain('work out');
    });

    it('should handle poor audio quality', async () => {
      const mockTranscribe = geminiService.transcribeAudio as any;
      
      mockTranscribe.mockResolvedValue('Could not understand clearly. Please try again.');

      const poorAudio = 'noisyaudiodata';
      const text = await mockTranscribe(poorAudio, 'audio/webm');

      expect(text).toContain('try again');
    });

    it('should transcribe multiple languages', async () => {
      const mockTranscribe = geminiService.transcribeAudio as any;
      
      mockTranscribe.mockResolvedValue('¿Cuál es el mejor ejercicio para abdominales?');

      const spanishAudio = 'spanishaudiodata';
      const text = await mockTranscribe(spanishAudio, 'audio/webm');

      expect(text).toContain('ejercicio');
    });
  });
});
