// app.js - Enterprise ReddyTalk.ai Main Application Server
// Principal System Architect implementation with microservices architecture

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import our enterprise services
const DatabaseService = require('./services/database/DatabaseService');
const WebSocketService = require('./services/realtime/WebSocketService');
const ConversationManager = require('./services/conversation/ConversationManager');
const AzureOpenAI = require('./services/ai/AzureOpenAI');
const AzureSpeechToText = require('./services/voice/AzureSpeechToText');
const AzureTextToSpeech = require('./services/voice/AzureTextToSpeech');
const TwilioVoiceService = require('./services/voice/TwilioVoiceService');
const ElevenLabsService = require('./services/voice/ElevenLabsService');
const CallManager = require('./services/call/CallManager');

class ReddyTalkServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = process.env.PORT || 8080;
    
    // Enterprise services
    this.db = new DatabaseService();
    this.ws = new WebSocketService(this.server);
    this.conversationManager = null;
    this.ai = new AzureOpenAI();
    this.stt = new AzureSpeechToText();
    this.tts = new AzureTextToSpeech();
    this.twilioService = new TwilioVoiceService();
    this.elevenLabs = new ElevenLabsService();
    this.callManager = null;
    
    // System metrics
    this.metrics = {
      startTime: new Date(),
      totalRequests: 0,
      activeConnections: 0,
      errors: 0,
      uptime: 0
    };
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🚀 Initializing ReddyTalk.ai Enterprise Server...');
      console.log('🎯 Implementing robust systems engineering practices...');
      
      // Setup Express middleware first (always works)
      this.setupMiddleware();
      console.log('✅ Express middleware configured');
      
      // Track initialization status for each service
      let initializationStatus = {
        database: false,
        websocket: false,
        ai: false,
        speech: false,
        twilio: false,
        conversationManager: false
      };
      
      // Initialize database with fallback
      try {
        await this.db.initialize();
        console.log('✅ Database service initialized');
        initializationStatus.database = true;
      } catch (error) {
        console.warn('⚠️ Database initialization failed - running in degraded mode');
        console.warn('📋 Error:', error.message);
        // Continue without database - some features will be limited
        this.db = null;
      }
      
      // Initialize WebSocket service (always works)
      try {
        await this.ws.initialize();
        console.log('✅ WebSocket service initialized');
        initializationStatus.websocket = true;
      } catch (error) {
        console.warn('⚠️ WebSocket initialization failed:', error.message);
      }
      
      // Initialize AI services with fallback
      try {
        await this.ai.initialize();
        console.log('✅ AI service initialized');
        initializationStatus.ai = true;
      } catch (error) {
        console.warn('⚠️ AI service initialization failed:', error.message);
        // Continue - will use fallback responses
      }
      
      try {
        await this.stt.initialize();
        await this.tts.initialize();
        console.log('✅ Speech services initialized');
        initializationStatus.speech = true;
      } catch (error) {
        console.warn('⚠️ Speech services initialization failed:', error.message);
        // Continue - will use text-only mode
      }
      
      // Initialize Twilio service (optional)
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          await this.twilioService.initialize();
          console.log('✅ Twilio Voice Service initialized');
          initializationStatus.twilio = true;
        } catch (error) {
          console.warn('⚠️ Twilio service not available:', error.message);
        }
      } else {
        console.log('ℹ️ Twilio credentials not provided - voice calling disabled');
      }
      
      // Initialize ElevenLabs Voice Service
      try {
        await this.elevenLabs.initialize();
        console.log('✅ ElevenLabs Voice Service initialized');
        initializationStatus.elevenLabs = true;
      } catch (error) {
        console.warn('⚠️ ElevenLabs initialization failed:', error.message);
        // Continue without AI voice synthesis
      }
      
      // Initialize conversation manager (works even without database)
      try {
        this.conversationManager = new ConversationManager(this.db, this.ws);
        if (this.db) {
          await this.conversationManager.initialize();
        }
        console.log('✅ Conversation Manager initialized');
        initializationStatus.conversationManager = true;
      } catch (error) {
        console.warn('⚠️ Conversation Manager initialization failed:', error.message);
        // Continue with basic conversation handling
      }
      
      // Initialize Call Manager with AI capabilities
      try {
        this.callManager = new CallManager(this.twilioService, this.elevenLabs, this.conversationManager);
        await this.callManager.initialize();
        console.log('✅ Call Manager with AI Voice initialized');
        initializationStatus.callManager = true;
      } catch (error) {
        console.warn('⚠️ Call Manager initialization failed:', error.message);
        // Continue with basic call handling
      }
      
      // Setup routes (always works)
      this.setupRoutes();
      console.log('✅ Routes configured');
      
      // Setup Twilio routes (if available)
      if (this.twilioService && this.twilioService.isInitialized) {
        try {
          const twilioRoutes = require('./routes/twilio')(this);
          this.app.use('/webhooks/twilio', twilioRoutes);
          console.log('✅ Twilio routes configured');
        } catch (error) {
          console.warn('⚠️ Twilio routes setup failed:', error.message);
        }
      }
      
      // Setup health monitoring (always works)
      this.setupHealthMonitoring();
      console.log('✅ Health monitoring configured');
      
      // Calculate system readiness
      const servicesInitialized = Object.values(initializationStatus).filter(Boolean).length;
      const totalServices = Object.keys(initializationStatus).length;
      const readinessPercentage = Math.round((servicesInitialized / totalServices) * 100);
      
      this.isInitialized = true;
      this.systemReadiness = readinessPercentage;
      
      console.log('🎯 =====================================');
      console.log('🚀 ReddyTalk.ai Server Initialization Complete');
      console.log('🎯 =====================================');
      console.log(`📊 System Readiness: ${readinessPercentage}% (${servicesInitialized}/${totalServices} services)`);
      console.log('📋 Service Status:');
      Object.entries(initializationStatus).forEach(([service, status]) => {
        const icon = status ? '✅' : '⚠️';
        const statusText = status ? 'Online' : 'Degraded/Offline';
        console.log(`   ${icon} ${service}: ${statusText}`);
      });
      
      if (readinessPercentage >= 60) {
        console.log('🎉 System is operational and ready to serve requests');
      } else {
        console.log('⚠️ System is running in limited capacity mode');
      }
      
      console.log('🎯 =====================================');
      
    } catch (error) {
      console.error('❌ Critical server initialization failure:', error);
      console.log('🔄 Attempting minimal startup mode...');
      
      // Minimal startup mode - just serve static files
      try {
        this.setupMiddleware();
        this.setupBasicRoutes();
        this.isInitialized = true;
        this.systemReadiness = 20; // Minimal functionality
        console.log('🆘 Server started in emergency mode - basic web serving only');
      } catch (emergencyError) {
        console.error('❌ Emergency startup failed:', emergencyError);
        throw emergencyError;
      }
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "wss:", "https:"],
          imgSrc: ["'self'", "data:", "https:"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "'unsafe-inline'"]
        }
      }
    }));
    
    // Compression
    this.app.use(compression());
    
    // CORS
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://calm-field-070972c0f.2.azurestaticapps.net', 'https://reddytalk.ai']
        : true,
      credentials: true
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP'
    });
    this.app.use('/api/', limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      this.metrics.totalRequests++;
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      
      next();
    });
    
    // Static files
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  setupBasicRoutes() {
    // Emergency routes for minimal functionality
    this.app.get('/ping', (req, res) => {
      res.json({ 
        status: 'pong', 
        mode: 'emergency',
        timestamp: new Date().toISOString() 
      });
    });
    
    this.app.get('/health/live', (req, res) => {
      res.json({
        status: 'degraded',
        message: 'Running in emergency mode',
        timestamp: new Date().toISOString(),
        readiness: this.systemReadiness || 20
      });
    });
    
    // Serve main interface
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/main.html'));
    });
  }

  setupRoutes() {
    // ============ HEALTH & SYSTEM ROUTES ============
    
    this.app.get('/health/live', async (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.metrics.startTime.getTime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });
    
    this.app.get('/health/ready', async (req, res) => {
      try {
        const checks = await Promise.all([
          this.db.runHealthCheck(),
          this.checkAIServices(),
          this.checkWebSocketService()
        ]);
        
        const allHealthy = checks.every(check => check.isHealthy);
        
        res.status(allHealthy ? 200 : 503).json({
          status: allHealthy ? 'ready' : 'not ready',
          checks: {
            database: checks[0],
            aiServices: checks[1],
            webSocket: checks[2]
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(503).json({
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    this.app.get('/metrics', async (req, res) => {
      res.json({
        system: this.getSystemMetrics(),
        database: this.db.getMetrics(),
        webSocket: this.ws.getStats(),
        conversation: this.conversationManager?.getAnalytics() || {},
        timestamp: new Date().toISOString()
      });
    });
    
    // ============ CONVERSATION API ROUTES ============
    
    this.app.post('/api/conversation/start', async (req, res) => {
      try {
        const { sessionId, callerInfo, channel } = req.body;
        
        if (!sessionId) {
          return res.status(400).json({ error: 'sessionId is required' });
        }
        
        const conversation = await this.conversationManager.startConversation(
          sessionId, 
          callerInfo || {}, 
          channel || 'voice'
        );
        
        res.json({
          success: true,
          conversation: {
            id: conversation.id,
            sessionId: conversation.sessionId,
            startTime: conversation.startTime,
            status: conversation.status
          }
        });
        
      } catch (error) {
        console.error('❌ Error starting conversation:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/conversation/:sessionId/message', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const { message, confidence } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'message is required' });
        }
        
        const result = await this.conversationManager.processUserMessage(
          sessionId, 
          message, 
          confidence || 1.0
        );
        
        res.json({
          success: true,
          userMessage: result.userMessage,
          aiResponse: result.aiResponse,
          analysis: result.analysis
        });
        
      } catch (error) {
        console.error('❌ Error processing message:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/conversation/:sessionId/end', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const { reason } = req.body;
        
        const result = await this.conversationManager.endConversation(
          sessionId, 
          reason || 'completed'
        );
        
        res.json({
          success: true,
          summary: result.summary,
          duration: result.duration,
          reason: result.reason
        });
        
      } catch (error) {
        console.error('❌ Error ending conversation:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.get('/api/conversation/:sessionId/history', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const history = await this.conversationManager.getConversationHistory(sessionId);
        
        if (!history) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        
        res.json({ success: true, conversation: history });
        
      } catch (error) {
        console.error('❌ Error fetching conversation history:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // ============ DASHBOARD API ROUTES ============
    
    this.app.get('/api/dashboard/active-conversations', async (req, res) => {
      try {
        const conversations = this.conversationManager.getActiveConversations();
        res.json({ success: true, conversations });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.get('/api/dashboard/analytics', async (req, res) => {
      try {
        const analytics = this.conversationManager.getAnalytics();
        res.json({ success: true, analytics });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.get('/api/dashboard/system-health', async (req, res) => {
      try {
        const health = await this.getSystemHealth();
        res.json({ success: true, health });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // ============ VOICE PROCESSING ROUTES ============
    
    this.app.post('/api/voice/transcribe', async (req, res) => {
      try {
        const { audioData, sessionId } = req.body;
        
        if (!audioData) {
          return res.status(400).json({ error: 'audioData is required' });
        }
        
        // Process with Azure Speech-to-Text
        const transcription = await this.stt.transcribeAudio(audioData);
        
        // If sessionId provided, process as conversation message
        if (sessionId) {
          await this.conversationManager.processUserMessage(
            sessionId,
            transcription.text,
            transcription.confidence
          );
        }
        
        res.json({
          success: true,
          transcription: transcription.text,
          confidence: transcription.confidence
        });
        
      } catch (error) {
        console.error('❌ Error transcribing audio:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/voice/synthesize', async (req, res) => {
      try {
        const { text, voiceId } = req.body;
        
        if (!text) {
          return res.status(400).json({ error: 'text is required' });
        }
        
        const audioBuffer = await this.tts.synthesizeText(text, voiceId);
        
        res.setHeader('Content-Type', 'audio/wav');
        res.send(audioBuffer);
        
      } catch (error) {
        console.error('❌ Error synthesizing speech:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // ============ TEST ROUTES ============
    
    this.app.get('/api/test/simple', (req, res) => {
      res.json({
        status: 'success',
        message: 'ReddyTalk.ai API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });
    
    this.app.get('/api/test/simple/knowledge', async (req, res) => {
      try {
        const testResponse = await this.ai.processConversation(
          'test-session',
          'Hello, I would like to schedule an appointment',
          {}
        );
        
        res.json({
          status: 'success',
          message: 'AI knowledge base test successful',
          aiResponse: testResponse.response,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'AI knowledge base test failed',
          error: error.message
        });
      }
    });
    
    this.app.get('/api/test/conversation', async (req, res) => {
      try {
        // Test complete conversation flow
        const sessionId = 'test-' + Date.now();
        
        // Start conversation
        const conversation = await this.conversationManager.startConversation(
          sessionId,
          { name: 'John Doe', phone: '555-1234' }
        );
        
        // Process a message
        const result = await this.conversationManager.processUserMessage(
          sessionId,
          'I would like to schedule an appointment with Dr. Johnson for next Tuesday'
        );
        
        // End conversation
        const summary = await this.conversationManager.endConversation(sessionId);
        
        res.json({
          status: 'success',
          message: 'Full conversation test successful',
          testData: {
            conversation: conversation,
            messageResult: result,
            summary: summary
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Conversation test failed',
          error: error.message
        });
      }
    });
    
    // ============ DASHBOARD ROUTES ============
    
    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/dashboard.html'));
    });
    
    // Call Dashboard with AI features
    this.app.get('/call-dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/call-dashboard.html'));
    });
    
    // Medical Dashboard with patient management
    this.app.get('/medical-dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/medical-dashboard.html'));
    });
    
    // ============ CALL MANAGEMENT API ROUTES ============
    
    this.app.get('/api/calls/active', async (req, res) => {
      try {
        const activeCalls = this.callManager ? this.callManager.getActiveCalls() : [];
        res.json({ success: true, calls: activeCalls });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.get('/api/calls/history', async (req, res) => {
      try {
        const history = this.callManager ? this.callManager.getCallHistory() : {};
        res.json({ success: true, history });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.get('/api/calls/metrics', async (req, res) => {
      try {
        const metrics = this.callManager ? this.callManager.getCallMetrics() : {};
        res.json({ success: true, metrics });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/test/call-flow', async (req, res) => {
      try {
        const result = this.callManager ? await this.callManager.testCallFlow() : { success: false, error: 'Call manager not available' };
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/voice/test-synthesis', async (req, res) => {
      try {
        const result = this.elevenLabs ? await this.elevenLabs.testVoiceSynthesis() : { success: false, error: 'ElevenLabs not available' };
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/voice/synthesize-text', async (req, res) => {
      try {
        const { text, options } = req.body;
        if (!text) {
          return res.status(400).json({ error: 'Text is required' });
        }
        
        const result = this.elevenLabs ? await this.elevenLabs.synthesizeText(text, options) : { success: false, error: 'ElevenLabs not available' };
        
        if (result.success) {
          res.set('Content-Type', result.contentType || 'audio/mpeg');
          res.send(result.audioBuffer);
        } else {
          res.status(500).json(result);
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/voice/medical-response', async (req, res) => {
      try {
        const { input, context } = req.body;
        if (!input) {
          return res.status(400).json({ error: 'Input is required' });
        }
        
        const result = this.elevenLabs ? await this.elevenLabs.generateMedicalReceptionistResponse(input, context) : { text: 'Service not available' };
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // ============ FRONTEND ROUTES ============
    
    // Main route - robust system dashboard
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/main.html'));
    });
    
    // Legacy index route
    this.app.get('/index', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    // Test interface route with multiple paths
    this.app.get('/test-interface', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/test-interface.html'));
    });
    
    this.app.get('/test-interface.html', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/test-interface.html'));
    });
    
    this.app.get('/test', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/test-interface.html'));
    });
    
    // Service worker
    this.app.get('/sw.js', (req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.sendFile(path.join(__dirname, '../public/sw.js'));
    });
    
    // ============ ROBUST ERROR HANDLING ============
    
    // Health check routes (always available)
    this.app.get('/ping', (req, res) => {
      res.json({ status: 'pong', timestamp: new Date().toISOString() });
    });
    
    this.app.get('/status', (req, res) => {
      res.json({
        status: 'operational',
        services: {
          api: 'online',
          database: this.db ? 'online' : 'offline',
          ai: this.ai ? 'online' : 'offline',
          websocket: this.ws ? 'online' : 'offline'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Catch-all route for frontend
    this.app.get('*', (req, res, next) => {
      // If it's an API route, let it 404
      if (req.path.startsWith('/api/') || req.path.startsWith('/webhooks/')) {
        return next();
      }
      
      // For all other routes, serve the main app
      res.sendFile(path.join(__dirname, '../public/main.html'));
    });
    
    // 404 handler for API routes
    this.app.use((req, res) => {
      const isAPI = req.path.startsWith('/api/') || req.path.startsWith('/webhooks/');
      
      if (isAPI) {
        res.status(404).json({
          error: 'Not Found',
          message: `API route ${req.method} ${req.path} not found`,
          timestamp: new Date().toISOString(),
          availableRoutes: [
            'GET /health/live',
            'GET /health/ready', 
            'GET /metrics',
            'POST /api/conversation/start',
            'GET /api/test/simple',
            'GET /ping',
            'GET /status'
          ]
        });
      } else {
        // Serve main app for non-API routes
        res.sendFile(path.join(__dirname, '../public/main.html'));
      }
    });
    
    // ============ COMPREHENSIVE ERROR HANDLER ============
    this.app.use((error, req, res, next) => {
      console.error('❌ Unhandled error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      this.metrics.errors++;
      
      // Log to external monitoring service (if configured)
      this.logError(error, req);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isAPI = req.path.startsWith('/api/') || req.path.startsWith('/webhooks/');
      
      if (isAPI) {
        // JSON error response for API
        res.status(error.statusCode || 500).json({
          error: error.name || 'Internal Server Error',
          message: isDevelopment ? error.message : 'An unexpected error occurred',
          code: error.code,
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
      } else {
        // HTML error page for web routes
        res.status(error.statusCode || 500).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Error - ReddyTalk.ai</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #d32f2f; }
              .info { color: #666; margin-top: 20px; }
              .btn { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1 class="error">🚨 Something went wrong</h1>
            <p>We're experiencing a temporary issue. Please try again.</p>
            <div class="info">
              <p><strong>Error Code:</strong> ${error.statusCode || 500}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              ${isDevelopment ? `<p><strong>Details:</strong> ${error.message}</p>` : ''}
            </div>
            <p><a href="/" class="btn">🏠 Go Home</a></p>
          </body>
          </html>
        `);
      }
    });
  }

  setupHealthMonitoring() {
    // Health check interval
    setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, 30000); // Every 30 seconds
    
    // Metrics collection
    setInterval(() => {
      this.updateMetrics();
    }, 60000); // Every minute
  }

  async performHealthChecks() {
    const checks = [
      { name: 'database', check: () => this.db.runHealthCheck() },
      { name: 'ai', check: () => this.checkAIServices() },
      { name: 'websocket', check: () => this.checkWebSocketService() }
    ];
    
    for (const { name, check } of checks) {
      try {
        const result = await check();
        await this.db.recordSystemStatus(
          name, 
          result.isHealthy ? 'healthy' : 'unhealthy', 
          result.latency
        );
      } catch (error) {
        await this.db.recordSystemStatus(name, 'error', null, error.message);
      }
    }
  }

  async checkAIServices() {
    try {
      const startTime = Date.now();
      await this.ai.processConversation('health-check', 'test', {});
      return {
        isHealthy: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        isHealthy: false,
        error: error.message
      };
    }
  }

  checkWebSocketService() {
    return {
      isHealthy: this.ws.isInitialized,
      latency: 0,
      connections: this.ws.getStats().connections
    };
  }

  updateMetrics() {
    this.metrics.uptime = Date.now() - this.metrics.startTime.getTime();
    this.metrics.activeConnections = this.ws?.getStats().connections || 0;
  }

  getSystemMetrics() {
    return {
      ...this.metrics,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  async getSystemHealth() {
    const dbHealth = await this.db.runHealthCheck();
    const aiHealth = await this.checkAIServices();
    const wsHealth = this.checkWebSocketService();
    
    return {
      overall: dbHealth.isHealthy && aiHealth.isHealthy && wsHealth.isHealthy ? 'healthy' : 'unhealthy',
      services: {
        database: dbHealth,
        ai: aiHealth,
        webSocket: wsHealth
      },
      timestamp: new Date().toISOString()
    };
  }

  async start() {
    try {
      await this.initialize();
      
      this.server.listen(this.port, () => {
        console.log('🚀 =====================================');
        console.log('🎯 ReddyTalk.ai Enterprise Server LIVE');
        console.log('🚀 =====================================');
        console.log(`📡 Server: http://localhost:${this.port}`);
        console.log(`📊 Dashboard: http://localhost:${this.port}/dashboard`);
        console.log(`🔗 WebSocket: ws://localhost:${this.port}/ws`);
        console.log(`💊 Health: http://localhost:${this.port}/health/ready`);
        console.log(`📈 Metrics: http://localhost:${this.port}/metrics`);
        console.log('🚀 =====================================');
        
        // Test API endpoints
        console.log('🧪 Test endpoints:');
        console.log(`   http://localhost:${this.port}/api/test/simple`);
        console.log(`   http://localhost:${this.port}/api/test/simple/knowledge`);
        console.log(`   http://localhost:${this.port}/api/test/conversation`);
        console.log('🚀 =====================================');
      });
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  // ============ ERROR LOGGING & MONITORING ============
  
  logError(error, req = null) {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      request: req ? {
        url: req.url,
        method: req.method,
        headers: req.headers,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      } : null,
      system: {
        uptime: this.metrics.uptime,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 Detailed error log:', JSON.stringify(errorData, null, 2));
    }
    
    // Store in database if available
    if (this.db) {
      this.db.logError(errorData).catch(dbError => {
        console.error('Failed to log error to database:', dbError);
      });
    }
    
    // Send to external monitoring (implement as needed)
    // this.sendToMonitoring(errorData);
  }

  async performSystemDiagnostics() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform
      },
      application: {
        metrics: this.metrics,
        isInitialized: this.isInitialized,
        activeConnections: this.ws?.getStats().connections || 0
      },
      services: {}
    };
    
    // Test database connection
    try {
      const dbHealth = await this.db.runHealthCheck();
      diagnostics.services.database = dbHealth;
    } catch (error) {
      diagnostics.services.database = { isHealthy: false, error: error.message };
    }
    
    // Test AI services
    try {
      const aiHealth = await this.checkAIServices();
      diagnostics.services.ai = aiHealth;
    } catch (error) {
      diagnostics.services.ai = { isHealthy: false, error: error.message };
    }
    
    return diagnostics;
  }

  async shutdown() {
    console.log('🔌 Shutting down ReddyTalk.ai Server...');
    
    try {
      // Graceful shutdown sequence
      console.log('📊 Performing final system diagnostics...');
      const diagnostics = await this.performSystemDiagnostics();
      console.log('📋 Final system status:', diagnostics.application.metrics);
      
      // Close services in reverse order
      if (this.twilioService?.isInitialized) {
        await this.twilioService.shutdown();
        console.log('✅ Twilio service shutdown');
      }
      
      if (this.ws) {
        await this.ws.shutdown();
        console.log('✅ WebSocket service shutdown');
      }
      
      if (this.db) {
        await this.db.close();
        console.log('✅ Database connections closed');
      }
      
      this.server.close(() => {
        console.log('✅ HTTP server shutdown complete');
        console.log('🎯 Total uptime:', Math.floor(process.uptime()), 'seconds');
        process.exit(0);
      });
      
      // Force exit after 30 seconds
      setTimeout(() => {
        console.log('⏰ Force shutdown after timeout');
        process.exit(1);
      }, 30000);
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.shutdown();
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.shutdown();
});

// Start server
const server = new ReddyTalkServer();
server.start().catch(error => {
  console.error('❌ Fatal server error:', error);
  process.exit(1);
});

module.exports = ReddyTalkServer;