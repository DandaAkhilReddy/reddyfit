// ElevenLabs Voice AI Service for Human-like Voice Response
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Bella voice - sounds professional
    
    // Voice settings for medical receptionist
    this.voiceSettings = {
      stability: 0.85,        // Higher stability for professional tone
      similarity_boost: 0.75, // Natural similarity
      style: 0.2,             // Subtle style for medical context
      use_speaker_boost: true
    };
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🎙️ Initializing ElevenLabs Voice Service...');
      
      if (!this.apiKey) {
        console.warn('⚠️ ElevenLabs API key not provided - voice synthesis disabled');
        return;
      }

      // Test API connection
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        console.log('✅ ElevenLabs API connected successfully');
        console.log(`📊 Available voices: ${response.data.voices.length}`);
        
        // Log the voice we're using
        const selectedVoice = response.data.voices.find(v => v.voice_id === this.voiceId);
        if (selectedVoice) {
          console.log(`🎯 Using voice: ${selectedVoice.name} (${selectedVoice.category})`);
        }
        
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('❌ ElevenLabs initialization failed:', error.message);
      // Continue without voice synthesis - will use fallback
    }
  }

  async synthesizeText(text, options = {}) {
    try {
      if (!this.isInitialized || !this.apiKey) {
        console.warn('⚠️ ElevenLabs not initialized - using text fallback');
        return { success: false, error: 'Service not available' };
      }

      console.log(`🎤 Synthesizing: "${text.substring(0, 50)}..."`);

      const requestData = {
        text: text,
        model_id: options.model_id || 'eleven_multilingual_v2',
        voice_settings: {
          ...this.voiceSettings,
          ...options.voice_settings
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${options.voice_id || this.voiceId}`,
        requestData,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer',
          timeout: 30000 // 30 second timeout for voice generation
        }
      );

      if (response.status === 200) {
        console.log('✅ Voice synthesis completed');
        return {
          success: true,
          audioBuffer: response.data,
          contentType: 'audio/mpeg',
          text: text
        };
      }

    } catch (error) {
      console.error('❌ ElevenLabs synthesis error:', error.message);
      return {
        success: false,
        error: error.message,
        text: text
      };
    }
  }

  async generateMedicalReceptionistResponse(userInput, context = {}) {
    try {
      // Generate contextual medical receptionist response
      const responses = this.getMedicalResponses(userInput, context);
      const selectedResponse = this.selectBestResponse(responses, context);
      
      console.log(`🏥 Medical AI Response: "${selectedResponse.substring(0, 100)}..."`);
      
      // Synthesize the voice
      const audioResult = await this.synthesizeText(selectedResponse, {
        voice_settings: {
          stability: 0.9,  // Extra stable for medical context
          similarity_boost: 0.8,
          style: 0.1       // Professional, minimal style
        }
      });

      return {
        text: selectedResponse,
        audio: audioResult,
        context: context,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Medical response generation failed:', error);
      return this.getFallbackResponse(userInput);
    }
  }

  getMedicalResponses(userInput, context) {
    const input = userInput.toLowerCase();
    
    // Appointment scheduling responses
    if (input.includes('appointment') || input.includes('schedule')) {
      return [
        "I'd be happy to help you schedule an appointment. What type of appointment would you like to book, and do you have a preferred date and time?",
        "Of course! Let me help you with scheduling. What kind of medical service do you need, and when works best for you?",
        "I can definitely assist with that appointment. Which doctor would you like to see, and what dates work for your schedule?"
      ];
    }

    // Insurance verification responses
    if (input.includes('insurance') || input.includes('coverage')) {
      return [
        "I can help verify your insurance coverage. Could you please provide your insurance card information and member ID?",
        "Let me check your insurance benefits. What insurance company do you have, and do you have your policy number available?",
        "I'll be glad to verify your coverage. Please hold while I look up your insurance information."
      ];
    }

    // General inquiry responses
    if (input.includes('question') || input.includes('help')) {
      return [
        "I'm here to help! What questions do you have about our medical services?",
        "Of course, I'd be happy to assist you. What information do you need?",
        "How can I help you today? I can assist with appointments, insurance, or answer questions about our services."
      ];
    }

    // Emergency responses
    if (input.includes('emergency') || input.includes('urgent')) {
      return [
        "For medical emergencies, please call 911 immediately. For urgent but non-emergency care, I can help you find the nearest urgent care facility.",
        "If this is a medical emergency, please hang up and dial 911. For urgent medical needs, let me connect you with our on-call nurse.",
        "Emergency situations require immediate attention. Please call 911 for emergencies, or I can help schedule an urgent care appointment."
      ];
    }

    // Default responses
    return [
      "Thank you for calling our medical office. How may I assist you today?",
      "Hello! I'm here to help with your medical needs. What can I do for you?",
      "Good day! I'm your virtual medical assistant. How can I help you today?"
    ];
  }

  selectBestResponse(responses, context) {
    // Simple selection - in production, this could use AI to select the most contextually appropriate
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  getFallbackResponse(userInput) {
    return {
      text: "Thank you for calling. I'm here to help with your medical needs. How may I assist you today?",
      audio: { success: false, error: 'Voice synthesis unavailable' },
      context: { fallback: true },
      timestamp: new Date().toISOString()
    };
  }

  async getAvailableVoices() {
    try {
      if (!this.apiKey) {
        return { success: false, error: 'API key not provided' };
      }

      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        voices: response.data.voices.map(voice => ({
          id: voice.voice_id,
          name: voice.name,
          category: voice.category,
          description: voice.description,
          preview_url: voice.preview_url
        }))
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testVoiceSynthesis() {
    const testText = "Hello, thank you for calling our medical office. I'm your AI assistant, how may I help you today?";
    const result = await this.synthesizeText(testText);
    
    if (result.success) {
      console.log('✅ ElevenLabs voice synthesis test passed');
      return { success: true, message: 'Voice synthesis working' };
    } else {
      console.log('❌ ElevenLabs voice synthesis test failed');
      return { success: false, error: result.error };
    }
  }

  getMetrics() {
    return {
      service: 'ElevenLabs',
      initialized: this.isInitialized,
      voiceId: this.voiceId,
      apiKeyConfigured: !!this.apiKey,
      voiceSettings: this.voiceSettings
    };
  }
}

module.exports = ElevenLabsService;