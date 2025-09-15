// Continuous LLM Training Pipeline Service
// Orchestrates automated model training, evaluation, and deployment

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const DatabaseService = require('../database/DatabaseService');
const TrainingDataService = require('./TrainingDataService');
const ModelTrainingService = require('./ModelTrainingService');
const ModelEvaluationService = require('./ModelEvaluationService');
const ModelDeploymentService = require('./ModelDeploymentService');
const WebSocketService = require('../realtime/WebSocketService');

class ContinuousTrainingService extends EventEmitter {
  constructor() {
    super();
    this.db = new DatabaseService();
    this.trainingDataService = new TrainingDataService();
    this.modelTrainingService = new ModelTrainingService();
    this.modelEvaluationService = new ModelEvaluationService();
    this.deploymentService = new ModelDeploymentService();
    this.wsService = new WebSocketService();
    
    // Configuration
    this.config = {
      // Training triggers
      minDataThreshold: parseInt(process.env.TRAINING_MIN_DATA_THRESHOLD) || 100,
      dataQualityThreshold: parseFloat(process.env.TRAINING_QUALITY_THRESHOLD) || 0.8,
      trainingInterval: parseInt(process.env.TRAINING_INTERVAL_HOURS) || 24,
      
      // Model parameters
      maxModelVersions: parseInt(process.env.MAX_MODEL_VERSIONS) || 10,
      performanceImprovementThreshold: parseFloat(process.env.PERF_IMPROVEMENT_THRESHOLD) || 0.02,
      
      // Training settings
      batchSize: parseInt(process.env.TRAINING_BATCH_SIZE) || 16,
      epochs: parseInt(process.env.TRAINING_EPOCHS) || 3,
      learningRate: parseFloat(process.env.LEARNING_RATE) || 0.0001,
      
      // Infrastructure
      useGPU: process.env.USE_GPU === 'true',
      maxTrainingTimeHours: parseInt(process.env.MAX_TRAINING_TIME_HOURS) || 8,
      
      // Deployment
      autoDeployEnabled: process.env.AUTO_DEPLOY === 'true',
      stagingTestDuration: parseInt(process.env.STAGING_TEST_DURATION_HOURS) || 2,
    };
    
    // State
    this.isTraining = false;
    this.currentTrainingJob = null;
    this.trainingHistory = [];
    this.scheduledTraining = null;
    
    // Metrics
    this.metrics = {
      totalTrainingJobs: 0,
      successfulTrainingJobs: 0,
      failedTrainingJobs: 0,
      averageTrainingTime: 0,
      lastTrainingDate: null,
      currentModelVersion: null,
      modelPerformanceHistory: []
    };
  }

  async initialize() {
    console.log('🤖 Initializing Continuous Training Service...');
    
    await this.db.initialize();
    await this.trainingDataService.initialize();
    await this.modelTrainingService.initialize();
    await this.modelEvaluationService.initialize();
    await this.deploymentService.initialize();
    
    // Create training pipeline tables
    await this.createTrainingTables();
    
    // Load training metrics
    await this.loadTrainingMetrics();
    
    // Start monitoring for new data
    this.startDataMonitoring();
    
    // Schedule periodic training
    this.schedulePeriodicTraining();
    
    console.log('✅ Continuous Training Service initialized');
    
    this.emit('initialized', {
      service: 'ContinuousTrainingService',
      config: this.config,
      metrics: this.metrics
    });
  }

  async createTrainingTables() {
    const schema = `
      -- Model versions table
      CREATE TABLE IF NOT EXISTS model_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        version VARCHAR(50) NOT NULL UNIQUE,
        model_type VARCHAR(50) NOT NULL DEFAULT 'medical-assistant',
        training_dataset_id UUID REFERENCES training_datasets(id),
        base_model VARCHAR(100) NOT NULL DEFAULT 'gpt-3.5-turbo',
        
        -- Training configuration
        training_config JSONB NOT NULL,
        training_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
        training_completed_at TIMESTAMP WITH TIME ZONE,
        training_status VARCHAR(20) NOT NULL DEFAULT 'training',
        training_duration_seconds INTEGER,
        
        -- Model metrics
        performance_metrics JSONB,
        evaluation_score DECIMAL(5,4),
        medical_accuracy DECIMAL(5,4),
        safety_score DECIMAL(5,4),
        response_quality DECIMAL(5,4),
        
        -- Deployment info
        is_deployed BOOLEAN NOT NULL DEFAULT false,
        deployed_at TIMESTAMP WITH TIME ZONE,
        deployment_status VARCHAR(20) DEFAULT 'not_deployed',
        model_url TEXT,
        model_size_bytes BIGINT,
        
        -- Metadata
        created_by UUID REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Training jobs table
      CREATE TABLE IF NOT EXISTS training_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_name VARCHAR(100) NOT NULL,
        model_version_id UUID REFERENCES model_versions(id),
        
        -- Job configuration
        trigger_type VARCHAR(50) NOT NULL, -- 'scheduled', 'manual', 'data_threshold', 'performance'
        training_type VARCHAR(50) NOT NULL DEFAULT 'fine-tuning', -- 'fine-tuning', 'full-training', 'incremental'
        
        -- Data info
        training_data_count INTEGER,
        validation_data_count INTEGER,
        data_quality_score DECIMAL(5,4),
        
        -- Job execution
        started_at TIMESTAMP WITH TIME ZONE NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'running',
        progress_percentage INTEGER DEFAULT 0,
        
        -- Results
        final_loss DECIMAL(10,6),
        final_accuracy DECIMAL(5,4),
        training_logs TEXT,
        error_message TEXT,
        
        -- Resource usage
        compute_time_seconds INTEGER,
        memory_used_gb DECIMAL(8,2),
        gpu_used BOOLEAN DEFAULT false,
        
        -- Metadata
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Model deployment history
      CREATE TABLE IF NOT EXISTS model_deployments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        model_version_id UUID REFERENCES model_versions(id),
        deployment_type VARCHAR(50) NOT NULL, -- 'production', 'staging', 'test'
        
        -- Deployment info
        deployed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        undeployed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        
        -- Performance tracking
        request_count BIGINT DEFAULT 0,
        average_response_time_ms INTEGER,
        error_rate DECIMAL(5,4) DEFAULT 0,
        user_satisfaction DECIMAL(5,4),
        
        -- Infrastructure
        endpoint_url TEXT,
        instance_type VARCHAR(50),
        scaling_config JSONB,
        
        -- Metadata
        deployed_by UUID REFERENCES users(id),
        rollback_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Training pipeline configurations
      CREATE TABLE IF NOT EXISTS training_pipeline_configs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        config_name VARCHAR(100) NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        
        -- Training settings
        config_data JSONB NOT NULL,
        
        -- Scheduling
        schedule_cron VARCHAR(100),
        next_run_at TIMESTAMP WITH TIME ZONE,
        
        -- Metadata
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_model_versions_status ON model_versions(training_status, created_at);
      CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON training_jobs(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_model_deployments_status ON model_deployments(status, deployment_type);
      CREATE INDEX IF NOT EXISTS idx_training_jobs_model_version ON training_jobs(model_version_id);
    `;

    await this.db.query(schema);
  }

  async loadTrainingMetrics() {
    try {
      const result = await this.db.query(`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(*) FILTER (WHERE status = 'completed') as successful_jobs,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
          AVG(compute_time_seconds) as avg_training_time,
          MAX(completed_at) as last_training
        FROM training_jobs
      `);

      if (result.rows.length > 0) {
        const data = result.rows[0];
        this.metrics.totalTrainingJobs = parseInt(data.total_jobs) || 0;
        this.metrics.successfulTrainingJobs = parseInt(data.successful_jobs) || 0;
        this.metrics.failedTrainingJobs = parseInt(data.failed_jobs) || 0;
        this.metrics.averageTrainingTime = parseFloat(data.avg_training_time) || 0;
        this.metrics.lastTrainingDate = data.last_training;
      }

      // Get current deployed model version
      const currentModelResult = await this.db.query(`
        SELECT mv.version, mv.performance_metrics
        FROM model_versions mv
        JOIN model_deployments md ON mv.id = md.model_version_id
        WHERE md.status = 'active' AND md.deployment_type = 'production'
        ORDER BY md.deployed_at DESC
        LIMIT 1
      `);

      if (currentModelResult.rows.length > 0) {
        this.metrics.currentModelVersion = currentModelResult.rows[0].version;
      }

    } catch (error) {
      console.warn('Failed to load training metrics:', error.message);
    }
  }

  startDataMonitoring() {
    console.log('📊 Starting data monitoring for training triggers...');
    
    // Check for new training data every hour
    setInterval(() => {
      this.checkTrainingTriggers();
    }, 60 * 60 * 1000); // 1 hour

    // Initial check
    setTimeout(() => {
      this.checkTrainingTriggers();
    }, 30000); // 30 seconds after startup
  }

  async checkTrainingTriggers() {
    if (this.isTraining) {
      console.log('🔄 Training already in progress, skipping trigger check');
      return;
    }

    try {
      // Check data threshold trigger
      const newDataCount = await this.getNewTrainingDataCount();
      const dataQuality = await this.getAverageDataQuality();
      
      console.log(`📈 Training Data Check: ${newDataCount} new samples, ${(dataQuality * 100).toFixed(1)}% avg quality`);

      let shouldTrigger = false;
      let triggerReason = '';

      // Data threshold trigger
      if (newDataCount >= this.config.minDataThreshold) {
        shouldTrigger = true;
        triggerReason = `data_threshold (${newDataCount} >= ${this.config.minDataThreshold})`;
      }

      // Quality improvement trigger
      if (dataQuality >= this.config.dataQualityThreshold && newDataCount >= 50) {
        shouldTrigger = true;
        triggerReason = `quality_improvement (${(dataQuality * 100).toFixed(1)}% quality, ${newDataCount} samples)`;
      }

      // Performance degradation trigger
      const currentPerformance = await this.getCurrentModelPerformance();
      if (currentPerformance && currentPerformance < 0.85 && newDataCount >= 25) {
        shouldTrigger = true;
        triggerReason = `performance_degradation (${(currentPerformance * 100).toFixed(1)}% performance)`;
      }

      if (shouldTrigger) {
        console.log(`🚀 Training triggered: ${triggerReason}`);
        await this.startTrainingPipeline('data_threshold', {
          reason: triggerReason,
          dataCount: newDataCount,
          dataQuality: dataQuality
        });
      }

    } catch (error) {
      console.error('Error checking training triggers:', error);
    }
  }

  async getNewTrainingDataCount() {
    const result = await this.db.query(`
      SELECT COUNT(*) as count
      FROM training_data
      WHERE is_used_for_training = false
        AND quality_score >= $1
        AND created_at > COALESCE(
          (SELECT MAX(training_started_at) FROM model_versions), 
          NOW() - INTERVAL '7 days'
        )
    `, [this.config.dataQualityThreshold]);

    return parseInt(result.rows[0].count) || 0;
  }

  async getAverageDataQuality() {
    const result = await this.db.query(`
      SELECT AVG(quality_score) as avg_quality
      FROM training_data
      WHERE is_used_for_training = false
        AND created_at > NOW() - INTERVAL '7 days'
    `);

    return parseFloat(result.rows[0].avg_quality) || 0;
  }

  async getCurrentModelPerformance() {
    const result = await this.db.query(`
      SELECT mv.evaluation_score
      FROM model_versions mv
      JOIN model_deployments md ON mv.id = md.model_version_id
      WHERE md.status = 'active' AND md.deployment_type = 'production'
      ORDER BY md.deployed_at DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      return parseFloat(result.rows[0].evaluation_score);
    }
    return null;
  }

  schedulePeriodicTraining() {
    console.log(`⏰ Scheduling periodic training every ${this.config.trainingInterval} hours`);
    
    // Schedule periodic training
    this.scheduledTraining = setInterval(() => {
      if (!this.isTraining) {
        console.log('🕐 Scheduled training triggered');
        this.startTrainingPipeline('scheduled', { type: 'periodic' });
      }
    }, this.config.trainingInterval * 60 * 60 * 1000);
  }

  async startTrainingPipeline(triggerType = 'manual', metadata = {}, userId = null) {
    if (this.isTraining) {
      throw new Error('Training pipeline is already running');
    }

    console.log(`🚀 Starting training pipeline (trigger: ${triggerType})`);
    this.isTraining = true;
    
    const trainingStartTime = Date.now();
    let trainingJob = null;

    try {
      // Create training job record
      trainingJob = await this.createTrainingJob(triggerType, metadata, userId);
      this.currentTrainingJob = trainingJob;

      // Broadcast training started
      this.wsService.broadcast('training-pipeline-started', {
        jobId: trainingJob.id,
        triggerType,
        metadata
      });

      // Step 1: Prepare training dataset
      console.log('📋 Step 1: Preparing training dataset...');
      await this.updateTrainingJobProgress(trainingJob.id, 10, 'Preparing dataset...');
      
      const trainingDataset = await this.prepareTrainingDataset();
      
      // Step 2: Create model version
      console.log('🏗️ Step 2: Creating model version...');
      await this.updateTrainingJobProgress(trainingJob.id, 20, 'Creating model version...');
      
      const modelVersion = await this.createModelVersion(trainingDataset, userId);
      
      // Update job with model version
      await this.db.query(`
        UPDATE training_jobs 
        SET model_version_id = $1, training_data_count = $2, validation_data_count = $3
        WHERE id = $4
      `, [modelVersion.id, trainingDataset.trainingCount, trainingDataset.validationCount, trainingJob.id]);

      // Step 3: Train model
      console.log('🧠 Step 3: Training model...');
      await this.updateTrainingJobProgress(trainingJob.id, 30, 'Training model...');
      
      const trainingResult = await this.modelTrainingService.trainModel(
        modelVersion.id,
        trainingDataset,
        this.config,
        (progress) => {
          // Update progress (30-70% range)
          const adjustedProgress = 30 + Math.floor(progress * 0.4);
          this.updateTrainingJobProgress(trainingJob.id, adjustedProgress, `Training... (${progress}%)`);
        }
      );

      // Step 4: Evaluate model
      console.log('📊 Step 4: Evaluating model...');
      await this.updateTrainingJobProgress(trainingJob.id, 80, 'Evaluating model...');
      
      const evaluationResult = await this.modelEvaluationService.evaluateModel(
        modelVersion.id,
        trainingDataset.validationData
      );

      // Step 5: Deploy model (if auto-deploy enabled and performance is good)
      let deploymentResult = null;
      if (this.config.autoDeployEnabled && evaluationResult.overallScore >= 0.85) {
        console.log('🚢 Step 5: Deploying model...');
        await this.updateTrainingJobProgress(trainingJob.id, 90, 'Deploying model...');
        
        deploymentResult = await this.deploymentService.deployModel(
          modelVersion.id,
          'staging', // Deploy to staging first
          { autoPromoteThreshold: 0.9 }
        );
      }

      // Complete training job
      const trainingDuration = Math.floor((Date.now() - trainingStartTime) / 1000);
      await this.completeTrainingJob(trainingJob.id, {
        status: 'completed',
        finalLoss: trainingResult.finalLoss,
        finalAccuracy: trainingResult.finalAccuracy,
        trainingDuration,
        evaluationScore: evaluationResult.overallScore,
        deploymentResult
      });

      // Update metrics
      this.metrics.totalTrainingJobs++;
      this.metrics.successfulTrainingJobs++;
      this.metrics.lastTrainingDate = new Date();
      this.metrics.averageTrainingTime = (this.metrics.averageTrainingTime + trainingDuration) / 2;

      console.log(`✅ Training pipeline completed successfully in ${Math.floor(trainingDuration / 60)} minutes`);
      
      // Broadcast completion
      this.wsService.broadcast('training-pipeline-completed', {
        jobId: trainingJob.id,
        modelVersion: modelVersion.version,
        evaluationScore: evaluationResult.overallScore,
        trainingDuration
      });

      this.emit('training-completed', {
        jobId: trainingJob.id,
        modelVersion: modelVersion.version,
        evaluationResult,
        trainingDuration
      });

      return {
        success: true,
        jobId: trainingJob.id,
        modelVersion: modelVersion.version,
        evaluationScore: evaluationResult.overallScore,
        trainingDuration
      };

    } catch (error) {
      console.error('❌ Training pipeline failed:', error);
      
      if (trainingJob) {
        await this.completeTrainingJob(trainingJob.id, {
          status: 'failed',
          errorMessage: error.message
        });
      }

      this.metrics.totalTrainingJobs++;
      this.metrics.failedTrainingJobs++;

      // Broadcast failure
      this.wsService.broadcast('training-pipeline-failed', {
        jobId: trainingJob?.id,
        error: error.message
      });

      this.emit('training-failed', {
        jobId: trainingJob?.id,
        error: error.message
      });

      throw error;

    } finally {
      this.isTraining = false;
      this.currentTrainingJob = null;
    }
  }

  async createTrainingJob(triggerType, metadata, userId) {
    const result = await this.db.query(`
      INSERT INTO training_jobs (
        job_name, trigger_type, started_at, created_by, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, job_name, started_at
    `, [
      `training_${Date.now()}`,
      triggerType,
      new Date(),
      userId,
      'running'
    ]);

    return result.rows[0];
  }

  async updateTrainingJobProgress(jobId, progressPercentage, statusMessage) {
    await this.db.query(`
      UPDATE training_jobs 
      SET progress_percentage = $1, updated_at = NOW()
      WHERE id = $2
    `, [progressPercentage, jobId]);

    // Broadcast progress update
    this.wsService.broadcast('training-progress', {
      jobId,
      progress: progressPercentage,
      status: statusMessage
    });
  }

  async completeTrainingJob(jobId, completionData) {
    const { status, finalLoss, finalAccuracy, trainingDuration, evaluationScore, errorMessage, deploymentResult } = completionData;

    await this.db.query(`
      UPDATE training_jobs 
      SET 
        completed_at = NOW(),
        status = $1,
        progress_percentage = $2,
        final_loss = $3,
        final_accuracy = $4,
        compute_time_seconds = $5,
        error_message = $6,
        updated_at = NOW()
      WHERE id = $7
    `, [
      status,
      status === 'completed' ? 100 : null,
      finalLoss,
      finalAccuracy,
      trainingDuration,
      errorMessage,
      jobId
    ]);
  }

  async prepareTrainingDataset() {
    return await this.trainingDataService.createTrainingDataset(
      `auto_training_${Date.now()}`,
      {
        qualityThreshold: this.config.dataQualityThreshold,
        includeUnusedOnly: true,
        maxSamples: 10000,
        medicalFocus: true
      }
    );
  }

  async createModelVersion(trainingDataset, userId) {
    const version = `v${Date.now()}`;
    
    const result = await this.db.query(`
      INSERT INTO model_versions (
        version, training_dataset_id, training_config, training_started_at,
        created_by, training_status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, version
    `, [
      version,
      trainingDataset.datasetId,
      JSON.stringify(this.config),
      new Date(),
      userId,
      'training'
    ]);

    return result.rows[0];
  }

  async getTrainingStatus() {
    return {
      isTraining: this.isTraining,
      currentJob: this.currentTrainingJob,
      metrics: this.metrics,
      config: this.config,
      nextScheduledTraining: this.getNextScheduledTraining()
    };
  }

  getNextScheduledTraining() {
    if (!this.scheduledTraining) return null;
    
    const now = new Date();
    const nextRun = new Date(now.getTime() + (this.config.trainingInterval * 60 * 60 * 1000));
    return nextRun;
  }

  async stopTrainingPipeline(reason = 'manual_stop') {
    if (!this.isTraining) {
      throw new Error('No training pipeline is currently running');
    }

    console.log(`⏹️ Stopping training pipeline: ${reason}`);
    
    // Stop model training
    if (this.modelTrainingService.isTraining) {
      await this.modelTrainingService.stopTraining();
    }

    // Update job status
    if (this.currentTrainingJob) {
      await this.completeTrainingJob(this.currentTrainingJob.id, {
        status: 'stopped',
        errorMessage: `Training stopped: ${reason}`
      });
    }

    this.isTraining = false;
    this.currentTrainingJob = null;

    this.emit('training-stopped', { reason });
    return { success: true, message: 'Training pipeline stopped' };
  }

  async getTrainingHistory(limit = 20) {
    const result = await this.db.query(`
      SELECT 
        tj.*,
        mv.version as model_version,
        mv.evaluation_score,
        u.first_name, u.last_name
      FROM training_jobs tj
      LEFT JOIN model_versions mv ON tj.model_version_id = mv.id
      LEFT JOIN users u ON tj.created_by = u.id
      ORDER BY tj.started_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  async healthCheck() {
    const componentsHealth = await Promise.allSettled([
      this.modelTrainingService.healthCheck(),
      this.modelEvaluationService.healthCheck(),
      this.deploymentService.healthCheck()
    ]);

    const isHealthy = componentsHealth.every(result => 
      result.status === 'fulfilled' && result.value.status === 'healthy'
    );

    return {
      service: 'ContinuousTrainingService',
      status: isHealthy ? 'healthy' : 'unhealthy',
      isTraining: this.isTraining,
      metrics: this.metrics,
      config: this.config,
      components: {
        modelTraining: componentsHealth[0].status === 'fulfilled' ? componentsHealth[0].value : { status: 'unhealthy' },
        modelEvaluation: componentsHealth[1].status === 'fulfilled' ? componentsHealth[1].value : { status: 'unhealthy' },
        deployment: componentsHealth[2].status === 'fulfilled' ? componentsHealth[2].value : { status: 'unhealthy' }
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ContinuousTrainingService;