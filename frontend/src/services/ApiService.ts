/**
 * ApiService - Handles all API calls to Azure Functions backend
 * - Session management
 * - Audio upload and processing
 * - Speech-to-text conversion
 * - AI conversation
 * - Text-to-speech conversion
 */

export interface SessionResponse {
  sessionId: string;
  status: 'active' | 'ended';
  startTime: string;
  metadata?: Record<string, any>;
}

export interface TranscriptionResponse {
  text: string;
  confidence: number;
  duration: number;
  language?: string;
}

export interface AIResponse {
  text: string;
  audioUrl?: string;
  sessionId: string;
  messageId: string;
  processingTime: number;
}

export interface UploadResponse {
  audioUrl: string;
  fileName: string;
  fileSize: number;
  uploadTime: string;
}

export class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = '/api', timeout: number = 30000) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
  }

  /**
   * Generic fetch wrapper with error handling and timeout
   */
  private async fetchWithTimeout(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Start a new conversation session
   */
  async startSession(): Promise<SessionResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/session/start`, {
        method: 'POST',
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting session:', error);
      throw new Error('Failed to start session');
    }
  }

  /**
   * End a conversation session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      await this.fetchWithTimeout(`${this.baseUrl}/session/end`, {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          endTime: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error ending session:', error);
      // Don't throw - session ending is not critical
    }
  }

  /**
   * Upload audio file to backend
   */
  async uploadAudio(audioBlob: Blob, sessionId?: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      const timestamp = new Date().toISOString();
      const fileName = `audio-${timestamp.replace(/[:.]/g, '-')}.wav`;
      
      formData.append('audio', audioBlob, fileName);
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }
      formData.append('timestamp', timestamp);

      // Don't set Content-Type header for FormData - let browser set it
      const response = await fetch(`${this.baseUrl}/audio/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`Upload failed: ${response.statusText} - ${errorBody}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw new Error('Failed to upload audio');
    }
  }

  /**
   * Convert audio to text using Azure Speech Services
   */
  async speechToText(audioUrl: string, sessionId?: string): Promise<TranscriptionResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/speech/transcribe`, {
        method: 'POST',
        body: JSON.stringify({
          audioUrl,
          sessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      
      if (!data.text || data.text.trim() === '') {
        throw new Error('No speech detected in audio');
      }

      return data;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Get AI response from transcribed text
   */
  async getAIResponse(
    text: string, 
    sessionId: string, 
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<AIResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/ai/chat`, {
        method: 'POST',
        body: JSON.stringify({
          text,
          sessionId,
          conversationHistory: conversationHistory || [],
          timestamp: new Date().toISOString(),
          settings: {
            temperature: 0.7,
            maxTokens: 150, // Limit for voice responses
            includeContext: true,
          },
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Convert text to speech using Eleven Labs or Azure TTS
   */
  async textToSpeech(
    text: string, 
    sessionId?: string,
    voiceId?: string,
    provider?: 'elevenlabs' | 'azure'
  ): Promise<string> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/speech/synthesize`, {
        method: 'POST',
        body: JSON.stringify({
          text,
          sessionId,
          voiceId: voiceId || 'default',
          provider: provider || 'elevenlabs',
          timestamp: new Date().toISOString(),
          settings: {
            speed: 1.0,
            pitch: 1.0,
            volume: 1.0,
          },
        }),
      });

      const data = await response.json();
      return data.audioUrl;
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Complete voice-to-voice pipeline in one call
   */
  async processVoiceMessage(
    audioBlob: Blob,
    sessionId: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{
    transcription: TranscriptionResponse;
    aiResponse: AIResponse;
    audioUrl: string;
  }> {
    try {
      // Step 1: Upload audio
      const uploadResult = await this.uploadAudio(audioBlob, sessionId);

      // Step 2: Transcribe audio
      const transcription = await this.speechToText(uploadResult.audioUrl, sessionId);

      // Step 3: Get AI response
      const aiResponse = await this.getAIResponse(
        transcription.text, 
        sessionId, 
        conversationHistory
      );

      // Step 4: Convert response to speech (if not already included)
      let audioUrl = aiResponse.audioUrl;
      if (!audioUrl) {
        audioUrl = await this.textToSpeech(aiResponse.text, sessionId);
      }

      return {
        transcription,
        aiResponse,
        audioUrl,
      };
    } catch (error) {
      console.error('Error processing voice message:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Backend service unavailable');
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId: string): Promise<Array<{
    id: string;
    type: 'user' | 'ai';
    text: string;
    timestamp: string;
    audioUrl?: string;
  }>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/session/${sessionId}/history`, {
        method: 'GET',
      });

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return []; // Return empty array if history unavailable
    }
  }

  /**
   * Get available voices for TTS
   */
  async getAvailableVoices(): Promise<Array<{
    id: string;
    name: string;
    language: string;
    gender: 'male' | 'female';
    provider: 'elevenlabs' | 'azure';
  }>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/speech/voices`, {
        method: 'GET',
      });

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error getting available voices:', error);
      return []; // Return empty array if voices unavailable
    }
  }

  /**
   * Set API base URL (useful for different environments)
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Set request timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }
}

export default ApiService;