// Live Transcript Service for ReddyTalk.ai
// Real-time speech-to-text transcription with medical NLP analysis

const { SpeechClient } = require('@google-cloud/speech');
const { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } = require('microsoft-cognitiveservices-speech-sdk');
const DatabaseService = require('../database/DatabaseService');
const WebSocketService = require('../realtime/WebSocketService');
const MedicalKnowledgeBase = require('../ai/MedicalKnowledgeBase');
const natural = require('natural');

class LiveTranscriptService {
  constructor() {
    this.db = new DatabaseService();
    this.wsService = new WebSocketService();
    this.medicalKB = new MedicalKnowledgeBase();
    
    // Service configuration
    this.primaryProvider = process.env.SPEECH_PROVIDER || 'azure'; // 'azure' or 'google'
    this.enableMedicalNLP = true;
    this.confidenceThreshold = 0.7;
    
    // Azure Speech Service
    this.azureSpeechConfig = SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    this.azureSpeechConfig.speechRecognitionLanguage = 'en-US';
    this.azureSpeechConfig.enableDictation();
    
    // Google Cloud Speech
    this.googleSpeechClient = process.env.GOOGLE_APPLICATION_CREDENTIALS ? 
      new SpeechClient() : null;
    
    // Active transcription sessions
    this.activeSessions = new Map();
    
    // Medical terminology and entity extraction
    this.medicalTerms = new Set();
    this.symptomKeywords = new Set();
    this.urgencyIndicators = new Set();
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🎯 Initializing Live Transcript Service...');
      
      await this.db.initialize();
      await this.medicalKB.initialize();
      
      // Load medical terminology
      await this.loadMedicalVocabulary();
      
      // Configure speech recognition settings
      this.configureSpeechRecognition();
      
      this.isInitialized = true;
      console.log('✅ Live Transcript Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Live Transcript Service:', error);
      throw error;
    }
  }

  // =============================================
  // TRANSCRIPTION SESSION MANAGEMENT
  // =============================================

  /**
   * Start live transcription for a call
   */
  async startTranscription(callSessionId, audioStream, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      console.log(`🎯 Starting transcription for call: ${callSessionId}`);
      
      // Create transcription session
      const session = {
        callSessionId,
        startTime: new Date(),
        isActive: true,
        language: options.language || 'en-US',
        speakers: new Map(), // Speaker identification
        sequenceNumber: 0,
        totalSegments: 0,
        recognizer: null,
        audioStream
      };
      
      // Initialize speech recognizer
      session.recognizer = await this.createSpeechRecognizer(session, audioStream);
      
      // Store active session
      this.activeSessions.set(callSessionId, session);
      
      // Start recognition
      await this.startRecognition(session);
      
      // Notify clients
      this.wsService.broadcast('transcription-started', {
        callSessionId,
        status: 'active',
        language: session.language
      });
      
      return {
        success: true,
        sessionId: callSessionId,
        message: 'Live transcription started'
      };
      
    } catch (error) {
      console.error('❌ Failed to start transcription:', error);
      throw error;
    }
  }

  /**
   * Stop live transcription
   */
  async stopTranscription(callSessionId) {
    try {
      const session = this.activeSessions.get(callSessionId);
      
      if (!session) {
        throw new Error('No active transcription session found');
      }
      
      console.log(`⏹️ Stopping transcription for call: ${callSessionId}`);
      
      // Stop recognition
      if (session.recognizer) {
        await session.recognizer.close();
      }
      
      session.isActive = false;
      session.endTime = new Date();
      
      // Generate final transcript summary
      const summary = await this.generateTranscriptSummary(callSessionId);
      
      // Update call session
      await this.updateCallTranscriptStatus(callSessionId, 'completed', {
        total_segments: session.totalSegments,
        transcript_summary: summary
      });
      
      // Remove from active sessions
      this.activeSessions.delete(callSessionId);
      
      // Notify clients
      this.wsService.broadcast('transcription-completed', {
        callSessionId,
        status: 'completed',
        totalSegments: session.totalSegments,
        summary
      });
      
      return {
        success: true,
        summary,
        totalSegments: session.totalSegments,
        message: 'Transcription completed'
      };
      
    } catch (error) {
      console.error('❌ Failed to stop transcription:', error);
      throw error;
    }
  }

  // =============================================
  // SPEECH RECOGNITION
  // =============================================

  async createSpeechRecognizer(session, audioStream) {
    if (this.primaryProvider === 'azure') {
      return this.createAzureRecognizer(session, audioStream);
    } else if (this.primaryProvider === 'google' && this.googleSpeechClient) {
      return this.createGoogleRecognizer(session, audioStream);
    } else {
      throw new Error(`Unsupported speech provider: ${this.primaryProvider}`);
    }
  }

  async createAzureRecognizer(session, audioStream) {
    try {
      // Configure audio input
      const audioConfig = AudioConfig.fromStreamInput(audioStream);
      
      // Create recognizer
      const recognizer = new SpeechRecognizer(this.azureSpeechConfig, audioConfig);
      
      // Handle recognition events
      recognizer.recognizing = (s, e) => {
        this.handlePartialResult(session, e.result.text, e.result.reason);
      };
      
      recognizer.recognized = (s, e) => {
        if (e.result.reason === ResultReason.RecognizedSpeech) {
          this.handleFinalResult(session, e.result.text, e.result.confidence);
        }
      };
      
      recognizer.canceled = (s, e) => {
        console.error('Azure Speech recognition canceled:', e.errorDetails);
        this.handleRecognitionError(session, e.errorDetails);
      };
      
      recognizer.sessionStopped = (s, e) => {
        console.log('Azure Speech session stopped');
      };
      
      return recognizer;
      
    } catch (error) {
      console.error('❌ Failed to create Azure recognizer:', error);
      throw error;
    }
  }

  async createGoogleRecognizer(session, audioStream) {
    try {
      const request = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: session.language,
          enableSeparateRecognitionPerChannel: true,
          enableSpeakerDiarization: true,
          diarizationSpeakerCount: 2,
          model: 'medical_conversation',
          useEnhanced: true,
          enableWordTimeOffsets: true,
          enableWordConfidence: true,
        },
        interimResults: true,
      };
      
      const recognizeStream = this.googleSpeechClient
        .streamingRecognize(request)
        .on('data', (response) => {
          if (response.results[0] && response.results[0].alternatives[0]) {
            const transcript = response.results[0].alternatives[0].transcript;
            const confidence = response.results[0].alternatives[0].confidence;
            const isFinal = response.results[0].isFinal;
            
            if (isFinal) {
              this.handleFinalResult(session, transcript, confidence);
            } else {
              this.handlePartialResult(session, transcript, 'partial');
            }
          }
        })
        .on('error', (error) => {
          console.error('Google Speech recognition error:', error);
          this.handleRecognitionError(session, error.message);
        })
        .on('end', () => {
          console.log('Google Speech recognition stream ended');
        });
      
      // Pipe audio stream to Google
      audioStream.pipe(recognizeStream);
      
      return {
        close: () => recognizeStream.end(),
        stream: recognizeStream
      };
      
    } catch (error) {
      console.error('❌ Failed to create Google recognizer:', error);
      throw error;
    }
  }

  async startRecognition(session) {
    try {
      if (this.primaryProvider === 'azure' && session.recognizer.startContinuousRecognitionAsync) {
        session.recognizer.startContinuousRecognitionAsync();
      }
      // Google recognition starts automatically when audio is piped
      
    } catch (error) {
      console.error('❌ Failed to start recognition:', error);
      throw error;
    }
  }

  // =============================================
  // RESULT PROCESSING
  // =============================================

  async handlePartialResult(session, text, reason) {
    if (!text || text.length < 3) return;
    
    // Broadcast partial transcript to clients
    this.wsService.broadcast('transcript-partial', {
      callSessionId: session.callSessionId,
      text,
      timestamp: Date.now(),
      type: 'partial'
    });
  }

  async handleFinalResult(session, text, confidence) {
    try {
      if (!text || text.length < 3 || confidence < this.confidenceThreshold) {
        return;
      }
      
      const timestamp = Date.now();
      const segmentStartTime = timestamp - session.startTime.getTime();
      
      session.sequenceNumber++;
      session.totalSegments++;
      
      // Determine speaker (simplified - could use more sophisticated speaker diarization)
      const speaker = this.identifySpeaker(text, session);
      
      // Perform medical NLP analysis
      const medicalAnalysis = await this.performMedicalNLP(text);
      
      // Store transcript segment in database
      const transcriptSegment = await this.storeTranscriptSegment({
        callSessionId: session.callSessionId,
        sequenceNumber: session.sequenceNumber,
        speaker,
        text,
        confidence,
        startTime: segmentStartTime,
        endTime: segmentStartTime + 3000, // Estimated 3 seconds
        medicalAnalysis
      });
      
      // Broadcast final transcript to clients
      this.wsService.broadcast('transcript-final', {
        callSessionId: session.callSessionId,
        segment: transcriptSegment,
        medicalAnalysis,
        timestamp,
        type: 'final'
      });
      
      // Check for urgency indicators
      if (medicalAnalysis.urgencyLevel === 'high' || medicalAnalysis.urgencyLevel === 'critical') {
        this.handleUrgentContent(session, transcriptSegment, medicalAnalysis);
      }
      
    } catch (error) {
      console.error('❌ Failed to handle final result:', error);
    }
  }

  async handleRecognitionError(session, errorMessage) {
    console.error(`Speech recognition error for call ${session.callSessionId}:`, errorMessage);
    
    // Notify clients of error
    this.wsService.broadcast('transcription-error', {
      callSessionId: session.callSessionId,
      error: errorMessage,
      timestamp: Date.now()
    });
    
    // Attempt to restart recognition if needed
    setTimeout(() => {
      if (session.isActive) {
        console.log('Attempting to restart speech recognition...');
        this.restartRecognition(session);
      }
    }, 5000);
  }

  // =============================================
  // MEDICAL NLP ANALYSIS
  // =============================================

  async performMedicalNLP(text) {
    try {
      const analysis = {
        medicalEntities: [],
        symptoms: [],
        urgencyLevel: 'low',
        sentiment: 'neutral',
        keywords: [],
        conditions: [],
        medications: []
      };
      
      // Tokenize text
      const tokens = natural.WordTokenizer().tokenize(text.toLowerCase());
      
      // Extract medical entities
      analysis.medicalEntities = this.extractMedicalEntities(tokens);
      
      // Identify symptoms
      analysis.symptoms = this.identifySymptoms(tokens);
      
      // Assess urgency
      analysis.urgencyLevel = this.assessUrgency(tokens, text);
      
      // Sentiment analysis
      analysis.sentiment = this.analyzeSentiment(text);
      
      // Extract medical conditions
      analysis.conditions = this.identifyMedicalConditions(tokens);
      
      // Extract medications
      analysis.medications = this.identifyMedications(tokens);
      
      // Extract keywords
      analysis.keywords = this.extractKeywords(tokens);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Medical NLP analysis failed:', error);
      return {
        medicalEntities: [],
        symptoms: [],
        urgencyLevel: 'unknown',
        sentiment: 'neutral',
        keywords: [],
        error: error.message
      };
    }
  }

  extractMedicalEntities(tokens) {
    const entities = [];
    
    for (const token of tokens) {
      if (this.medicalTerms.has(token)) {
        entities.push({
          text: token,
          type: 'medical_term',
          confidence: 0.9
        });
      }
    }
    
    return entities;
  }

  identifySymptoms(tokens) {
    const symptoms = [];
    
    for (const token of tokens) {
      if (this.symptomKeywords.has(token)) {
        symptoms.push({
          symptom: token,
          severity: this.assessSymptomSeverity(token),
          confidence: 0.8
        });
      }
    }
    
    return symptoms;
  }

  assessUrgency(tokens, fullText) {
    let urgencyScore = 0;
    
    // Check for emergency keywords
    const emergencyWords = ['emergency', 'urgent', 'critical', 'severe', 'chest pain', 'difficulty breathing', 'bleeding'];
    for (const word of emergencyWords) {
      if (fullText.toLowerCase().includes(word)) {
        urgencyScore += 3;
      }
    }
    
    // Check for urgency indicators
    for (const token of tokens) {
      if (this.urgencyIndicators.has(token)) {
        urgencyScore += 2;
      }
    }
    
    // Return urgency level
    if (urgencyScore >= 6) return 'critical';
    if (urgencyScore >= 4) return 'high';
    if (urgencyScore >= 2) return 'medium';
    return 'low';
  }

  analyzeSentiment(text) {
    // Simple sentiment analysis
    const analyzer = new natural.SentimentAnalyzer('English',
      natural.PorterStemmer, 'afinn');
    
    const tokens = natural.WordTokenizer().tokenize(text);
    const score = analyzer.getSentiment(tokens);
    
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  identifyMedicalConditions(tokens) {
    const conditions = [];
    const conditionKeywords = ['diabetes', 'hypertension', 'asthma', 'pneumonia', 'flu', 'covid'];
    
    for (const token of tokens) {
      if (conditionKeywords.includes(token)) {
        conditions.push({
          condition: token,
          confidence: 0.8
        });
      }
    }
    
    return conditions;
  }

  identifyMedications(tokens) {
    const medications = [];
    const medicationKeywords = ['aspirin', 'ibuprofen', 'acetaminophen', 'prescription', 'medication'];
    
    for (const token of tokens) {
      if (medicationKeywords.includes(token)) {
        medications.push({
          medication: token,
          confidence: 0.7
        });
      }
    }
    
    return medications;
  }

  // =============================================
  // DATABASE OPERATIONS
  // =============================================

  async storeTranscriptSegment(data) {
    try {
      const result = await this.db.query(`
        INSERT INTO call_transcripts (
          call_session_id, sequence_number, speaker, text_content,
          confidence_score, start_time_ms, end_time_ms, language,
          is_final, medical_entities, symptoms_detected, urgency_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        data.callSessionId,
        data.sequenceNumber,
        data.speaker,
        data.text,
        data.confidence,
        data.startTime,
        data.endTime,
        'en-US',
        true,
        JSON.stringify(data.medicalAnalysis.medicalEntities),
        JSON.stringify(data.medicalAnalysis.symptoms),
        data.medicalAnalysis.urgencyLevel
      ]);
      
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to store transcript segment:', error);
      throw error;
    }
  }

  async updateCallTranscriptStatus(callSessionId, status, data = {}) {
    try {
      const updateFields = {
        transcript_status: status,
        ...data,
        updated_at: new Date()
      };
      
      const setClause = Object.keys(updateFields)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [callSessionId, ...Object.values(updateFields)];
      
      await this.db.query(`
        UPDATE call_sessions 
        SET ${setClause}
        WHERE id = $1
      `, values);
      
    } catch (error) {
      console.error('❌ Failed to update transcript status:', error);
    }
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  async loadMedicalVocabulary() {
    // Load medical terms, symptoms, and urgency indicators
    const medicalTermsData = await this.medicalKB.getMedicalTerminology();
    
    this.medicalTerms = new Set(medicalTermsData.terms || []);
    this.symptomKeywords = new Set(medicalTermsData.symptoms || []);
    this.urgencyIndicators = new Set(medicalTermsData.urgencyWords || []);
    
    console.log(`📚 Loaded ${this.medicalTerms.size} medical terms`);
  }

  configureSpeechRecognition() {
    if (this.azureSpeechConfig) {
      this.azureSpeechConfig.setProfanity(1); // Remove profanity
      this.azureSpeechConfig.setProperty('ConversationTranscriptionInRoomAndOnline', 'true');
    }
  }

  identifySpeaker(text, session) {
    // Simplified speaker identification
    // In production, use proper speaker diarization
    const indicators = {
      patient: ['i feel', 'my', 'i have', 'i am', 'i\'m'],
      ai: ['i can help', 'let me', 'i understand', 'how can i']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [speaker, phrases] of Object.entries(indicators)) {
      for (const phrase of phrases) {
        if (lowerText.includes(phrase)) {
          return speaker;
        }
      }
    }
    
    return 'unknown';
  }

  assessSymptomSeverity(symptom) {
    const severityMap = {
      'severe': 'high',
      'mild': 'low',
      'moderate': 'medium',
      'intense': 'high',
      'slight': 'low'
    };
    
    return severityMap[symptom] || 'medium';
  }

  extractKeywords(tokens) {
    return tokens
      .filter(token => token.length > 3)
      .filter(token => !natural.stopwords.includes(token))
      .slice(0, 10);
  }

  async generateTranscriptSummary(callSessionId) {
    try {
      const result = await this.db.query(`
        SELECT text_content, medical_entities, symptoms_detected, urgency_level
        FROM call_transcripts
        WHERE call_session_id = $1
        ORDER BY sequence_number
      `, [callSessionId]);
      
      const segments = result.rows;
      const fullText = segments.map(s => s.text_content).join(' ');
      
      // Extract key information
      const allSymptoms = segments.flatMap(s => JSON.parse(s.symptoms_detected || '[]'));
      const allEntities = segments.flatMap(s => JSON.parse(s.medical_entities || '[]'));
      const maxUrgency = this.getHighestUrgency(segments.map(s => s.urgency_level));
      
      return {
        wordCount: fullText.split(' ').length,
        symptoms: [...new Set(allSymptoms.map(s => s.symptom))],
        medicalTerms: [...new Set(allEntities.map(e => e.text))],
        urgencyLevel: maxUrgency,
        keyTopics: this.extractKeyTopics(fullText),
        duration: segments.length * 3 // Estimated 3 seconds per segment
      };
      
    } catch (error) {
      console.error('❌ Failed to generate transcript summary:', error);
      return {
        error: 'Failed to generate summary'
      };
    }
  }

  getHighestUrgency(urgencyLevels) {
    const priority = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return urgencyLevels.reduce((highest, current) => 
      priority[current] > priority[highest] ? current : highest, 'low');
  }

  extractKeyTopics(text) {
    // Simple topic extraction
    const words = natural.WordTokenizer().tokenize(text.toLowerCase());
    const filteredWords = words
      .filter(word => !natural.stopwords.includes(word))
      .filter(word => word.length > 3);
    
    const frequency = {};
    filteredWords.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  async handleUrgentContent(session, segment, analysis) {
    // Notify medical staff of urgent content
    this.wsService.broadcast('urgent-content-detected', {
      callSessionId: session.callSessionId,
      urgencyLevel: analysis.urgencyLevel,
      symptoms: analysis.symptoms,
      text: segment.text_content,
      timestamp: new Date()
    });
    
    console.log(`🚨 Urgent content detected in call ${session.callSessionId}: ${analysis.urgencyLevel}`);
  }

  async restartRecognition(session) {
    try {
      if (session.recognizer) {
        await session.recognizer.close();
      }
      
      session.recognizer = await this.createSpeechRecognizer(session, session.audioStream);
      await this.startRecognition(session);
      
      console.log(`♻️ Recognition restarted for call ${session.callSessionId}`);
      
    } catch (error) {
      console.error('❌ Failed to restart recognition:', error);
    }
  }

  // Health check
  async healthCheck() {
    return {
      service: 'LiveTranscriptService',
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      provider: this.primaryProvider,
      activeSessions: this.activeSessions.size,
      medicalTermsLoaded: this.medicalTerms.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = LiveTranscriptService;