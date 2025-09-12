// ConversationManager.js - Enterprise Conversation Management System
// Principal AI Architect implementation with advanced NLP and conversation analytics

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const AzureOpenAI = require('../ai/AzureOpenAI');
const AzureSpeechToText = require('../voice/AzureSpeechToText');
const AzureTextToSpeech = require('../voice/AzureTextToSpeech');

class ConversationManager extends EventEmitter {
  constructor(databaseService, webSocketService, options = {}) {
    super();
    this.db = databaseService;
    this.ws = webSocketService;
    this.ai = new AzureOpenAI();
    this.stt = new AzureSpeechToText();
    this.tts = new AzureTextToSpeech();
    
    this.options = {
      maxConcurrentConversations: options.maxConcurrent || 50,
      conversationTimeout: options.timeout || 1800000, // 30 minutes
      autoSaveInterval: options.autoSave || 30000, // 30 seconds
      enableSentimentAnalysis: options.sentiment !== false,
      enableEmotionDetection: options.emotion !== false,
      ...options
    };
    
    // Active conversations in memory for real-time processing
    this.activeConversations = new Map();
    this.conversationMetrics = new Map();
    this.isInitialized = false;
    
    // Analytics tracking
    this.analytics = {
      totalConversations: 0,
      successfulConversations: 0,
      averageCallDuration: 0,
      appointmentsScheduled: 0,
      emergencyCalls: 0,
      customerSatisfactionAvg: 0
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Enterprise Conversation Manager...');
      
      // Initialize AI services
      await this.ai.initialize();
      await this.stt.initialize();
      await this.tts.initialize();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Start background processes
      this.startAutoSaveProcess();
      this.startConversationCleanup();
      this.startAnalyticsCollection();
      
      this.isInitialized = true;
      console.log('✅ Conversation Manager initialized successfully');
      this.emit('initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Conversation Manager initialization failed:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    // AI service events
    this.ai.on('response', (data) => {
      this.handleAIResponse(data.sessionId, data.message, data.usage);
    });
    
    // Speech recognition events
    this.stt.on('transcription', (data) => {
      this.handleTranscription(data.sessionId, data.text, data.confidence);
    });
    
    // WebSocket events for live updates
    this.ws.on('connection', (data) => {
      console.log(`🔗 Dashboard connection established: ${data.connectionId}`);
    });
  }

  // ============ CONVERSATION LIFECYCLE MANAGEMENT ============

  async startConversation(sessionId, callerInfo = {}, channel = 'voice') {
    try {
      console.log(`🎙️ Starting new conversation: ${sessionId}`);
      
      // Check concurrent conversation limit
      if (this.activeConversations.size >= this.options.maxConcurrentConversations) {
        throw new Error('Maximum concurrent conversations reached');
      }
      
      // Create conversation in database
      const dbResult = await this.db.createConversation(sessionId, callerInfo);
      const conversation = dbResult.rows[0];
      
      // Initialize in-memory conversation object
      const conversationData = {
        id: conversation.id,
        sessionId: sessionId,
        callerInfo: callerInfo,
        channel: channel,
        startTime: new Date(),
        status: 'active',
        messages: [],
        currentIntent: null,
        context: {
          patientInfo: callerInfo,
          appointmentPreferences: {},
          medicalHistory: [],
          insuranceVerified: false
        },
        metrics: {
          messageCount: 0,
          avgResponseTime: 0,
          totalDuration: 0,
          satisfactionScore: null,
          sentimentTrajectory: [],
          emotionStates: []
        },
        aiState: {
          lastResponse: null,
          conversationHistory: [],
          systemPromptContext: null
        }
      };
      
      this.activeConversations.set(sessionId, conversationData);
      this.analytics.totalConversations++;
      
      // Send welcome message
      await this.sendWelcomeMessage(sessionId);
      
      // Notify dashboards of new conversation
      this.broadcastConversationUpdate(sessionId, 'started', conversationData);
      
      this.emit('conversationStarted', { sessionId, conversation: conversationData });
      console.log(`✅ Conversation ${sessionId} started successfully`);
      
      return conversationData;
      
    } catch (error) {
      console.error(`❌ Failed to start conversation ${sessionId}:`, error);
      throw error;
    }
  }

  async processUserMessage(sessionId, message, confidence = 1.0) {
    try {
      const conversation = this.activeConversations.get(sessionId);
      if (!conversation) {
        throw new Error(`Conversation ${sessionId} not found`);
      }
      
      const startTime = Date.now();
      
      // Add user message to conversation
      const userMessage = {
        id: uuidv4(),
        type: 'user',
        content: message,
        confidence: confidence,
        timestamp: new Date(),
        intent: null,
        entities: {},
        sentiment: null,
        emotion: null
      };
      
      conversation.messages.push(userMessage);
      conversation.metrics.messageCount++;
      
      // Perform real-time NLP analysis
      const analysis = await this.analyzeMessage(message);
      userMessage.intent = analysis.intent;
      userMessage.entities = analysis.entities;
      userMessage.sentiment = analysis.sentiment;
      userMessage.emotion = analysis.emotion;
      
      // Update conversation context based on intent
      this.updateConversationContext(conversation, analysis);
      
      // Save message to database
      await this.db.addMessage(conversation.id, {
        type: 'user',
        content: message,
        confidence: confidence,
        intent: analysis.intent,
        entities: analysis.entities,
        sentiment: analysis.sentiment,
        emotion: analysis.emotion,
        timestampOffset: Date.now() - conversation.startTime.getTime()
      });
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(sessionId, message, conversation.context);
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      conversation.metrics.avgResponseTime = 
        (conversation.metrics.avgResponseTime + responseTime) / 2;
      
      // Broadcast live transcription update
      this.ws.streamTranscriptionToConnections(sessionId, {
        text: message,
        confidence: confidence,
        isFinal: true,
        type: 'user',
        timestamp: new Date().toISOString()
      });
      
      this.emit('messageProcessed', {
        sessionId,
        userMessage,
        aiResponse,
        responseTime,
        analysis
      });
      
      return { userMessage, aiResponse, analysis };
      
    } catch (error) {
      console.error(`❌ Error processing message for ${sessionId}:`, error);
      throw error;
    }
  }

  async generateAIResponse(sessionId, userMessage, context) {
    try {
      const conversation = this.activeConversations.get(sessionId);
      const startTime = Date.now();
      
      // Get AI response
      const aiResult = await this.ai.processConversation(sessionId, userMessage, context);
      
      // Create assistant message
      const assistantMessage = {
        id: uuidv4(),
        type: 'assistant',
        content: aiResult.response,
        timestamp: new Date(),
        intent: aiResult.intent,
        entities: aiResult.entities,
        confidence: 1.0,
        responseTime: Date.now() - startTime
      };
      
      conversation.messages.push(assistantMessage);
      conversation.currentIntent = aiResult.intent;
      conversation.aiState.lastResponse = aiResult.response;
      
      // Save to database
      await this.db.addMessage(conversation.id, {
        type: 'assistant',
        content: aiResult.response,
        intent: aiResult.intent,
        entities: aiResult.entities,
        timestampOffset: Date.now() - conversation.startTime.getTime()
      });
      
      // Broadcast live transcription update
      this.ws.streamTranscriptionToConnections(sessionId, {
        text: aiResult.response,
        confidence: 1.0,
        isFinal: true,
        type: 'assistant',
        timestamp: new Date().toISOString()
      });
      
      // Handle specific intents
      await this.handleSpecialIntents(sessionId, aiResult.intent, aiResult.entities);
      
      return assistantMessage;
      
    } catch (error) {
      console.error(`❌ Error generating AI response for ${sessionId}:`, error);
      
      // Fallback response
      const fallbackMessage = {
        id: uuidv4(),
        type: 'assistant',
        content: "I apologize, but I'm experiencing some technical difficulties. Let me connect you with a human representative who can assist you better.",
        timestamp: new Date(),
        intent: 'transfer_to_human',
        isError: true
      };
      
      return fallbackMessage;
    }
  }

  async analyzeMessage(message) {
    try {
      // Advanced NLP analysis using Azure Cognitive Services or custom models
      const analysis = {
        intent: this.detectIntent(message),
        entities: this.extractEntities(message),
        sentiment: this.analyzeSentiment(message),
        emotion: this.detectEmotion(message),
        urgency: this.assessUrgency(message),
        language: this.detectLanguage(message)
      };
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error analyzing message:', error);
      return {
        intent: 'general_query',
        entities: {},
        sentiment: 'neutral',
        emotion: 'calm',
        urgency: 'normal',
        language: 'en'
      };
    }
  }

  detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Emergency detection
    const emergencyKeywords = ['emergency', 'urgent', 'pain', 'chest pain', 'breathing', 'accident', 'help'];
    if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'emergency';
    }
    
    // Appointment scheduling
    const appointmentKeywords = ['appointment', 'schedule', 'book', 'available', 'when can i'];
    if (appointmentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'schedule_appointment';
    }
    
    // Cancellation
    if (lowerMessage.includes('cancel') || lowerMessage.includes('reschedule')) {
      return 'cancel_reschedule_appointment';
    }
    
    // Insurance queries
    if (lowerMessage.includes('insurance') || lowerMessage.includes('coverage')) {
      return 'insurance_query';
    }
    
    // Hours and location
    if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('location')) {
      return 'clinic_info';
    }
    
    return 'general_query';
  }

  extractEntities(message) {
    const entities = {};
    
    // Extract dates
    const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
    const dates = message.match(dateRegex);
    if (dates) entities.dates = dates;
    
    // Extract times
    const timeRegex = /\b(\d{1,2}:\d{2}(?:\s?(?:am|pm))?|\d{1,2}\s?(?:am|pm))\b/gi;
    const times = message.match(timeRegex);
    if (times) entities.times = times;
    
    // Extract phone numbers
    const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s?\d{3}-\d{4}\b/g;
    const phones = message.match(phoneRegex);
    if (phones) entities.phones = phones;
    
    // Extract names (simplified)
    const nameRegex = /my name is ([A-Z][a-z]+ [A-Z][a-z]+)/i;
    const nameMatch = message.match(nameRegex);
    if (nameMatch) entities.name = nameMatch[1];
    
    return entities;
  }

  analyzeSentiment(message) {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'pleased', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'angry', 'frustrated', 'disappointed', 'upset'];
    
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  detectEmotion(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('angry') || lowerMessage.includes('mad')) return 'angry';
    if (lowerMessage.includes('frustrated') || lowerMessage.includes('annoyed')) return 'frustrated';
    if (lowerMessage.includes('worried') || lowerMessage.includes('concerned')) return 'worried';
    if (lowerMessage.includes('happy') || lowerMessage.includes('glad')) return 'happy';
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) return 'distressed';
    
    return 'neutral';
  }

  assessUrgency(message) {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'right away', 'critical'];
    const lowerMessage = message.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'urgent';
    }
    
    return 'normal';
  }

  detectLanguage(message) {
    // Simplified language detection - in production, use Azure Cognitive Services
    const spanishIndicators = ['hola', 'gracias', 'por favor', 'sí', 'no', 'español'];
    const lowerMessage = message.toLowerCase();
    
    if (spanishIndicators.some(word => lowerMessage.includes(word))) {
      return 'es';
    }
    
    return 'en';
  }

  updateConversationContext(conversation, analysis) {
    // Update context based on extracted entities
    if (analysis.entities.name) {
      conversation.context.patientInfo.name = analysis.entities.name;
    }
    
    if (analysis.entities.phones) {
      conversation.context.patientInfo.phone = analysis.entities.phones[0];
    }
    
    if (analysis.entities.dates || analysis.entities.times) {
      conversation.context.appointmentPreferences.preferredDate = analysis.entities.dates?.[0];
      conversation.context.appointmentPreferences.preferredTime = analysis.entities.times?.[0];
    }
    
    // Track sentiment trajectory
    conversation.metrics.sentimentTrajectory.push({
      sentiment: analysis.sentiment,
      timestamp: new Date()
    });
    
    // Track emotion states
    conversation.metrics.emotionStates.push({
      emotion: analysis.emotion,
      timestamp: new Date()
    });
  }

  async handleSpecialIntents(sessionId, intent, entities) {
    const conversation = this.activeConversations.get(sessionId);
    
    switch (intent) {
      case 'emergency':
        await this.handleEmergency(sessionId);
        break;
        
      case 'schedule_appointment':
        await this.handleAppointmentScheduling(sessionId, entities);
        break;
        
      case 'cancel_reschedule_appointment':
        await this.handleAppointmentModification(sessionId, entities);
        break;
        
      case 'insurance_query':
        await this.handleInsuranceQuery(sessionId, entities);
        break;
    }
  }

  async handleEmergency(sessionId) {
    const conversation = this.activeConversations.get(sessionId);
    conversation.status = 'emergency';
    this.analytics.emergencyCalls++;
    
    // Update database
    await this.db.updateConversation(conversation.id, {
      status: 'emergency',
      priority_level: 'urgent'
    });
    
    // Broadcast emergency alert
    this.ws.broadcastToSubscribers('emergency_alert', {
      sessionId: sessionId,
      caller: conversation.callerInfo,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🚨 EMERGENCY call detected: ${sessionId}`);
  }

  async handleAppointmentScheduling(sessionId, entities) {
    const conversation = this.activeConversations.get(sessionId);
    
    // Check if we have enough information
    const requiredInfo = ['name', 'phone', 'preferredDate'];
    const missingInfo = requiredInfo.filter(field => 
      !conversation.context.patientInfo[field] && 
      !conversation.context.appointmentPreferences[field]
    );
    
    if (missingInfo.length === 0) {
      // Attempt to book appointment
      try {
        const appointmentData = {
          conversationId: conversation.id,
          doctorId: 1, // Would be selected based on availability
          patientName: conversation.context.patientInfo.name,
          patientPhone: conversation.context.patientInfo.phone,
          appointmentDate: new Date(conversation.context.appointmentPreferences.preferredDate),
          appointmentType: 'consultation'
        };
        
        const appointment = await this.db.createAppointment(appointmentData);
        
        // Update conversation
        await this.db.updateConversation(conversation.id, {
          appointment_scheduled: true,
          appointment_date: appointmentData.appointmentDate
        });
        
        conversation.status = 'appointment_scheduled';
        this.analytics.appointmentsScheduled++;
        
        console.log(`📅 Appointment scheduled for ${sessionId}`);
        
      } catch (error) {
        console.error('❌ Failed to schedule appointment:', error);
      }
    }
  }

  async endConversation(sessionId, reason = 'completed') {
    try {
      const conversation = this.activeConversations.get(sessionId);
      if (!conversation) {
        console.warn(`⚠️ Attempted to end non-existent conversation: ${sessionId}`);
        return;
      }
      
      const endTime = new Date();
      const duration = endTime.getTime() - conversation.startTime.getTime();
      
      // Generate conversation summary
      const summary = await this.generateConversationSummary(sessionId);
      
      // Update database
      await this.db.updateConversation(conversation.id, {
        end_time: endTime,
        duration_seconds: Math.floor(duration / 1000),
        status: reason,
        summary: summary,
        satisfaction_score: conversation.metrics.satisfactionScore
      });
      
      // Update analytics
      this.analytics.successfulConversations++;
      this.analytics.averageCallDuration = 
        (this.analytics.averageCallDuration + duration) / 2;
      
      // Remove from active conversations
      this.activeConversations.delete(sessionId);
      
      // Broadcast conversation end
      this.broadcastConversationUpdate(sessionId, 'ended', {
        duration: duration,
        summary: summary,
        reason: reason
      });
      
      console.log(`✅ Conversation ${sessionId} ended: ${reason} (${Math.floor(duration / 1000)}s)`);
      this.emit('conversationEnded', { sessionId, conversation, reason, summary });
      
      return { summary, duration, reason };
      
    } catch (error) {
      console.error(`❌ Error ending conversation ${sessionId}:`, error);
      throw error;
    }
  }

  async generateConversationSummary(sessionId) {
    try {
      const conversation = this.activeConversations.get(sessionId);
      const summary = await this.ai.getConversationSummary(sessionId);
      
      return summary || `Conversation with ${conversation.callerInfo.name || 'caller'} - ${conversation.messages.length} messages exchanged. Intent: ${conversation.currentIntent || 'general inquiry'}.`;
      
    } catch (error) {
      console.error('❌ Error generating summary:', error);
      return 'Summary generation failed';
    }
  }

  async sendWelcomeMessage(sessionId) {
    const welcomeMessage = "Hello! Thank you for calling ReddyTalk Medical Center. I'm your AI assistant, and I'm here to help schedule appointments, answer questions about our services, and assist with general inquiries. How may I help you today?";
    
    await this.processUserMessage(sessionId, welcomeMessage, 1.0);
  }

  // ============ BACKGROUND PROCESSES ============

  startAutoSaveProcess() {
    setInterval(async () => {
      try {
        for (const [sessionId, conversation] of this.activeConversations) {
          // Auto-save conversation progress
          await this.db.updateConversation(conversation.id, {
            updated_at: new Date()
          });
          
          // Check for inactive conversations
          const inactiveTime = Date.now() - conversation.startTime.getTime();
          if (inactiveTime > this.options.conversationTimeout) {
            console.log(`⏰ Auto-ending inactive conversation: ${sessionId}`);
            await this.endConversation(sessionId, 'timeout');
          }
        }
      } catch (error) {
        console.error('❌ Auto-save process error:', error);
      }
    }, this.options.autoSaveInterval);
  }

  startConversationCleanup() {
    setInterval(() => {
      // Cleanup completed conversations from memory (they're already saved to DB)
      const now = Date.now();
      const cleanupThreshold = 300000; // 5 minutes
      
      for (const [sessionId, conversation] of this.activeConversations) {
        if (conversation.status === 'completed' || conversation.status === 'ended') {
          const timeSinceEnd = now - (conversation.endTime?.getTime() || 0);
          if (timeSinceEnd > cleanupThreshold) {
            this.activeConversations.delete(sessionId);
            console.log(`🧹 Cleaned up conversation: ${sessionId}`);
          }
        }
      }
    }, 60000); // Run every minute
  }

  startAnalyticsCollection() {
    setInterval(async () => {
      try {
        // Collect and save daily metrics
        const metrics = {
          metric_date: new Date().toISOString().split('T')[0],
          total_calls: this.analytics.totalConversations,
          successful_appointments: this.analytics.appointmentsScheduled,
          average_call_duration: this.analytics.averageCallDuration / 1000, // Convert to seconds
          emergency_calls: this.analytics.emergencyCalls,
          average_satisfaction: this.analytics.customerSatisfactionAvg
        };
        
        // This would save to daily_metrics table
        console.log('📊 Daily metrics:', metrics);
        
      } catch (error) {
        console.error('❌ Analytics collection error:', error);
      }
    }, 300000); // Every 5 minutes
  }

  // ============ UTILITY METHODS ============

  broadcastConversationUpdate(sessionId, event, data) {
    this.ws.streamConversationUpdate(sessionId, {
      event: event,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  getActiveConversations() {
    return Array.from(this.activeConversations.values()).map(conv => ({
      sessionId: conv.sessionId,
      callerInfo: conv.callerInfo,
      startTime: conv.startTime,
      status: conv.status,
      messageCount: conv.messages.length,
      currentIntent: conv.currentIntent
    }));
  }

  getAnalytics() {
    return {
      ...this.analytics,
      activeConversations: this.activeConversations.size,
      timestamp: new Date().toISOString()
    };
  }

  async getConversationHistory(sessionId) {
    const dbResult = await this.db.getConversationHistory(sessionId);
    return dbResult.rows[0] || null;
  }
}

module.exports = ConversationManager;