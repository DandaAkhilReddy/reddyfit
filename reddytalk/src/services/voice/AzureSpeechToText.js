// AzureSpeechToText.js - Azure Cognitive Services Speech-to-Text

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const EventEmitter = require('events');

class AzureSpeechToText extends EventEmitter {
  constructor(config = {}) {
    super();
    this.subscriptionKey = config.subscriptionKey || process.env.AZURE_SPEECH_KEY;
    this.region = config.region || process.env.AZURE_SPEECH_REGION || 'eastus';
    this.recognizer = null;
    this.pushStream = null;
    this.isListening = false;
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

      // Configure for medical conversations
      this.speechConfig.speechRecognitionLanguage = 'en-US';
      this.speechConfig.outputFormat = sdk.OutputFormat.Detailed;
      
      // Enable continuous recognition
      this.speechConfig.setProperty(
        sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        '5000'
      );
      this.speechConfig.setProperty(
        sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
        '1000'
      );

      this.emit('initialized');
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async startContinuousRecognition() {
    try {
      if (!this.speechConfig) {
        await this.initialize();
      }

      // Create push stream for real-time audio
      this.pushStream = sdk.AudioInputStream.createPushStream(
        sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
      );

      // Create audio config from push stream
      const audioConfig = sdk.AudioConfig.fromStreamInput(this.pushStream);

      // Create recognizer
      this.recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);

      // Configure events
      this.recognizer.recognizing = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
          this.emit('recognizing', {
            text: e.result.text,
            offset: e.result.offset,
            duration: e.result.duration
          });
        }
      };

      this.recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          this.emit('recognized', {
            text: e.result.text,
            confidence: e.result.json ? JSON.parse(e.result.json).NBest[0].Confidence : 0,
            offset: e.result.offset,
            duration: e.result.duration,
            timestamp: new Date().toISOString()
          });
        } else if (e.result.reason === sdk.ResultReason.NoMatch) {
          this.emit('nomatch', 'No speech could be recognized');
        }
      };

      this.recognizer.sessionStarted = (s, e) => {
        this.isListening = true;
        this.emit('sessionStarted', e.sessionId);
        console.log('Azure STT session started:', e.sessionId);
      };

      this.recognizer.sessionStopped = (s, e) => {
        this.isListening = false;
        this.emit('sessionStopped', e.sessionId);
        console.log('Azure STT session stopped:', e.sessionId);
      };

      this.recognizer.canceled = (s, e) => {
        this.isListening = false;
        console.error('Azure STT canceled:', e.errorDetails);
        this.emit('error', new Error(e.errorDetails));
      };

      // Start continuous recognition
      await new Promise((resolve, reject) => {
        this.recognizer.startContinuousRecognitionAsync(
          () => resolve(),
          (error) => reject(error)
        );
      });

      this.emit('started');
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Send audio data to Azure
  sendAudio(audioBuffer) {
    if (this.pushStream && this.isListening) {
      this.pushStream.write(audioBuffer);
    } else {
      console.warn('Cannot send audio: Azure STT not listening');
    }
  }

  // Stop recognition
  async stop() {
    if (this.recognizer && this.isListening) {
      await new Promise((resolve, reject) => {
        this.recognizer.stopContinuousRecognitionAsync(
          () => {
            this.pushStream.close();
            this.isListening = false;
            resolve();
          },
          (error) => reject(error)
        );
      });
    }
  }

  // Recognize once from audio buffer
  async recognizeOnce(audioBuffer) {
    try {
      if (!this.speechConfig) {
        await this.initialize();
      }

      // Create push stream and write audio
      const pushStream = sdk.AudioInputStream.createPushStream();
      pushStream.write(audioBuffer);
      pushStream.close();

      // Create audio config
      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
      
      // Create recognizer
      const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);

      // Recognize once
      return new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            recognizer.close();
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              resolve({
                text: result.text,
                confidence: result.json ? JSON.parse(result.json).NBest[0].Confidence : 0,
                duration: result.duration
              });
            } else {
              reject(new Error('No speech recognized'));
            }
          },
          (error) => {
            recognizer.close();
            reject(error);
          }
        );
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Get detailed results with medical terminology support
  enableMedicalDictation() {
    if (this.speechConfig) {
      // Enable medical dictation mode
      this.speechConfig.setServiceProperty(
        'transcription',
        'medical',
        sdk.ServicePropertyChannel.HttpHeader
      );
      
      // Add medical vocabulary
      const medicalPhrases = [
        'patient', 'appointment', 'prescription', 'diagnosis',
        'symptoms', 'medication', 'allergy', 'insurance',
        'referral', 'specialist', 'emergency', 'urgent care'
      ];
      
      const phraseList = sdk.PhraseListGrammar.fromRecognizer(this.recognizer);
      medicalPhrases.forEach(phrase => phraseList.addPhrase(phrase));
    }
  }
}

module.exports = AzureSpeechToText;