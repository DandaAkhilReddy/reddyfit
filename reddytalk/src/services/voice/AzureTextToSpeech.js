// AzureTextToSpeech.js - Azure Cognitive Services Text-to-Speech

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const EventEmitter = require('events');

class AzureTextToSpeech extends EventEmitter {
  constructor(config = {}) {
    super();
    this.subscriptionKey = config.subscriptionKey || process.env.AZURE_SPEECH_KEY;
    this.region = config.region || process.env.AZURE_SPEECH_REGION || 'eastus';
    this.voiceName = config.voiceName || process.env.AZURE_SPEECH_VOICE || 'en-US-JennyNeural';
    this.synthesizer = null;
    this.speechConfig = null;
  }

  async initialize() {
    try {
      if (!this.subscriptionKey) {
        throw new Error('Azure Speech subscription key not provided');
      }

      // Create speech config
      this.speechConfig = sdk.SpeechConfig.fromSubscription(
        this.subscriptionKey,
        this.region
      );

      // Set voice name
      this.speechConfig.speechSynthesisVoiceName = this.voiceName;
      
      // Configure audio format for telephony (8kHz, 16-bit, mono)
      this.speechConfig.speechSynthesisOutputFormat = 
        sdk.SpeechSynthesisOutputFormat.Riff8Khz16BitMonoPcm;

      this.emit('initialized');
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Synthesize text to audio stream
  async synthesizeToStream(text, streamCallback) {
    try {
      if (!this.speechConfig) {
        await this.initialize();
      }

      return new Promise((resolve, reject) => {
        // Create synthesizer with stream output
        const synthesizer = new sdk.SpeechSynthesizer(
          this.speechConfig,
          null // No audio output, we'll handle the stream
        );

        // Synthesis events
        synthesizer.synthesisStarted = (s, e) => {
          this.emit('synthesisStarted', { sessionId: e.sessionId });
        };

        synthesizer.synthesizing = (s, e) => {
          if (e.result.reason === sdk.ResultReason.SynthesizingAudio) {
            const audioData = e.result.audioData;
            if (audioData && audioData.byteLength > 0) {
              // Convert ArrayBuffer to Buffer for Node.js
              const buffer = Buffer.from(audioData);
              streamCallback(buffer);
              this.emit('audioChunk', { size: buffer.length });
            }
          }
        };

        synthesizer.synthesisCompleted = (s, e) => {
          if (e.result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            synthesizer.close();
            this.emit('synthesisCompleted', {
              sessionId: e.sessionId,
              audioDuration: e.result.audioDuration
            });
            resolve({
              success: true,
              audioDuration: e.result.audioDuration
            });
          }
        };

        synthesizer.SynthesisCanceled = (s, e) => {
          synthesizer.close();
          const details = sdk.CancellationDetails.fromResult(e.result);
          const error = new Error(`Synthesis canceled: ${details.reason}`);
          this.emit('error', error);
          reject(error);
        };

        // Start synthesis with SSML for better prosody
        const ssml = this.createSSML(text);
        synthesizer.speakSsmlAsync(ssml);
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Synthesize text to audio buffer
  async synthesizeToBuffer(text) {
    try {
      if (!this.speechConfig) {
        await this.initialize();
      }

      return new Promise((resolve, reject) => {
        const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig);
        const audioChunks = [];

        // Collect audio data
        synthesizer.synthesizing = (s, e) => {
          if (e.result.audioData) {
            audioChunks.push(Buffer.from(e.result.audioData));
          }
        };

        synthesizer.synthesisCompleted = (s, e) => {
          synthesizer.close();
          const audioBuffer = Buffer.concat(audioChunks);
          resolve(audioBuffer);
        };

        synthesizer.SynthesisCanceled = (s, e) => {
          synthesizer.close();
          reject(new Error(`Synthesis canceled: ${e.errorDetails}`));
        };

        // Start synthesis
        const ssml = this.createSSML(text);
        synthesizer.speakSsmlAsync(ssml);
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Create SSML for better voice quality
  createSSML(text) {
    // Clean and prepare text
    const cleanText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Create SSML with prosody adjustments for natural conversation
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${this.voiceName}">
        <prosody rate="1.0" pitch="0Hz" volume="default">
          ${cleanText}
        </prosody>
      </voice>
    </speak>`;
  }

  // Get available voices
  async getAvailableVoices() {
    try {
      if (!this.speechConfig) {
        await this.initialize();
      }

      const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig);
      
      return new Promise((resolve, reject) => {
        synthesizer.getVoicesAsync(
          (result) => {
            synthesizer.close();
            if (result.reason === sdk.ResultReason.VoicesListRetrieved) {
              const voices = result.voices
                .filter(v => v.locale.startsWith('en-'))
                .map(v => ({
                  name: v.shortName,
                  displayName: v.displayName,
                  locale: v.locale,
                  gender: v.gender === sdk.SynthesisVoiceGender.Female ? 'Female' : 'Male',
                  voiceType: v.voiceType
                }));
              resolve(voices);
            } else {
              reject(new Error('Failed to retrieve voices'));
            }
          },
          (error) => {
            synthesizer.close();
            reject(error);
          }
        );
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Set voice by name
  setVoice(voiceName) {
    this.voiceName = voiceName;
    if (this.speechConfig) {
      this.speechConfig.speechSynthesisVoiceName = voiceName;
    }
  }

  // Batch synthesis for longer texts
  async synthesizeLongText(text, onProgress) {
    const maxLength = 500; // Characters per chunk
    const chunks = this.splitTextIntoChunks(text, maxLength);
    const audioBuffers = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const audioBuffer = await this.synthesizeToBuffer(chunk);
      audioBuffers.push(audioBuffer);
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: chunks.length,
          percentage: ((i + 1) / chunks.length) * 100
        });
      }
    }

    return Buffer.concat(audioBuffers);
  }

  // Split text into chunks at sentence boundaries
  splitTextIntoChunks(text, maxLength) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }
}

module.exports = AzureTextToSpeech;