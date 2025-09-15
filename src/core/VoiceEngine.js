// VoiceEngine.js - Core voice processing engine for ReddyTalk.ai

const VoicePipeline = require('./VoicePipeline');

class VoiceEngine {
  constructor(sessionId, options = {}) {
    this.sessionId = sessionId;
    this.logger = options.logger || console;
    this.metrics = options.metrics || {};
    this.pipeline = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Create voice pipeline with configuration
      this.pipeline = new VoicePipeline(this.sessionId, {
        logger: this.logger,
        stt: {
          subscriptionKey: process.env.AZURE_SPEECH_KEY,
          region: process.env.AZURE_SPEECH_REGION
        },
        ai: {
          apiKey: process.env.AZURE_OPENAI_API_KEY,
          endpoint: process.env.AZURE_OPENAI_ENDPOINT,
          deployment: process.env.AZURE_OPENAI_DEPLOYMENT
        },
        tts: {
          subscriptionKey: process.env.AZURE_SPEECH_KEY,
          region: process.env.AZURE_SPEECH_REGION,
          voiceName: process.env.AZURE_SPEECH_VOICE
        },
        voip: {
          connectionString: process.env.AZURE_COMMUNICATION_CONNECTION_STRING,
          phoneNumber: process.env.AZURE_COMMUNICATION_PHONE_NUMBER
        }
      });

      // Set up pipeline event handlers
      this.setupPipelineHandlers();

      // Initialize the pipeline
      await this.pipeline.initialize();
      this.isInitialized = true;

      this.logger.info(`Voice engine initialized for session ${this.sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize voice engine: ${error.message}`);
      throw error;
    }
  }

  setupPipelineHandlers() {
    // Forward pipeline events
    this.pipeline.on('transcribing', (data) => {
      this.logger.debug(`Transcribing: ${data.text}`);
    });

    this.pipeline.on('transcribed', (data) => {
      this.logger.info(`User said: ${data.text} (confidence: ${data.confidence})`);
    });

    this.pipeline.on('aiResponse', (data) => {
      this.logger.info(`AI response: ${data.text} [${data.intent}]`);
    });

    this.pipeline.on('responseComplete', (data) => {
      this.logger.info(`Response delivered in ${data.totalLatency}ms`);
      
      // Update metrics
      if (this.metrics.httpDuration) {
        this.metrics.httpDuration
          .labels('voice_pipeline', 'process', '200')
          .observe(data.totalLatency);
      }
    });

    this.pipeline.on('error', (error) => {
      this.logger.error(`Pipeline error: ${error.message}`);
    });
  }

  async processAudio(audioData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Process audio through the pipeline
      await this.pipeline.processWebSocketAudio(audioData);
      
      // Return null as audio is streamed directly through the pipeline
      return null;
    } catch (error) {
      this.logger.error(`Error processing audio: ${error.message}`);
      throw error;
    }
  }

  async handleControlMessage(message) {
    try {
      this.logger.info(`Handling control message: ${message.type}`);
      
      switch (message.type) {
        case 'start':
          if (!this.isInitialized) {
            await this.initialize();
          }
          await this.pipeline.startCallProcessing();
          break;
          
        case 'stop':
          await this.pipeline.stopPipeline();
          break;
          
        case 'config':
          // Update configuration if needed
          if (message.config) {
            this.logger.info('Updating configuration');
          }
          break;
          
        case 'status':
          return this.pipeline.getStatus();
          
        default:
          this.logger.warn(`Unknown control message type: ${message.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling control message: ${error.message}`);
      throw error;
    }
  }

  cleanup() {
    this.logger.info(`Cleaning up session ${this.sessionId}`);
    
    if (this.pipeline) {
      this.pipeline.stopPipeline().catch(err => {
        this.logger.error(`Error during cleanup: ${err.message}`);
      });
    }
    
    this.isInitialized = false;
  }

  // Get session statistics
  async getSessionStats() {
    if (!this.pipeline) {
      return { error: 'Pipeline not initialized' };
    }

    const summary = await this.pipeline.getConversationSummary();
    return {
      sessionId: this.sessionId,
      isActive: this.isInitialized,
      ...summary
    };
  }
}

module.exports = VoiceEngine;