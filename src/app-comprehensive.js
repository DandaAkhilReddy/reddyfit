// Comprehensive ReddyTalk.ai Backend Application
// Complete medical AI platform with authentication, patient management, calls, and training data

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Server: SocketIOServer } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import services
const DatabaseService = require('./services/database/DatabaseService');
const AuthService = require('./services/auth/AuthService');
const PatientManagementService = require('./services/patients/PatientManagementService');
const CallRecordingService = require('./services/calls/CallRecordingService');
const LiveTranscriptService = require('./services/calls/LiveTranscriptService');
const TrainingDataService = require('./services/training/TrainingDataService');
const ContinuousTrainingService = require('./services/training/ContinuousTrainingService');
const WebSocketService = require('./services/realtime/WebSocketService');

// Import middleware
const AuthMiddleware = require('./middleware/AuthMiddleware');

// Import controllers
const AuthController = require('./controllers/AuthController');
const PatientController = require('./controllers/PatientController');
const CallController = require('./controllers/CallController');

// Import existing services
const ElevenLabsService = require('./services/voice/ElevenLabsService');
const TwilioVoiceService = require('./services/voice/TwilioVoiceService');
const ConversationManager = require('./services/conversation/ConversationManager');

class ReddyTalkApp {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Services
    this.db = new DatabaseService();
    this.authService = new AuthService();
    this.patientService = new PatientManagementService();
    this.recordingService = new CallRecordingService();
    this.transcriptService = new LiveTranscriptService();
    this.trainingService = new TrainingDataService();
    this.continuousTrainingService = new ContinuousTrainingService();
    this.wsService = new WebSocketService();
    this.elevenLabsService = new ElevenLabsService();
    this.twilioService = new TwilioVoiceService();
    this.conversationManager = new ConversationManager();

    // Middleware
    this.authMiddleware = new AuthMiddleware();

    // Controllers
    this.authController = new AuthController();
    this.patientController = new PatientController();
    this.callController = new CallController();

    // Configuration
    this.port = process.env.PORT || 8080;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🚀 Starting ReddyTalk.ai Backend Server...');
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Initialize core services
      await this.initializeServices();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup WebSocket
      this.setupWebSocket();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('✅ ReddyTalk.ai Backend initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize ReddyTalk.ai Backend:', error);
      throw error;
    }
  }

  async initializeServices() {
    console.log('🔧 Initializing services...');

    // Initialize core services first
    await this.db.initialize();
    await this.authService.initialize();
    await this.authMiddleware.initialize();
    
    // Initialize business services
    await this.patientService.initialize();
    await this.recordingService.initialize();
    await this.transcriptService.initialize();
    await this.trainingService.initialize();
    await this.continuousTrainingService.initialize();
    
    // Initialize voice services
    await this.elevenLabsService.initialize();
    await this.twilioService.initialize();
    await this.conversationManager.initialize();
    
    // Initialize WebSocket service
    await this.wsService.initialize();
    
    // Initialize controllers
    await this.authController.initialize();
    await this.patientController.initialize();
    await this.callController.initialize();

    console.log('✅ All services initialized');
  }

  setupMiddleware() {
    console.log('🛡️ Setting up middleware...');

    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.isDevelopment 
        ? ['http://localhost:3000', 'http://localhost:3001']
        : [process.env.FRONTEND_URL],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    });
    
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Limit auth requests to 10 per windowMs
      message: 'Too many authentication attempts',
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use('/api/', generalLimiter);
    this.app.use('/api/auth/login', authLimiter);
    this.app.use('/api/auth/register', authLimiter);

    // Request logging
    this.app.use((req, res, next) => {
      if (this.isDevelopment) {
        console.log(`${req.method} ${req.path} - ${req.ip}`);
      }
      next();
    });

    // Set current user for audit logging
    this.app.use((req, res, next) => {
      if (req.user) {
        process.env.app_current_user_id = req.user.id;
      }
      next();
    });

    console.log('✅ Middleware configured');
  }

  setupWebSocket() {
    console.log('🌐 Setting up WebSocket connections...');

    this.io.on('connection', (socket) => {
      console.log(`📱 Client connected: ${socket.id}`);

      // Join user to their personal room for notifications
      socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`👤 User ${userId} joined personal room`);
      });

      // Join call room for live updates
      socket.on('join-call', (callSessionId) => {
        socket.join(`call-${callSessionId}`);
        console.log(`📞 Client joined call room: ${callSessionId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`📱 Client disconnected: ${socket.id}`);
      });

      // Handle live transcript subscription
      socket.on('subscribe-transcript', (callSessionId) => {
        socket.join(`transcript-${callSessionId}`);
        console.log(`📝 Client subscribed to transcript: ${callSessionId}`);
      });

      // Handle dashboard subscription
      socket.on('subscribe-dashboard', () => {
        socket.join('dashboard-updates');
        console.log('📊 Client subscribed to dashboard updates');
      });
    });

    // Set up WebSocket service with Socket.IO instance
    this.wsService.setSocketIO(this.io);

    console.log('✅ WebSocket configured');
  }

  setupRoutes() {
    console.log('🛤️ Setting up routes...');

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'ReddyTalk.ai Backend',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API information
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'ReddyTalk.ai API',
        version: '2.0.0',
        description: 'Complete medical AI platform API',
        endpoints: {
          auth: '/api/auth',
          patients: '/api/patients',
          calls: '/api/calls',
          training: '/api/training',
          trainingPipeline: '/api/training-pipeline',
          analytics: '/api/analytics'
        },
        documentation: '/api/docs',
        status: 'operational'
      });
    });

    // Authentication routes
    this.setupAuthRoutes();

    // Patient management routes
    this.setupPatientRoutes();

    // Call management routes
    this.setupCallRoutes();

    // Training data routes
    this.setupTrainingRoutes();

    // Continuous training pipeline routes
    this.setupContinuousTrainingRoutes();

    // Analytics routes
    this.setupAnalyticsRoutes();

    // Voice integration routes (existing functionality)
    this.setupVoiceRoutes();

    // Admin routes
    this.setupAdminRoutes();

    // Static file serving for recordings and exports
    this.app.use('/api/files', express.static(path.join(__dirname, '../storage')));

    // 404 handler for API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        code: 'ENDPOINT_NOT_FOUND',
        availableEndpoints: ['/api/auth', '/api/patients', '/api/calls', '/api/training', '/api/training-pipeline']
      });
    });

    console.log('✅ Routes configured');
  }

  setupAuthRoutes() {
    const router = express.Router();

    // Public routes
    router.post('/register', 
      this.authController.getRegistrationValidation(),
      this.authController.register
    );

    router.post('/login',
      this.authController.getLoginValidation(),
      this.authController.login
    );

    router.post('/forgot-password', this.authController.forgotPassword);
    router.post('/reset-password', this.authController.resetPassword);
    router.post('/verify-email', this.authController.verifyEmail);
    router.post('/validate-token', this.authController.validateToken);

    // Protected routes
    router.use(this.authMiddleware.authenticate);
    
    router.get('/profile', this.authController.getProfile);
    router.put('/profile', this.authController.updateProfile);
    router.post('/change-password', this.authController.changePassword);
    router.post('/logout', this.authController.logout);
    router.post('/logout-all', this.authController.logoutAll);
    router.get('/sessions', this.authController.getSessions);
    router.delete('/sessions/:sessionId', this.authController.revokeSession);

    // Admin routes
    router.get('/admin/users', 
      this.authMiddleware.requireAdmin,
      this.authController.getUsers
    );

    router.get('/health', this.authController.healthCheck);

    this.app.use('/api/auth', router);
  }

  setupPatientRoutes() {
    const router = express.Router();

    // All patient routes require authentication
    router.use(this.authMiddleware.authenticate);
    router.use(this.authMiddleware.logPatientAccess);

    // Patient CRUD
    router.post('/',
      this.authMiddleware.requirePatientAccess('write'),
      this.patientController.getCreatePatientValidation(),
      this.patientController.createPatient
    );

    router.get('/search',
      this.authMiddleware.requirePatientAccess('read'),
      this.patientController.getSearchValidation(),
      this.patientController.searchPatients
    );

    router.get('/stats',
      this.authMiddleware.requireMedicalStaff,
      this.patientController.getPatientStats
    );

    router.get('/:patientId',
      this.authMiddleware.requirePatientAccess('read'),
      this.patientController.getPatient
    );

    router.put('/:patientId',
      this.authMiddleware.requirePatientAccess('write'),
      this.patientController.getUpdatePatientValidation(),
      this.patientController.updatePatient
    );

    // Medical history
    router.post('/:patientId/history',
      this.authMiddleware.requireMedicalStaff,
      this.patientController.addMedicalHistory
    );

    router.get('/:patientId/history',
      this.authMiddleware.requirePatientAccess('read'),
      this.patientController.getMedicalHistory
    );

    router.get('/health', this.patientController.healthCheck);

    this.app.use('/api/patients', router);
  }

  setupCallRoutes() {
    const router = express.Router();

    // All call routes require authentication
    router.use(this.authMiddleware.authenticate);

    // Call session management
    router.post('/',
      this.authMiddleware.requireStaff,
      this.callController.getCreateCallValidation(),
      this.callController.createCall
    );

    router.get('/', 
      this.authMiddleware.requireStaff,
      this.callController.listCalls
    );

    router.get('/active',
      this.authMiddleware.requireStaff,
      this.callController.getActiveCalls
    );

    router.get('/:sessionId',
      this.authMiddleware.requireStaff,
      this.callController.getCall
    );

    router.post('/:sessionId/end',
      this.authMiddleware.requireStaff,
      this.callController.endCall
    );

    // Recording endpoints
    router.post('/:sessionId/recording/start',
      this.authMiddleware.requireStaff,
      this.callController.startRecording
    );

    router.post('/:sessionId/recording/stop',
      this.authMiddleware.requireStaff,
      this.callController.stopRecording
    );

    router.get('/:sessionId/recording',
      this.authMiddleware.requireStaff,
      this.callController.getRecording
    );

    router.get('/:sessionId/recording/stream',
      this.authMiddleware.requireStaff,
      this.callController.streamRecording
    );

    // Transcription endpoints
    router.post('/:sessionId/transcription/start',
      this.authMiddleware.requireStaff,
      this.callController.startTranscription
    );

    router.post('/:sessionId/transcription/stop',
      this.authMiddleware.requireStaff,
      this.callController.stopTranscription
    );

    router.get('/:sessionId/transcript',
      this.authMiddleware.requireStaff,
      this.callController.getTranscript
    );

    router.get('/health', this.callController.healthCheck);

    this.app.use('/api/calls', router);
  }

  setupTrainingRoutes() {
    const router = express.Router();

    // Training data routes require analyst or admin access
    router.use(this.authMiddleware.authenticate);
    router.use(this.authMiddleware.requireRole('admin', 'analyst'));

    // Training data collection
    router.post('/collect/:callSessionId', async (req, res) => {
      try {
        const { callSessionId } = req.params;
        const options = req.body;

        const result = await this.trainingService.collectFromCall(callSessionId, options);

        res.json({
          success: true,
          message: 'Training data collected successfully',
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'TRAINING_DATA_COLLECTION_FAILED'
        });
      }
    });

    // Manual training data addition
    router.post('/manual', async (req, res) => {
      try {
        const { conversationData, metadata } = req.body;

        const result = await this.trainingService.addManualTrainingData(
          conversationData,
          req.user.id,
          { metadata }
        );

        res.status(201).json({
          success: true,
          message: 'Manual training data added successfully',
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'MANUAL_TRAINING_DATA_FAILED'
        });
      }
    });

    // Create training dataset
    router.post('/datasets', async (req, res) => {
      try {
        const { name, criteria } = req.body;

        const result = await this.trainingService.createTrainingDataset(
          name,
          criteria,
          req.user.id
        );

        res.status(201).json({
          success: true,
          message: 'Training dataset created successfully',
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'TRAINING_DATASET_CREATION_FAILED'
        });
      }
    });

    // Health check
    router.get('/health', async (req, res) => {
      try {
        const health = await this.trainingService.healthCheck();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          service: 'TrainingDataService',
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.app.use('/api/training', router);
  }

  setupContinuousTrainingRoutes() {
    const router = express.Router();

    // Continuous training routes require admin or analyst access
    router.use(this.authMiddleware.authenticate);
    router.use(this.authMiddleware.requireRole('admin', 'analyst'));

    // Get training pipeline status
    router.get('/status', async (req, res) => {
      try {
        const status = await this.continuousTrainingService.getTrainingStatus();
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'TRAINING_STATUS_FAILED'
        });
      }
    });

    // Start training pipeline manually
    router.post('/start', async (req, res) => {
      try {
        const { metadata = {}, notes } = req.body;
        
        const result = await this.continuousTrainingService.startTrainingPipeline(
          'manual',
          { ...metadata, notes },
          req.user.id
        );

        res.json({
          success: true,
          message: 'Training pipeline started successfully',
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'TRAINING_START_FAILED'
        });
      }
    });

    // Stop training pipeline
    router.post('/stop', async (req, res) => {
      try {
        const { reason = 'Manual stop' } = req.body;
        
        const result = await this.continuousTrainingService.stopTrainingPipeline(reason);

        res.json({
          success: true,
          message: 'Training pipeline stopped successfully',
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'TRAINING_STOP_FAILED'
        });
      }
    });

    // Get training history
    router.get('/history', async (req, res) => {
      try {
        const { limit = 20 } = req.query;
        
        const history = await this.continuousTrainingService.getTrainingHistory(parseInt(limit));

        res.json({
          success: true,
          data: {
            history,
            total: history.length
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'TRAINING_HISTORY_FAILED'
        });
      }
    });

    // Model evaluation endpoints
    router.post('/evaluate/:modelVersionId', async (req, res) => {
      try {
        const { modelVersionId } = req.params;
        const { validationData } = req.body;

        const result = await this.continuousTrainingService.modelEvaluationService.evaluateModel(
          modelVersionId,
          validationData
        );

        res.json({
          success: true,
          message: 'Model evaluation completed',
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'MODEL_EVALUATION_FAILED'
        });
      }
    });

    // Model deployment endpoints
    router.post('/deploy/:modelVersionId', async (req, res) => {
      try {
        const { modelVersionId } = req.params;
        const { environment = 'staging', options = {} } = req.body;

        const result = await this.continuousTrainingService.deploymentService.deployModel(
          modelVersionId,
          environment,
          { ...options, deployedBy: req.user.id }
        );

        res.json({
          success: true,
          message: 'Model deployment started',
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'MODEL_DEPLOYMENT_FAILED'
        });
      }
    });

    // List deployments
    router.get('/deployments', async (req, res) => {
      try {
        const { environment, limit = 50 } = req.query;
        
        const deployments = await this.continuousTrainingService.deploymentService.listDeployments(
          environment,
          parseInt(limit)
        );

        res.json({
          success: true,
          data: {
            deployments,
            total: deployments.length
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'DEPLOYMENTS_LIST_FAILED'
        });
      }
    });

    // Get deployment status
    router.get('/deployments/:deploymentId', async (req, res) => {
      try {
        const { deploymentId } = req.params;
        
        const deployment = await this.continuousTrainingService.deploymentService.getDeploymentStatus(deploymentId);

        res.json({
          success: true,
          data: deployment
        });
      } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: error.message,
          code: 'DEPLOYMENT_STATUS_FAILED'
        });
      }
    });

    // Rollback deployment
    router.post('/deployments/:deploymentId/rollback', async (req, res) => {
      try {
        const { deploymentId } = req.params;
        const { reason = 'Manual rollback' } = req.body;
        
        const result = await this.continuousTrainingService.deploymentService.rollbackDeployment(
          deploymentId,
          reason
        );

        res.json({
          success: true,
          message: 'Deployment rolled back successfully',
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'DEPLOYMENT_ROLLBACK_FAILED'
        });
      }
    });

    // Production deployment approval (admin only)
    router.post('/approve/:modelVersionId', 
      this.authMiddleware.requireAdmin,
      async (req, res) => {
        try {
          const { modelVersionId } = req.params;
          const { notes = '' } = req.body;
          
          const result = await this.continuousTrainingService.deploymentService.approveProductionDeployment(
            modelVersionId,
            req.user.id,
            notes
          );

          res.json({
            success: true,
            message: 'Production deployment approved',
            data: result
          });
        } catch (error) {
          res.status(400).json({
            success: false,
            error: error.message,
            code: 'DEPLOYMENT_APPROVAL_FAILED'
          });
        }
      }
    );

    // Health check
    router.get('/health', async (req, res) => {
      try {
        const health = await this.continuousTrainingService.healthCheck();
        res.json(health);
      } catch (error) {
        res.status(500).json({
          service: 'ContinuousTrainingService',
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.app.use('/api/training-pipeline', router);
  }

  setupAnalyticsRoutes() {
    const router = express.Router();

    router.use(this.authMiddleware.authenticate);
    router.use(this.authMiddleware.requireRole('admin', 'analyst', 'doctor'));

    // Dashboard analytics
    router.get('/dashboard', async (req, res) => {
      try {
        const { timeframe = '24h' } = req.query;

        // Get various analytics data
        const analytics = await this.getDashboardAnalytics(timeframe);

        res.json({
          success: true,
          data: analytics
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'ANALYTICS_RETRIEVAL_FAILED'
        });
      }
    });

    // Call analytics
    router.get('/calls', async (req, res) => {
      try {
        const { dateFrom, dateTo, groupBy = 'day' } = req.query;

        const analytics = await this.getCallAnalytics(dateFrom, dateTo, groupBy);

        res.json({
          success: true,
          data: analytics
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'CALL_ANALYTICS_FAILED'
        });
      }
    });

    this.app.use('/api/analytics', router);
  }

  setupVoiceRoutes() {
    const router = express.Router();

    // Twilio webhook endpoints (public)
    router.post('/twilio/incoming', this.twilioService.handleIncomingCall.bind(this.twilioService));
    router.post('/twilio/voice', this.twilioService.handleVoiceWebhook.bind(this.twilioService));
    router.post('/twilio/status', this.twilioService.handleStatusWebhook.bind(this.twilioService));

    // Protected voice endpoints
    router.use(this.authMiddleware.authenticate);
    router.use(this.authMiddleware.requireStaff);

    // ElevenLabs voice synthesis
    router.post('/synthesize', async (req, res) => {
      try {
        const { text, voiceId, options } = req.body;

        const result = await this.elevenLabsService.synthesizeText(text, {
          voice_id: voiceId,
          ...options
        });

        if (result.success) {
          res.setHeader('Content-Type', 'audio/mpeg');
          res.send(result.audioBuffer);
        } else {
          res.status(400).json({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Conversation management
    router.post('/conversation', async (req, res) => {
      try {
        const { patientInput, context } = req.body;

        const response = await this.conversationManager.processMessage(patientInput, context);

        res.json({
          success: true,
          data: response
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    this.app.use('/api/voice', router);
  }

  setupAdminRoutes() {
    const router = express.Router();

    router.use(this.authMiddleware.authenticate);
    router.use(this.authMiddleware.requireAdmin);

    // System health
    router.get('/health', async (req, res) => {
      try {
        const health = {
          overall: 'healthy',
          services: {
            database: await this.db.healthCheck(),
            auth: await this.authService.healthCheck(),
            patients: await this.patientService.healthCheck(),
            recording: await this.recordingService.healthCheck(),
            transcription: await this.transcriptService.healthCheck(),
            training: await this.trainingService.healthCheck(),
            continuousTraining: await this.continuousTrainingService.healthCheck()
          },
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
          }
        };

        // Check if any service is unhealthy
        const unhealthyServices = Object.values(health.services)
          .filter(service => service.status === 'unhealthy');

        if (unhealthyServices.length > 0) {
          health.overall = 'degraded';
        }

        res.json(health);
      } catch (error) {
        res.status(500).json({
          overall: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // System metrics
    router.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.getSystemMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    this.app.use('/api/admin', router);
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Resource not found',
        code: 'NOT_FOUND',
        path: req.path
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Global error handler:', err);

      // HIPAA compliance - don't leak sensitive info in errors
      const isDevelopment = process.env.NODE_ENV === 'development';

      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString()
      });
    });
  }

  // Analytics helper methods
  async getDashboardAnalytics(timeframe) {
    const timeFilter = this.getTimeFilter(timeframe);
    
    const [callStats, patientStats, systemStats] = await Promise.all([
      this.getCallStats(timeFilter),
      this.getPatientStats(timeFilter),
      this.getSystemStats()
    ]);

    return {
      calls: callStats,
      patients: patientStats,
      system: systemStats,
      timeframe,
      generatedAt: new Date().toISOString()
    };
  }

  async getCallStats(timeFilter) {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_calls,
        COUNT(*) FILTER (WHERE status = 'active') as active_calls,
        AVG(duration_seconds) as avg_duration,
        AVG(ai_performance_score) as avg_ai_score,
        AVG(patient_satisfaction_score) as avg_satisfaction
      FROM call_sessions
      WHERE started_at >= $1
    `, [timeFilter]);

    return result.rows[0];
  }

  async getPatientStats(timeFilter) {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at >= $1) as new_patients,
        COUNT(*) FILTER (WHERE last_contact_at >= $1) as active_patients,
        COUNT(*) as total_patients
      FROM patients
      WHERE is_active = true
    `, [timeFilter]);

    return result.rows[0];
  }

  async getSystemStats() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    };
  }

  getTimeFilter(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case '1h': return new Date(now - 60 * 60 * 1000);
      case '24h': return new Date(now - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now - 24 * 60 * 60 * 1000);
    }
  }

  async getSystemMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform
      },
      database: {
        connections: await this.db.getConnectionCount()
      },
      calls: {
        active: await this.getActiveCallCount(),
        total: await this.getTotalCallCount()
      },
      patients: {
        total: await this.getTotalPatientCount(),
        active: await this.getActivePatientCount()
      }
    };

    return metrics;
  }

  async getActiveCallCount() {
    const result = await this.db.query(
      "SELECT COUNT(*) as count FROM call_sessions WHERE status = 'active'"
    );
    return parseInt(result.rows[0].count);
  }

  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`🎉 ReddyTalk.ai Backend Server running on port ${this.port}`);
        console.log(`📊 Dashboard: http://localhost:${this.port}/api`);
        console.log(`🔗 WebSocket: ws://localhost:${this.port}`);
        console.log(`🏥 Health: http://localhost:${this.port}/health`);
        
        if (this.isDevelopment) {
          console.log('\n🛠️ Development Features Enabled:');
          console.log('- Detailed error messages');
          console.log('- Request logging');
          console.log('- CORS for localhost');
        }
        
        resolve();
      });
    });
  }

  async stop() {
    console.log('⏹️ Shutting down ReddyTalk.ai Backend Server...');
    
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('✅ Server stopped gracefully');
        resolve();
      });
    });
  }
}

// Create and export app instance
const app = new ReddyTalkApp();

// Start server if this file is run directly
if (require.main === module) {
  app.start().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await app.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await app.stop();
    process.exit(0);
  });
}

module.exports = app;