// Training Data Collection and Management Service for ReddyTalk.ai
// Collects, processes, and manages training data for AI model improvement

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const DatabaseService = require('../database/DatabaseService');
const PatientManagementService = require('../patients/PatientManagementService');
const natural = require('natural');

class TrainingDataService {
  constructor() {
    this.db = new DatabaseService();
    this.patientService = new PatientManagementService();
    
    // Data processing configuration
    this.dataStoragePath = process.env.TRAINING_DATA_PATH || './storage/training-data';
    this.enableAutomaticCollection = process.env.AUTO_COLLECT_TRAINING_DATA === 'true';
    this.enablePIIRemoval = true;
    this.minimumConversationTurns = 3;
    this.minimumQualityScore = 0.6;
    
    // PII detection patterns
    this.piiPatterns = {
      phone: /(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      date: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g,
      address: /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|circle|cir|court|ct|place|pl)\b/gi,
      creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
    };
    
    // Medical term extraction
    this.medicalTermExtractor = null;
    this.conversationClassifier = null;
    
    // Training data categories
    this.dataCategories = {
      appointment_scheduling: 'Appointment scheduling conversations',
      symptom_assessment: 'Symptom reporting and assessment',
      insurance_verification: 'Insurance verification and billing',
      general_inquiry: 'General medical inquiries',
      emergency_triage: 'Emergency and urgent care triage',
      medication_questions: 'Medication information requests',
      follow_up: 'Follow-up appointment conversations'
    };
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🎯 Initializing Training Data Service...');
      
      await this.db.initialize();
      await this.patientService.initialize();
      
      // Create storage directory
      await this.ensureStorageDirectory();
      
      // Initialize NLP components
      await this.initializeNLPComponents();
      
      // Load existing training data statistics
      await this.loadTrainingDataStats();
      
      this.isInitialized = true;
      console.log('✅ Training Data Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Training Data Service:', error);
      throw error;
    }
  }

  // =============================================
  // DATA COLLECTION FROM LIVE CALLS
  // =============================================

  /**
   * Collect training data from a completed call
   */
  async collectFromCall(callSessionId, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      console.log(`📊 Collecting training data from call: ${callSessionId}`);
      
      // Get call session details
      const callResult = await this.db.query(`
        SELECT 
          cs.*, 
          p.patient_id,
          p.preferred_language
        FROM call_sessions cs
        LEFT JOIN patients p ON cs.patient_id = p.id
        WHERE cs.id = $1
      `, [callSessionId]);
      
      if (callResult.rows.length === 0) {
        throw new Error('Call session not found');
      }
      
      const callSession = callResult.rows[0];
      
      // Get conversation transcript
      const transcriptResult = await this.db.query(`
        SELECT 
          sequence_number, speaker, text_content, confidence_score,
          start_time_ms, end_time_ms, medical_entities, symptoms_detected,
          urgency_level
        FROM call_transcripts
        WHERE call_session_id = $1
        ORDER BY sequence_number
      `, [callSessionId]);
      
      const transcriptSegments = transcriptResult.rows;
      
      if (transcriptSegments.length < this.minimumConversationTurns) {
        console.log(`⏭️ Skipping call ${callSessionId} - insufficient conversation turns`);
        return { success: false, reason: 'Insufficient conversation turns' };
      }
      
      // Build conversation structure
      const conversation = await this.buildConversationStructure(transcriptSegments, callSession);
      
      // Assess conversation quality
      const qualityAssessment = this.assessConversationQuality(conversation);
      
      if (qualityAssessment.score < this.minimumQualityScore) {
        console.log(`⏭️ Skipping call ${callSessionId} - quality score too low: ${qualityAssessment.score}`);
        return { success: false, reason: 'Quality score too low', score: qualityAssessment.score };
      }
      
      // Remove PII from conversation
      const sanitizedConversation = await this.removePIIFromConversation(conversation);
      
      // Classify conversation type
      const classification = await this.classifyConversation(sanitizedConversation);
      
      // Extract training features
      const trainingFeatures = await this.extractTrainingFeatures(sanitizedConversation);
      
      // Generate conversation ID
      const conversationId = this.generateConversationId(callSessionId);
      
      // Store training conversation
      const trainingConversation = await this.storeTrainingConversation({
        conversationId,
        sourceCallId: callSessionId,
        conversation: sanitizedConversation,
        classification,
        qualityAssessment,
        trainingFeatures,
        metadata: {
          patientLanguage: callSession.preferred_language,
          callDuration: callSession.duration_seconds,
          aiPerformanceScore: callSession.ai_performance_score,
          patientSatisfactionScore: callSession.patient_satisfaction_score
        }
      });
      
      console.log(`✅ Training data collected: ${conversationId}`);
      
      return {
        success: true,
        conversationId,
        qualityScore: qualityAssessment.score,
        classification: classification.category,
        message: 'Training data collected successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to collect training data from call:', error);
      throw error;
    }
  }

  /**
   * Manually add training conversation
   */
  async addManualTrainingData(conversationData, addedByUserId, options = {}) {
    try {
      // Validate conversation structure
      this.validateConversationStructure(conversationData);
      
      // Remove PII
      const sanitizedConversation = await this.removePIIFromConversation(conversationData);
      
      // Assess quality
      const qualityAssessment = this.assessConversationQuality(sanitizedConversation);
      
      // Classify conversation
      const classification = await this.classifyConversation(sanitizedConversation);
      
      // Extract features
      const trainingFeatures = await this.extractTrainingFeatures(sanitizedConversation);
      
      // Generate ID
      const conversationId = this.generateConversationId();
      
      // Store training conversation
      const trainingConversation = await this.storeTrainingConversation({
        conversationId,
        sourceType: 'manual',
        conversation: sanitizedConversation,
        classification,
        qualityAssessment,
        trainingFeatures,
        addedByUserId,
        metadata: options.metadata || {}
      });
      
      return {
        success: true,
        conversationId,
        qualityScore: qualityAssessment.score,
        classification: classification.category,
        message: 'Manual training data added successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to add manual training data:', error);
      throw error;
    }
  }

  // =============================================
  // CONVERSATION PROCESSING
  // =============================================

  async buildConversationStructure(transcriptSegments, callSession) {
    const conversation = {
      id: callSession.id,
      turns: [],
      metadata: {
        duration: callSession.duration_seconds,
        language: 'en-US',
        participants: ['patient', 'ai'],
        aiVersion: callSession.ai_agent_version,
        timestamp: callSession.started_at
      }
    };
    
    // Group segments by speaker into turns
    let currentTurn = null;
    
    for (const segment of transcriptSegments) {
      if (!currentTurn || currentTurn.speaker !== segment.speaker) {
        // Start new turn
        if (currentTurn) {
          conversation.turns.push(currentTurn);
        }
        
        currentTurn = {
          speaker: segment.speaker,
          text: segment.text_content,
          timestamp: segment.start_time_ms,
          confidence: segment.confidence_score,
          medicalEntities: JSON.parse(segment.medical_entities || '[]'),
          symptoms: JSON.parse(segment.symptoms_detected || '[]'),
          urgencyLevel: segment.urgency_level
        };
      } else {
        // Continue current turn
        currentTurn.text += ' ' + segment.text_content;
        currentTurn.confidence = Math.min(currentTurn.confidence, segment.confidence_score);
        
        // Merge medical entities and symptoms
        const newEntities = JSON.parse(segment.medical_entities || '[]');
        const newSymptoms = JSON.parse(segment.symptoms_detected || '[]');
        
        currentTurn.medicalEntities = [...currentTurn.medicalEntities, ...newEntities];
        currentTurn.symptoms = [...currentTurn.symptoms, ...newSymptoms];
        
        // Use highest urgency level
        if (this.getUrgencyPriority(segment.urgency_level) > this.getUrgencyPriority(currentTurn.urgencyLevel)) {
          currentTurn.urgencyLevel = segment.urgency_level;
        }
      }
    }
    
    // Add final turn
    if (currentTurn) {
      conversation.turns.push(currentTurn);
    }
    
    return conversation;
  }

  assessConversationQuality(conversation) {
    let score = 0;
    const factors = [];
    
    // Turn count quality (more turns = better conversation)
    const turnCount = conversation.turns.length;
    if (turnCount >= 6) score += 0.3;
    else if (turnCount >= 4) score += 0.2;
    else if (turnCount >= 2) score += 0.1;
    factors.push(`Turn count: ${turnCount}`);
    
    // Average confidence score
    const avgConfidence = conversation.turns.reduce((sum, turn) => sum + turn.confidence, 0) / turnCount;
    score += avgConfidence * 0.3;
    factors.push(`Avg confidence: ${avgConfidence.toFixed(2)}`);
    
    // Medical content relevance
    const medicalEntityCount = conversation.turns.reduce((sum, turn) => sum + turn.medicalEntities.length, 0);
    if (medicalEntityCount >= 3) score += 0.2;
    else if (medicalEntityCount >= 1) score += 0.1;
    factors.push(`Medical entities: ${medicalEntityCount}`);
    
    // Conversation completeness (both speakers participated)
    const speakers = [...new Set(conversation.turns.map(turn => turn.speaker))];
    if (speakers.length >= 2) score += 0.2;
    factors.push(`Speakers: ${speakers.length}`);
    
    return {
      score: Math.min(score, 1.0),
      factors,
      turnCount,
      avgConfidence,
      medicalEntityCount,
      speakerCount: speakers.length
    };
  }

  async removePIIFromConversation(conversation) {
    const sanitizedConversation = JSON.parse(JSON.stringify(conversation));
    
    for (const turn of sanitizedConversation.turns) {
      turn.text = await this.removePIIFromText(turn.text);
      
      // Remove PII from medical entities
      if (turn.medicalEntities) {
        turn.medicalEntities = turn.medicalEntities.filter(entity => 
          !this.isPIIEntity(entity.text)
        );
      }
    }
    
    return sanitizedConversation;
  }

  async removePIIFromText(text) {
    let sanitizedText = text;
    
    // Replace PII patterns with placeholders
    sanitizedText = sanitizedText.replace(this.piiPatterns.phone, '[PHONE]');
    sanitizedText = sanitizedText.replace(this.piiPatterns.ssn, '[SSN]');
    sanitizedText = sanitizedText.replace(this.piiPatterns.email, '[EMAIL]');
    sanitizedText = sanitizedText.replace(this.piiPatterns.date, '[DATE]');
    sanitizedText = sanitizedText.replace(this.piiPatterns.address, '[ADDRESS]');
    sanitizedText = sanitizedText.replace(this.piiPatterns.creditCard, '[CREDIT_CARD]');
    
    // Replace names with placeholders (simple approach - could be improved)
    sanitizedText = sanitizedText.replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, '[NAME]');
    
    // Replace specific numbers that might be IDs
    sanitizedText = sanitizedText.replace(/\b\d{6,}\b/g, '[ID_NUMBER]');
    
    return sanitizedText;
  }

  async classifyConversation(conversation) {
    const text = conversation.turns.map(turn => turn.text).join(' ').toLowerCase();
    
    // Simple keyword-based classification (could be improved with ML)
    const classifications = {
      appointment_scheduling: ['appointment', 'schedule', 'book', 'available', 'time', 'date'],
      symptom_assessment: ['symptom', 'feel', 'pain', 'hurt', 'sick', 'fever', 'headache'],
      insurance_verification: ['insurance', 'coverage', 'policy', 'copay', 'deductible'],
      general_inquiry: ['question', 'information', 'help', 'wondering', 'curious'],
      emergency_triage: ['emergency', 'urgent', 'critical', 'severe', 'chest pain'],
      medication_questions: ['medication', 'prescription', 'drug', 'pill', 'dosage'],
      follow_up: ['follow up', 'followup', 'check back', 'return', 'next visit']
    };
    
    const scores = {};
    
    for (const [category, keywords] of Object.entries(classifications)) {
      const score = keywords.reduce((sum, keyword) => {
        const count = (text.match(new RegExp(keyword, 'g')) || []).length;
        return sum + count;
      }, 0);
      scores[category] = score;
    }
    
    // Find category with highest score
    const bestCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    
    return {
      category: bestCategory,
      confidence: scores[bestCategory] / Math.max(text.split(' ').length, 1),
      allScores: scores
    };
  }

  async extractTrainingFeatures(conversation) {
    const features = {
      conversationLength: conversation.turns.length,
      averageTurnLength: conversation.turns.reduce((sum, turn) => sum + turn.text.split(' ').length, 0) / conversation.turns.length,
      vocabularySize: [...new Set(conversation.turns.join(' ').toLowerCase().split(' '))].length,
      medicalTermCount: conversation.turns.reduce((sum, turn) => sum + turn.medicalEntities.length, 0),
      symptomCount: conversation.turns.reduce((sum, turn) => sum + turn.symptoms.length, 0),
      urgencyLevels: [...new Set(conversation.turns.map(turn => turn.urgencyLevel))],
      speakerRatio: this.calculateSpeakerRatio(conversation),
      sentimentPattern: this.analyzeSentimentPattern(conversation),
      medicalComplexity: this.assessMedicalComplexity(conversation)
    };
    
    return features;
  }

  // =============================================
  // DATABASE OPERATIONS
  // =============================================

  async storeTrainingConversation(data) {
    try {
      const result = await this.db.query(`
        INSERT INTO training_conversations (
          conversation_id, source_type, source_call_id,
          conversation_data, participant_count, turn_count,
          quality_score, human_reviewed, training_tags,
          medical_specialty, complexity_level, pii_removed, hipaa_compliant
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, conversation_id, created_at
      `, [
        data.conversationId,
        data.sourceType || 'live_call',
        data.sourceCallId || null,
        JSON.stringify(data.conversation),
        data.conversation.metadata?.participants?.length || 2,
        data.conversation.turns.length,
        data.qualityAssessment.score,
        false, // Will be reviewed later
        JSON.stringify([data.classification.category]),
        this.inferMedicalSpecialty(data.conversation),
        this.assessComplexityLevel(data.trainingFeatures),
        true, // PII removed
        true  // HIPAA compliant
      ]);
      
      const storedConversation = result.rows[0];
      
      // Store training features separately for analysis
      await this.storeTrainingFeatures(storedConversation.id, data.trainingFeatures);
      
      // Export to file if needed
      if (this.enableFileExport) {
        await this.exportConversationToFile(data.conversationId, data.conversation);
      }
      
      return storedConversation;
      
    } catch (error) {
      console.error('❌ Failed to store training conversation:', error);
      throw error;
    }
  }

  async storeTrainingFeatures(conversationDbId, features) {
    try {
      // Store features in a separate table for ML analysis
      await this.db.query(`
        INSERT INTO conversation_features (
          conversation_id, feature_data
        ) VALUES ($1, $2)
      `, [conversationDbId, JSON.stringify(features)]);
      
    } catch (error) {
      console.error('❌ Failed to store training features:', error);
    }
  }

  // =============================================
  // DATA EXPORT AND PREPARATION
  // =============================================

  /**
   * Create training dataset from collected conversations
   */
  async createTrainingDataset(name, criteria = {}, createdByUserId) {
    try {
      console.log(`📦 Creating training dataset: ${name}`);
      
      // Build query based on criteria
      let whereClause = 'WHERE tc.use_for_training = true AND tc.hipaa_compliant = true';
      const queryParams = [];
      let paramIndex = 1;
      
      if (criteria.category) {
        whereClause += ` AND tc.training_tags @> $${paramIndex}`;
        queryParams.push(JSON.stringify([criteria.category]));
        paramIndex++;
      }
      
      if (criteria.minQuality) {
        whereClause += ` AND tc.quality_score >= $${paramIndex}`;
        queryParams.push(criteria.minQuality);
        paramIndex++;
      }
      
      if (criteria.dateRange) {
        whereClause += ` AND tc.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        queryParams.push(criteria.dateRange.start, criteria.dateRange.end);
        paramIndex += 2;
      }
      
      if (criteria.medicalSpecialty) {
        whereClause += ` AND tc.medical_specialty = $${paramIndex}`;
        queryParams.push(criteria.medicalSpecialty);
        paramIndex++;
      }
      
      // Query conversations
      const result = await this.db.query(`
        SELECT 
          tc.conversation_id, tc.conversation_data, tc.quality_score,
          tc.training_tags, tc.medical_specialty, tc.complexity_level,
          tc.turn_count
        FROM training_conversations tc
        ${whereClause}
        ORDER BY tc.quality_score DESC, tc.created_at DESC
        LIMIT $${paramIndex}
      `, [...queryParams, criteria.limit || 1000]);
      
      const conversations = result.rows;
      
      if (conversations.length === 0) {
        throw new Error('No conversations found matching criteria');
      }
      
      // Create dataset record
      const datasetResult = await this.db.query(`
        INSERT INTO training_datasets (
          name, description, version, conversation_count, total_turns,
          training_config, model_type, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, name, version, created_at
      `, [
        name,
        criteria.description || `Training dataset created from ${conversations.length} conversations`,
        criteria.version || '1.0',
        conversations.length,
        conversations.reduce((sum, conv) => sum + conv.turn_count, 0),
        JSON.stringify(criteria),
        criteria.modelType || 'conversation',
        'ready',
        createdByUserId
      ]);
      
      const dataset = datasetResult.rows[0];
      
      // Export dataset to file
      const exportPath = await this.exportDatasetToFile(dataset.id, conversations, criteria);
      
      // Update dataset with export path
      await this.db.query(
        'UPDATE training_datasets SET export_path = $1 WHERE id = $2',
        [exportPath, dataset.id]
      );
      
      console.log(`✅ Training dataset created: ${dataset.name} with ${conversations.length} conversations`);
      
      return {
        success: true,
        dataset: {
          id: dataset.id,
          name: dataset.name,
          version: dataset.version,
          conversationCount: conversations.length,
          exportPath
        },
        message: 'Training dataset created successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to create training dataset:', error);
      throw error;
    }
  }

  async exportDatasetToFile(datasetId, conversations, format = 'jsonl') {
    try {
      const filename = `dataset_${datasetId}_${Date.now()}.${format}`;
      const filePath = path.join(this.dataStoragePath, filename);
      
      if (format === 'jsonl') {
        // Export as JSON Lines format
        const jsonlData = conversations.map(conv => 
          JSON.stringify({
            conversation_id: conv.conversation_id,
            data: JSON.parse(conv.conversation_data),
            quality_score: conv.quality_score,
            tags: JSON.parse(conv.training_tags || '[]'),
            specialty: conv.medical_specialty,
            complexity: conv.complexity_level
          })
        ).join('\n');
        
        await fs.writeFile(filePath, jsonlData, 'utf8');
        
      } else if (format === 'csv') {
        // Export as CSV (simplified)
        const csvData = [
          'conversation_id,turn_count,quality_score,specialty,complexity,text',
          ...conversations.map(conv => {
            const data = JSON.parse(conv.conversation_data);
            const text = data.turns.map(turn => turn.text).join(' | ');
            return `"${conv.conversation_id}",${conv.turn_count},${conv.quality_score},"${conv.medical_specialty}","${conv.complexity_level}","${text.replace(/"/g, '""')}"`;
          })
        ].join('\n');
        
        await fs.writeFile(filePath, csvData, 'utf8');
      }
      
      console.log(`📁 Dataset exported to: ${filePath}`);
      return filePath;
      
    } catch (error) {
      console.error('❌ Failed to export dataset:', error);
      throw error;
    }
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  async initializeNLPComponents() {
    // Initialize stemmer for text processing
    this.stemmer = natural.PorterStemmer;
    
    // Initialize tokenizer
    this.tokenizer = new natural.WordTokenizer();
    
    console.log('🧠 NLP components initialized');
  }

  async ensureStorageDirectory() {
    try {
      await fs.access(this.dataStoragePath);
    } catch (error) {
      await fs.mkdir(this.dataStoragePath, { recursive: true });
      console.log(`📁 Created training data directory: ${this.dataStoragePath}`);
    }
  }

  async loadTrainingDataStats() {
    try {
      const result = await this.db.query(`
        SELECT 
          COUNT(*) as total_conversations,
          AVG(quality_score) as avg_quality,
          COUNT(DISTINCT medical_specialty) as specialties,
          SUM(turn_count) as total_turns
        FROM training_conversations
        WHERE use_for_training = true
      `);
      
      const stats = result.rows[0];
      console.log(`📊 Training data stats: ${stats.total_conversations} conversations, ${stats.total_turns} turns, avg quality: ${parseFloat(stats.avg_quality || 0).toFixed(2)}`);
      
    } catch (error) {
      console.warn('⚠️ Failed to load training data stats:', error.message);
    }
  }

  generateConversationId(callSessionId = null) {
    const prefix = 'CONV';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    
    return `${prefix}_${timestamp}_${random}`;
  }

  validateConversationStructure(conversation) {
    if (!conversation.turns || !Array.isArray(conversation.turns)) {
      throw new Error('Conversation must have turns array');
    }
    
    if (conversation.turns.length < 2) {
      throw new Error('Conversation must have at least 2 turns');
    }
    
    for (const turn of conversation.turns) {
      if (!turn.speaker || !turn.text) {
        throw new Error('Each turn must have speaker and text');
      }
    }
  }

  getUrgencyPriority(level) {
    const priorities = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return priorities[level] || 0;
  }

  isPIIEntity(text) {
    // Check if entity text might contain PII
    return /\b\d{3}-\d{2}-\d{4}\b|\b\d{3}-\d{3}-\d{4}\b|@|\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(text);
  }

  calculateSpeakerRatio(conversation) {
    const speakerCounts = {};
    
    for (const turn of conversation.turns) {
      speakerCounts[turn.speaker] = (speakerCounts[turn.speaker] || 0) + 1;
    }
    
    const totalTurns = conversation.turns.length;
    const ratios = {};
    
    for (const [speaker, count] of Object.entries(speakerCounts)) {
      ratios[speaker] = count / totalTurns;
    }
    
    return ratios;
  }

  analyzeSentimentPattern(conversation) {
    // Simple sentiment analysis per turn
    const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    
    const sentiments = conversation.turns.map(turn => {
      const tokens = this.tokenizer.tokenize(turn.text.toLowerCase());
      const score = analyzer.getSentiment(tokens);
      
      if (score > 0.1) return 'positive';
      if (score < -0.1) return 'negative';
      return 'neutral';
    });
    
    return sentiments;
  }

  assessMedicalComplexity(conversation) {
    let complexityScore = 0;
    
    // Count medical entities
    const medicalEntityCount = conversation.turns.reduce((sum, turn) => sum + turn.medicalEntities.length, 0);
    if (medicalEntityCount >= 10) complexityScore += 3;
    else if (medicalEntityCount >= 5) complexityScore += 2;
    else if (medicalEntityCount >= 1) complexityScore += 1;
    
    // Count symptoms
    const symptomCount = conversation.turns.reduce((sum, turn) => sum + turn.symptoms.length, 0);
    if (symptomCount >= 5) complexityScore += 2;
    else if (symptomCount >= 2) complexityScore += 1;
    
    // Check urgency levels
    const hasHighUrgency = conversation.turns.some(turn => ['high', 'critical'].includes(turn.urgencyLevel));
    if (hasHighUrgency) complexityScore += 2;
    
    return Math.min(complexityScore, 10);
  }

  inferMedicalSpecialty(conversation) {
    const text = conversation.turns.map(turn => turn.text).join(' ').toLowerCase();
    
    const specialtyKeywords = {
      cardiology: ['heart', 'cardiac', 'chest pain', 'blood pressure', 'cholesterol'],
      dermatology: ['skin', 'rash', 'acne', 'mole', 'dermatitis'],
      neurology: ['headache', 'migraine', 'seizure', 'neurological', 'brain'],
      orthopedics: ['bone', 'joint', 'fracture', 'sprain', 'arthritis'],
      psychiatry: ['depression', 'anxiety', 'mental health', 'psychiatric'],
      pediatrics: ['child', 'children', 'infant', 'pediatric'],
      general: ['general', 'primary care', 'checkup', 'physical']
    };
    
    let maxScore = 0;
    let specialty = 'general';
    
    for (const [spec, keywords] of Object.entries(specialtyKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (text.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        specialty = spec;
      }
    }
    
    return specialty;
  }

  assessComplexityLevel(features) {
    const score = features.medicalComplexity;
    
    if (score >= 7) return 'advanced';
    if (score >= 4) return 'intermediate';
    return 'basic';
  }

  // Health check
  async healthCheck() {
    return {
      service: 'TrainingDataService',
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      autoCollection: this.enableAutomaticCollection,
      piiRemoval: this.enablePIIRemoval,
      dataPath: this.dataStoragePath,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = TrainingDataService;