// VoicePipeline.js - Complete voice processing pipeline integrating all services

const EventEmitter = require('events');
const AzureSpeechToText = require('../services/voice/AzureSpeechToText');
const AzureOpenAI = require('../services/ai/AzureOpenAI');
const AzureTextToSpeech = require('../services/voice/AzureTextToSpeech');
const AzureCommunicationVoIP = require('../services/telephony/AzureCommunicationVoIP');

class VoicePipeline extends EventEmitter {
  constructor(sessionId, config = {}) {
    super();
    this.sessionId = sessionId;
    this.config = config;
    this.logger = config.logger || console;
    
    // Initialize services
    this.stt = new AzureSpeechToText(config.stt);
    this.ai = new AzureOpenAI(config.ai);
    this.tts = new AzureTextToSpeech(config.tts);
    this.voip = new AzureCommunicationVoIP(config.voip);
    
    // Pipeline state
    this.isActive = false;
    this.isProcessing = false;
    this.conversationState = {
      transcript: [],
      context: {},
      startTime: Date.now()
    };
    
    // Audio buffers
    this.incomingAudioBuffer = [];
    this.outgoingAudioBuffer = [];
    
    // Performance metrics
    this.metrics = {
      sttLatency: [],
      aiLatency: [],
      ttsLatency: [],
      totalLatency: []
    };
  }

  async initialize() {
    try {
      this.logger.info(`Initializing voice pipeline for session ${this.sessionId}`);
      
      // Initialize all services
      await Promise.all([
        this.stt.initialize(),
        this.ai.initialize(),
        this.tts.initialize(),
        this.voip.initialize()
      ]);
      
      this.setupEventHandlers();
      this.isActive = true;
      
      this.emit('initialized', { sessionId: this.sessionId });
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize pipeline: ${error.message}`);
      this.emit('error', error);
      throw error;
    }
  }

  setupEventHandlers() {
    // Speech-to-Text events
    this.stt.on('recognizing', (data) => {
      this.emit('transcribing', {
        text: data.text,
        isFinal: false
      });
    });

    this.stt.on('recognized', async (data) => {
      const sttEndTime = Date.now();
      
      // Add to transcript
      this.conversationState.transcript.push({
        role: 'user',
        text: data.text,
        timestamp: data.timestamp,
        confidence: data.confidence
      });
      
      this.emit('transcribed', {
        text: data.text,
        confidence: data.confidence
      });
      
      // Process with AI if not already processing
      if (!this.isProcessing) {
        this.isProcessing = true;
        await this.processWithAI(data.text, sttEndTime);
        this.isProcessing = false;
      }
    });

    // VoIP events
    this.voip.on('incomingCall', async (callData) => {
      this.logger.info(`Incoming call: ${callData.callId}`);
      this.emit('callStarted', callData);
      await this.startCallProcessing();
    });

    this.voip.on('audioReceived', (data) => {
      // Forward audio to STT
      this.stt.sendAudio(data.audioData);
    });

    this.voip.on('callDisconnected', (data) => {
      this.logger.info(`Call ended: ${data.callId}`);
      this.emit('callEnded', data);
      this.stopPipeline();
    });

    // Error handling
    [this.stt, this.ai, this.tts, this.voip].forEach(service => {
      service.on('error', (error) => {
        this.logger.error(`Service error: ${error.message}`);
        this.emit('error', error);
      });
    });
  }

  async processWithAI(userText, sttEndTime) {
    const aiStartTime = Date.now();
    const sttLatency = sttEndTime - aiStartTime;
    
    try {
      // Get AI response
      const response = await this.ai.processConversation(
        this.sessionId,
        userText,
        this.conversationState.context
      );
      
      const aiEndTime = Date.now();
      const aiLatency = aiEndTime - aiStartTime;
      
      // Update conversation state
      this.conversationState.transcript.push({
        role: 'assistant',
        text: response.response,
        timestamp: new Date().toISOString(),
        intent: response.intent
      });
      
      // Update context based on intent
      if (response.intent === 'schedule_appointment' && response.entities) {
        this.conversationState.context.pendingAppointment = response.entities;
      }
      
      this.emit('aiResponse', {
        text: response.response,
        intent: response.intent,
        entities: response.entities
      });
      
      // Convert to speech
      await this.processTextToSpeech(response.response, aiEndTime);
      
      // Update metrics
      this.metrics.sttLatency.push(sttLatency);
      this.metrics.aiLatency.push(aiLatency);
      
    } catch (error) {
      this.logger.error(`AI processing error: ${error.message}`);
      // Fallback response
      await this.processTextToSpeech(
        "I apologize, but I'm having trouble processing your request. Please hold while I transfer you to a human receptionist."
      );
    }
  }

  async processTextToSpeech(text, aiEndTime) {
    const ttsStartTime = Date.now();
    
    try {
      // Stream audio synthesis
      await this.tts.synthesizeToStream(text, async (audioChunk) => {
        // Send audio chunk to VoIP
        await this.voip.sendAudio(audioChunk);
        
        this.emit('audioChunkSent', {
          size: audioChunk.length,
          timestamp: Date.now()
        });
      });
      
      const ttsEndTime = Date.now();
      const ttsLatency = ttsEndTime - ttsStartTime;
      const totalLatency = ttsEndTime - (aiEndTime - this.metrics.aiLatency[this.metrics.aiLatency.length - 1]);
      
      // Update metrics
      this.metrics.ttsLatency.push(ttsLatency);
      this.metrics.totalLatency.push(totalLatency);
      
      this.emit('responseComplete', {
        text: text,
        totalLatency: totalLatency,
        metrics: {
          stt: this.metrics.sttLatency[this.metrics.sttLatency.length - 1],
          ai: this.metrics.aiLatency[this.metrics.aiLatency.length - 1],
          tts: ttsLatency
        }
      });
      
      // Log performance
      this.logger.info(`Pipeline latency - Total: ${totalLatency}ms, STT: ${this.metrics.sttLatency[this.metrics.sttLatency.length - 1]}ms, AI: ${this.metrics.aiLatency[this.metrics.aiLatency.length - 1]}ms, TTS: ${ttsLatency}ms`);
      
    } catch (error) {
      this.logger.error(`TTS processing error: ${error.message}`);
      this.emit('error', error);
    }
  }

  async startCallProcessing() {
    try {
      // Start continuous speech recognition
      await this.stt.startContinuousRecognition();
      
      // Send initial greeting
      const greeting = "Thank you for calling Azure Medical Center. My name is ReddyTalk, and I'll be happy to help you today. How can I assist you?";
      await this.processTextToSpeech(greeting);
      
      this.emit('pipelineStarted', {
        sessionId: this.sessionId,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.logger.error(`Failed to start call processing: ${error.message}`);
      this.emit('error', error);
    }
  }

  // Handle incoming WebSocket audio (for web-based calls)
  async processWebSocketAudio(audioData) {
    if (!this.isActive) return;
    
    try {
      // Convert audio format if needed
      const processedAudio = this.preprocessAudio(audioData);
      
      // Send to STT
      this.stt.sendAudio(processedAudio);
      
    } catch (error) {
      this.logger.error(`WebSocket audio processing error: ${error.message}`);
      this.emit('error', error);
    }
  }

  // Preprocess audio to correct format
  preprocessAudio(audioData) {
    // Convert to 16kHz, 16-bit PCM mono if needed
    // This is a placeholder - implement actual audio processing
    return audioData;
  }

  // Get conversation summary
  async getConversationSummary() {
    try {
      const summary = await this.ai.getConversationSummary(this.sessionId);
      
      return {
        sessionId: this.sessionId,
        duration: Date.now() - this.conversationState.startTime,
        transcript: this.conversationState.transcript,
        summary: summary,
        metrics: {
          avgSttLatency: this.average(this.metrics.sttLatency),
          avgAiLatency: this.average(this.metrics.aiLatency),
          avgTtsLatency: this.average(this.metrics.ttsLatency),
          avgTotalLatency: this.average(this.metrics.totalLatency),
          turnCount: this.conversationState.transcript.length
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get conversation summary: ${error.message}`);
      return null;
    }
  }

  // Calculate average
  average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  // Stop the pipeline
  async stopPipeline() {
    try {
      this.isActive = false;
      
      // Stop all services
      await Promise.all([
        this.stt.stop(),
        this.voip.endCall()
      ]);
      
      // Clear conversation history
      this.ai.clearHistory(this.sessionId);
      
      // Get and emit final summary
      const summary = await this.getConversationSummary();
      this.emit('pipelineStopped', summary);
      
    } catch (error) {
      this.logger.error(`Error stopping pipeline: ${error.message}`);
      this.emit('error', error);
    }
  }

  // Handle specific intents
  async handleIntent(intent, entities) {
    switch (intent) {
      case 'emergency':
        // Immediately transfer to human or provide emergency guidance
        await this.processTextToSpeech(
          "I understand this is an emergency. For immediate medical emergencies, please hang up and dial 911. If you need urgent care, I can help schedule an appointment right away."
        );
        break;
        
      case 'schedule_appointment':
        // Process appointment scheduling
        if (entities.doctor && entities.time) {
          await this.processTextToSpeech(
            `I'll check availability for ${entities.doctor} around ${entities.time}. One moment please.`
          );
          // Would integrate with actual scheduling system here
        }
        break;
        
      case 'transfer_request':
        // Transfer to human receptionist
        await this.processTextToSpeech(
          "Of course, I'll transfer you to one of our human receptionists. Please hold."
        );
        await this.voip.transferCall("+12065550199"); // Human receptionist line
        break;
    }
  }

  // Get pipeline status
  getStatus() {
    return {
      sessionId: this.sessionId,
      isActive: this.isActive,
      isProcessing: this.isProcessing,
      callStats: this.voip.getCallStats(),
      metrics: {
        avgSttLatency: this.average(this.metrics.sttLatency),
        avgAiLatency: this.average(this.metrics.aiLatency),
        avgTtsLatency: this.average(this.metrics.ttsLatency),
        avgTotalLatency: this.average(this.metrics.totalLatency)
      }
    };
  }
}

module.exports = VoicePipeline;