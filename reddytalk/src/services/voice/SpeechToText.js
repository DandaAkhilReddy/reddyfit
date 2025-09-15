// SpeechToText.js - Handles voice to text conversion using Deepgram

const { Deepgram } = require('@deepgram/sdk');
const EventEmitter = require('events');

class SpeechToText extends EventEmitter {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.DEEPGRAM_API_KEY;
    this.model = config.model || process.env.DEEPGRAM_MODEL || 'nova-2-medical';
    this.deepgram = null;
    this.liveTranscription = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('Deepgram API key not provided');
      }

      // Initialize Deepgram client
      this.deepgram = new Deepgram(this.apiKey);
      this.emit('initialized');
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async startLiveTranscription(options = {}) {
    try {
      if (!this.deepgram) {
        await this.initialize();
      }

      // Configure live transcription options
      const transcriptionOptions = {
        model: this.model,
        punctuate: true,
        interim_results: true,
        endpointing: 300,
        vad_turnoff: 300,
        language: options.language || 'en-US',
        encoding: options.encoding || 'linear16',
        sample_rate: options.sampleRate || 16000,
        channels: options.channels || 1
      };

      // Start live transcription
      this.liveTranscription = await this.deepgram.transcription.live(transcriptionOptions);
      
      // Handle transcription events
      this.liveTranscription.on('open', () => {
        this.isConnected = true;
        this.emit('connected');
        console.log('Deepgram STT connection opened');
      });

      this.liveTranscription.on('transcript', (data) => {
        const transcript = data.channel.alternatives[0].transcript;
        
        if (transcript && transcript.trim().length > 0) {
          this.emit('transcript', {
            text: transcript,
            is_final: data.is_final,
            confidence: data.channel.alternatives[0].confidence,
            timestamp: new Date().toISOString()
          });
        }
      });

      this.liveTranscription.on('error', (error) => {
        console.error('Deepgram STT error:', error);
        this.emit('error', error);
      });

      this.liveTranscription.on('close', () => {
        this.isConnected = false;
        this.emit('disconnected');
        console.log('Deepgram STT connection closed');
      });

      return this.liveTranscription;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Send audio data to Deepgram
  sendAudio(audioBuffer) {
    if (this.liveTranscription && this.isConnected) {
      this.liveTranscription.send(audioBuffer);
    } else {
      console.warn('Cannot send audio: STT not connected');
    }
  }

  // Stop transcription
  stop() {
    if (this.liveTranscription) {
      this.liveTranscription.finish();
      this.liveTranscription = null;
      this.isConnected = false;
    }
  }

  // Alternative: Transcribe audio file
  async transcribeFile(audioFilePath, options = {}) {
    try {
      if (!this.deepgram) {
        await this.initialize();
      }

      const transcriptionOptions = {
        model: this.model,
        punctuate: true,
        language: options.language || 'en-US',
        ...options
      };

      const result = await this.deepgram.transcription.transcribeFile(
        audioFilePath,
        transcriptionOptions
      );

      return result.results.channels[0].alternatives[0];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Alternative: Transcribe from URL
  async transcribeUrl(audioUrl, options = {}) {
    try {
      if (!this.deepgram) {
        await this.initialize();
      }

      const transcriptionOptions = {
        model: this.model,
        punctuate: true,
        language: options.language || 'en-US',
        ...options
      };

      const result = await this.deepgram.transcription.transcribeUrl(
        { url: audioUrl },
        transcriptionOptions
      );

      return result.results.channels[0].alternatives[0];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

module.exports = SpeechToText;