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
      
      // Setup Express middleware
      this.setupMiddleware();
      
      // Initialize database first
      await this.db.initialize();
      console.log('✅ Database service initialized');
      
      // Initialize WebSocket service
      await this.ws.initialize();
      console.log('✅ WebSocket service initialized');
      
      // Initialize AI services
      await this.ai.initialize();
      await this.stt.initialize();
      await this.tts.initialize();
      console.log('✅ AI services initialized');
      
      // Initialize conversation manager
      this.conversationManager = new ConversationManager(this.db, this.ws);
      await this.conversationManager.initialize();
      console.log('✅ Conversation Manager initialized');
      
      // Setup routes
      this.setupRoutes();
      
      // Setup health monitoring
      this.setupHealthMonitoring();
      
      this.isInitialized = true;
      console.log('✅ ReddyTalk.ai Server fully initialized');
      
    } catch (error) {
      console.error('❌ Server initialization failed:', error);
      throw error;
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
    
    // Default route
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
      });
    });
    
    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('❌ Unhandled error:', error);
      this.metrics.errors++;
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
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

  async shutdown() {
    console.log('🔌 Shutting down ReddyTalk.ai Server...');
    
    try {
      await this.ws.shutdown();
      await this.db.close();
      
      this.server.close(() => {
        console.log('✅ Server shutdown complete');
        process.exit(0);
      });
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