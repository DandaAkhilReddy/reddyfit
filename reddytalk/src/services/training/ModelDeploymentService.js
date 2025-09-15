// Model Deployment Service
// Handles deployment of trained models to staging and production environments

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const DatabaseService = require('../database/DatabaseService');
const WebSocketService = require('../realtime/WebSocketService');

class ModelDeploymentService extends EventEmitter {
  constructor() {
    super();
    this.db = new DatabaseService();
    this.wsService = new WebSocketService();
    this.isDeploying = false;
    this.activeDeployments = new Map();
    
    // Deployment configuration
    this.deploymentConfig = {
      environments: {
        test: {
          enabled: true,
          autoRollback: true,
          maxInstances: 1,
          healthCheckInterval: 30000, // 30 seconds
          performanceThreshold: 0.8
        },
        staging: {
          enabled: true,
          autoRollback: true,
          maxInstances: 2,
          healthCheckInterval: 60000, // 1 minute
          performanceThreshold: 0.85,
          trafficSplitPercent: 10 // 10% of traffic for A/B testing
        },
        production: {
          enabled: process.env.ENABLE_PROD_DEPLOYMENT === 'true',
          autoRollback: true,
          maxInstances: parseInt(process.env.PROD_MAX_INSTANCES) || 5,
          healthCheckInterval: 30000,
          performanceThreshold: 0.9,
          requireManualApproval: process.env.REQUIRE_MANUAL_APPROVAL !== 'false'
        }
      },
      
      // Deployment strategies
      strategies: {
        blueGreen: {
          enabled: true,
          switchoverTime: 5000 // 5 seconds
        },
        canary: {
          enabled: true,
          initialPercent: 5,
          incrementPercent: 10,
          incrementInterval: 300000 // 5 minutes
        },
        rollingUpdate: {
          enabled: true,
          batchSize: 1,
          batchInterval: 60000 // 1 minute
        }
      },

      // Infrastructure providers
      providers: {
        aws: {
          enabled: !!process.env.AWS_ACCESS_KEY_ID,
          region: process.env.AWS_REGION || 'us-east-1',
          sagemakerEndpoint: process.env.SAGEMAKER_ENDPOINT
        },
        azure: {
          enabled: !!process.env.AZURE_CLIENT_ID,
          endpoint: process.env.AZURE_ML_ENDPOINT
        },
        gcp: {
          enabled: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
          projectId: process.env.GCP_PROJECT_ID
        },
        local: {
          enabled: process.env.ENABLE_LOCAL_DEPLOYMENT === 'true',
          port: parseInt(process.env.LOCAL_MODEL_PORT) || 8081
        }
      }
    };

    // Performance monitoring
    this.monitoring = {
      metricsCollectionInterval: 60000, // 1 minute
      alertThresholds: {
        responseTime: 2000, // 2 seconds
        errorRate: 0.05, // 5%
        throughput: 100 // requests per minute
      }
    };
  }

  async initialize() {
    console.log('🚢 Initializing Model Deployment Service...');
    
    await this.db.initialize();
    
    // Create deployment tables
    await this.createDeploymentTables();
    
    // Initialize monitoring
    this.startPerformanceMonitoring();
    
    // Load existing deployments
    await this.loadActiveDeployments();
    
    console.log('✅ Model Deployment Service initialized');
    console.log('🌍 Available environments:', Object.keys(this.deploymentConfig.environments).filter(env => 
      this.deploymentConfig.environments[env].enabled
    ));
  }

  async createDeploymentTables() {
    const schema = `
      -- Model evaluation test cases table
      CREATE TABLE IF NOT EXISTS model_evaluation_test_cases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        test_case_id VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        scenario TEXT NOT NULL,
        input_data JSONB NOT NULL,
        expected_behavior JSONB NOT NULL,
        evaluation_criteria JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Model evaluations table
      CREATE TABLE IF NOT EXISTS model_evaluations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        model_version_id UUID REFERENCES model_versions(id),
        evaluation_results JSONB NOT NULL,
        overall_score DECIMAL(5,4) NOT NULL,
        evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        recommendations JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Deployment performance metrics table
      CREATE TABLE IF NOT EXISTS deployment_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deployment_id UUID REFERENCES model_deployments(id),
        metric_name VARCHAR(50) NOT NULL,
        metric_value DECIMAL(10,4) NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB
      );

      -- Deployment approvals table (for production deployments)
      CREATE TABLE IF NOT EXISTS deployment_approvals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        deployment_id UUID REFERENCES model_deployments(id),
        approved_by UUID REFERENCES users(id),
        approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        approval_notes TEXT,
        approved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_deployment_metrics_deployment ON deployment_metrics(deployment_id, recorded_at);
      CREATE INDEX IF NOT EXISTS idx_deployment_approvals_status ON deployment_approvals(approval_status, created_at);
    `;

    await this.db.query(schema);
  }

  async loadActiveDeployments() {
    const result = await this.db.query(`
      SELECT id, model_version_id, deployment_type, endpoint_url, status
      FROM model_deployments 
      WHERE status = 'active'
    `);

    result.rows.forEach(deployment => {
      this.activeDeployments.set(deployment.id, {
        id: deployment.id,
        modelVersionId: deployment.model_version_id,
        environment: deployment.deployment_type,
        endpointUrl: deployment.endpoint_url,
        status: deployment.status
      });
    });

    console.log(`📋 Loaded ${this.activeDeployments.size} active deployments`);
  }

  async deployModel(modelVersionId, environment = 'staging', options = {}) {
    if (this.isDeploying) {
      throw new Error('Another deployment is already in progress');
    }

    console.log(`🚀 Starting deployment of model ${modelVersionId} to ${environment}`);
    this.isDeploying = true;

    try {
      // Validate environment
      if (!this.deploymentConfig.environments[environment]?.enabled) {
        throw new Error(`Deployment environment ${environment} is not available`);
      }

      // Check if production deployment requires approval
      if (environment === 'production' && this.deploymentConfig.environments.production.requireManualApproval) {
        const approvalStatus = await this.checkApprovalStatus(modelVersionId, environment);
        if (approvalStatus !== 'approved') {
          throw new Error('Production deployment requires manual approval');
        }
      }

      // Get model information
      const modelInfo = await this.getModelInfo(modelVersionId);
      
      // Validate model readiness
      await this.validateModelForDeployment(modelInfo, environment);

      // Create deployment record
      const deployment = await this.createDeploymentRecord(modelVersionId, environment, options);

      // Execute deployment strategy
      const deploymentResult = await this.executeDeployment(deployment, modelInfo, options);

      // Start monitoring
      this.startDeploymentMonitoring(deployment.id);

      // Update deployment record with success
      await this.updateDeploymentStatus(deployment.id, 'active', deploymentResult);

      // Broadcast deployment success
      this.wsService.broadcast('model-deployment-completed', {
        deploymentId: deployment.id,
        modelVersion: modelInfo.version,
        environment,
        endpointUrl: deploymentResult.endpointUrl
      });

      console.log(`✅ Model deployment completed: ${deploymentResult.endpointUrl}`);
      this.emit('deployment-completed', { deployment, result: deploymentResult });

      return deploymentResult;

    } catch (error) {
      console.error(`❌ Deployment failed for model ${modelVersionId}:`, error);
      this.emit('deployment-failed', { modelVersionId, environment, error: error.message });
      throw error;

    } finally {
      this.isDeploying = false;
    }
  }

  async getModelInfo(modelVersionId) {
    const result = await this.db.query(`
      SELECT mv.*, me.overall_score as evaluation_score
      FROM model_versions mv
      LEFT JOIN model_evaluations me ON mv.id = me.model_version_id
      WHERE mv.id = $1
      ORDER BY me.evaluation_date DESC
      LIMIT 1
    `, [modelVersionId]);

    if (result.rows.length === 0) {
      throw new Error(`Model version ${modelVersionId} not found`);
    }

    return result.rows[0];
  }

  async validateModelForDeployment(modelInfo, environment) {
    const envConfig = this.deploymentConfig.environments[environment];
    
    // Check model training status
    if (modelInfo.training_status !== 'completed') {
      throw new Error(`Model training is not completed. Current status: ${modelInfo.training_status}`);
    }

    // Check evaluation score threshold
    const evaluationScore = parseFloat(modelInfo.evaluation_score) || 0;
    if (evaluationScore < envConfig.performanceThreshold) {
      throw new Error(`Model evaluation score (${evaluationScore.toFixed(2)}) is below threshold for ${environment} (${envConfig.performanceThreshold})`);
    }

    // Check model URL/path exists
    if (!modelInfo.model_url) {
      throw new Error('Model URL/path is not available');
    }

    console.log(`✅ Model validated for ${environment} deployment (score: ${evaluationScore.toFixed(2)})`);
  }

  async createDeploymentRecord(modelVersionId, environment, options) {
    const result = await this.db.query(`
      INSERT INTO model_deployments (
        model_version_id, deployment_type, deployed_at, status,
        scaling_config, deployed_by
      ) VALUES ($1, $2, NOW(), $3, $4, $5)
      RETURNING id, deployed_at
    `, [
      modelVersionId,
      environment,
      'deploying',
      JSON.stringify(options.scalingConfig || {}),
      options.deployedBy || null
    ]);

    const deployment = {
      id: result.rows[0].id,
      modelVersionId,
      environment,
      deployedAt: result.rows[0].deployed_at,
      options
    };

    this.activeDeployments.set(deployment.id, deployment);
    return deployment;
  }

  async executeDeployment(deployment, modelInfo, options) {
    const { environment } = deployment;
    const strategy = options.strategy || 'blueGreen';
    
    console.log(`🔧 Executing ${strategy} deployment to ${environment}`);

    // Select deployment provider
    const provider = this.selectDeploymentProvider(environment);
    
    let deploymentResult;
    
    switch (provider) {
      case 'aws':
        deploymentResult = await this.deployToAWS(deployment, modelInfo, options);
        break;
      case 'azure':
        deploymentResult = await this.deployToAzure(deployment, modelInfo, options);
        break;
      case 'gcp':
        deploymentResult = await this.deployToGCP(deployment, modelInfo, options);
        break;
      case 'local':
        deploymentResult = await this.deployLocally(deployment, modelInfo, options);
        break;
      default:
        throw new Error(`Deployment provider ${provider} not available`);
    }

    // Wait for deployment to be ready
    await this.waitForDeploymentReady(deploymentResult.endpointUrl);
    
    // Run post-deployment tests
    await this.runPostDeploymentTests(deployment, deploymentResult);

    return deploymentResult;
  }

  selectDeploymentProvider(environment) {
    // Priority: AWS > Azure > GCP > Local
    if (this.deploymentConfig.providers.aws.enabled) return 'aws';
    if (this.deploymentConfig.providers.azure.enabled) return 'azure';
    if (this.deploymentConfig.providers.gcp.enabled) return 'gcp';
    if (this.deploymentConfig.providers.local.enabled) return 'local';
    
    throw new Error('No deployment providers available');
  }

  async deployToAWS(deployment, modelInfo, options) {
    console.log('☁️ Deploying to AWS SageMaker...');
    
    // This would integrate with AWS SDK to deploy to SageMaker
    // For now, we'll simulate the deployment
    
    const endpointName = `reddytalk-${deployment.modelVersionId.slice(0, 8)}-${deployment.environment}`;
    const endpointUrl = `https://${endpointName}.sagemaker.${this.deploymentConfig.providers.aws.region}.amazonaws.com/invocations`;
    
    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    
    return {
      success: true,
      endpointUrl,
      endpointName,
      provider: 'aws',
      region: this.deploymentConfig.providers.aws.region,
      instanceType: options.instanceType || 'ml.t2.medium',
      scalingConfig: {
        minInstances: 1,
        maxInstances: this.deploymentConfig.environments[deployment.environment].maxInstances
      }
    };
  }

  async deployToAzure(deployment, modelInfo, options) {
    console.log('☁️ Deploying to Azure ML...');
    throw new Error('Azure ML deployment not yet implemented');
  }

  async deployToGCP(deployment, modelInfo, options) {
    console.log('☁️ Deploying to Google Cloud AI Platform...');
    throw new Error('GCP deployment not yet implemented');
  }

  async deployLocally(deployment, modelInfo, options) {
    console.log('💻 Deploying locally...');
    
    const port = this.deploymentConfig.providers.local.port + this.activeDeployments.size;
    const endpointUrl = `http://localhost:${port}/predict`;
    
    // Simulate local deployment
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
    
    return {
      success: true,
      endpointUrl,
      provider: 'local',
      port,
      processId: process.pid // In real implementation, this would be the actual model server PID
    };
  }

  async waitForDeploymentReady(endpointUrl, maxWaitTime = 300000) {
    console.log(`⏳ Waiting for endpoint to be ready: ${endpointUrl}`);
    
    const startTime = Date.now();
    const checkInterval = 10000; // 10 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Try to ping the endpoint
        const isReady = await this.checkEndpointHealth(endpointUrl);
        if (isReady) {
          console.log(`✅ Endpoint is ready: ${endpointUrl}`);
          return true;
        }
      } catch (error) {
        console.log(`🔄 Endpoint not ready yet, waiting... (${Math.floor((Date.now() - startTime) / 1000)}s)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    throw new Error(`Endpoint did not become ready within ${maxWaitTime / 1000}s`);
  }

  async checkEndpointHealth(endpointUrl) {
    try {
      // For local deployments, just return true (simulated)
      if (endpointUrl.includes('localhost')) {
        return true;
      }
      
      // For cloud deployments, make actual health check
      const response = await axios.get(`${endpointUrl}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async runPostDeploymentTests(deployment, deploymentResult) {
    console.log('🧪 Running post-deployment tests...');
    
    const testCases = [
      { input: 'Hello, I need to schedule an appointment', expectedType: 'scheduling' },
      { input: 'I have chest pain and trouble breathing', expectedType: 'emergency' },
      { input: 'Can you check my insurance coverage?', expectedType: 'insurance' }
    ];
    
    let passedTests = 0;
    
    for (const testCase of testCases) {
      try {
        const response = await this.testEndpoint(deploymentResult.endpointUrl, testCase.input);
        if (response && response.length > 10) { // Basic response validation
          passedTests++;
        }
      } catch (error) {
        console.warn(`Test case failed: ${testCase.input}`);
      }
    }
    
    const successRate = passedTests / testCases.length;
    console.log(`📊 Post-deployment tests: ${passedTests}/${testCases.length} passed (${(successRate * 100).toFixed(1)}%)`);
    
    if (successRate < 0.8) {
      throw new Error(`Post-deployment tests failed: ${(successRate * 100).toFixed(1)}% success rate`);
    }
  }

  async testEndpoint(endpointUrl, input) {
    try {
      // For local/simulated endpoints, return a mock response
      if (endpointUrl.includes('localhost')) {
        return `I understand you want to ${input.toLowerCase()}. I'm here to help you with that.`;
      }
      
      // For real endpoints, make actual API call
      const response = await axios.post(endpointUrl, {
        input,
        max_tokens: 150,
        temperature: 0.7
      }, { timeout: 10000 });
      
      return response.data.response || response.data.text || '';
    } catch (error) {
      throw new Error(`Endpoint test failed: ${error.message}`);
    }
  }

  async updateDeploymentStatus(deploymentId, status, deploymentResult = {}) {
    await this.db.query(`
      UPDATE model_deployments 
      SET 
        status = $1,
        endpoint_url = $2,
        instance_type = $3,
        scaling_config = $4,
        updated_at = NOW()
      WHERE id = $5
    `, [
      status,
      deploymentResult.endpointUrl || null,
      deploymentResult.instanceType || null,
      JSON.stringify(deploymentResult.scalingConfig || {}),
      deploymentId
    ]);
  }

  startDeploymentMonitoring(deploymentId) {
    console.log(`📊 Starting monitoring for deployment ${deploymentId}`);
    
    const monitoringInterval = setInterval(async () => {
      try {
        await this.collectDeploymentMetrics(deploymentId);
      } catch (error) {
        console.error(`Monitoring error for deployment ${deploymentId}:`, error);
      }
    }, this.monitoring.metricsCollectionInterval);

    // Store monitoring interval for cleanup
    this.activeDeployments.get(deploymentId).monitoringInterval = monitoringInterval;
  }

  async collectDeploymentMetrics(deploymentId) {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) return;

    // Simulate metrics collection
    const metrics = {
      responseTime: 800 + Math.random() * 400, // 800-1200ms
      errorRate: Math.random() * 0.02, // 0-2%
      throughput: 50 + Math.random() * 100, // 50-150 requests/min
      cpuUsage: 0.3 + Math.random() * 0.4, // 30-70%
      memoryUsage: 0.4 + Math.random() * 0.3 // 40-70%
    };

    // Store metrics
    for (const [metricName, value] of Object.entries(metrics)) {
      await this.db.query(`
        INSERT INTO deployment_metrics (deployment_id, metric_name, metric_value)
        VALUES ($1, $2, $3)
      `, [deploymentId, metricName, value]);
    }

    // Check for alerts
    await this.checkMetricAlerts(deploymentId, metrics);
  }

  async checkMetricAlerts(deploymentId, metrics) {
    const thresholds = this.monitoring.alertThresholds;
    const alerts = [];

    if (metrics.responseTime > thresholds.responseTime) {
      alerts.push(`High response time: ${metrics.responseTime.toFixed(0)}ms`);
    }

    if (metrics.errorRate > thresholds.errorRate) {
      alerts.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    }

    if (metrics.throughput < thresholds.throughput) {
      alerts.push(`Low throughput: ${metrics.throughput.toFixed(0)} requests/min`);
    }

    if (alerts.length > 0) {
      console.warn(`🚨 Deployment ${deploymentId} alerts:`, alerts);
      
      this.wsService.broadcast('deployment-alert', {
        deploymentId,
        alerts,
        metrics
      });

      // Check if auto-rollback should be triggered
      const deployment = this.activeDeployments.get(deploymentId);
      if (deployment && this.deploymentConfig.environments[deployment.environment].autoRollback) {
        const shouldRollback = metrics.errorRate > 0.1 || metrics.responseTime > 5000;
        if (shouldRollback) {
          console.warn(`⚠️ Triggering auto-rollback for deployment ${deploymentId}`);
          await this.rollbackDeployment(deploymentId, 'Automatic rollback due to performance issues');
        }
      }
    }
  }

  startPerformanceMonitoring() {
    console.log('📈 Starting global performance monitoring...');
    
    setInterval(async () => {
      try {
        await this.generatePerformanceReports();
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, 300000); // 5 minutes
  }

  async generatePerformanceReports() {
    // Generate performance summaries for all active deployments
    for (const [deploymentId, deployment] of this.activeDeployments) {
      const metrics = await this.getRecentMetrics(deploymentId);
      
      if (metrics.length > 0) {
        const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
        const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
        
        console.log(`📊 Deployment ${deploymentId} (${deployment.environment}): ` +
                   `${avgResponseTime.toFixed(0)}ms avg response, ` +
                   `${(avgErrorRate * 100).toFixed(2)}% error rate`);
      }
    }
  }

  async getRecentMetrics(deploymentId, hours = 1) {
    const result = await this.db.query(`
      SELECT metric_name, AVG(metric_value) as avg_value
      FROM deployment_metrics 
      WHERE deployment_id = $1 
        AND recorded_at > NOW() - INTERVAL '${hours} hours'
      GROUP BY metric_name
    `, [deploymentId]);

    const metrics = {};
    result.rows.forEach(row => {
      metrics[row.metric_name] = parseFloat(row.avg_value);
    });

    return [metrics]; // Return as array for consistency
  }

  async rollbackDeployment(deploymentId, reason = 'Manual rollback') {
    console.log(`⏪ Rolling back deployment ${deploymentId}: ${reason}`);
    
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    try {
      // Stop monitoring
      if (deployment.monitoringInterval) {
        clearInterval(deployment.monitoringInterval);
      }

      // Update deployment status
      await this.updateDeploymentStatus(deploymentId, 'rolled_back');
      
      // Update database record
      await this.db.query(`
        UPDATE model_deployments 
        SET 
          status = 'rolled_back',
          undeployed_at = NOW(),
          rollback_reason = $1
        WHERE id = $2
      `, [reason, deploymentId]);

      // Remove from active deployments
      this.activeDeployments.delete(deploymentId);

      // Broadcast rollback event
      this.wsService.broadcast('deployment-rolled-back', {
        deploymentId,
        reason,
        environment: deployment.environment
      });

      console.log(`✅ Deployment ${deploymentId} rolled back successfully`);
      this.emit('deployment-rolled-back', { deploymentId, reason });

      return { success: true, message: 'Deployment rolled back successfully' };

    } catch (error) {
      console.error(`❌ Rollback failed for deployment ${deploymentId}:`, error);
      throw error;
    }
  }

  async requestProductionApproval(modelVersionId, requestedBy) {
    const result = await this.db.query(`
      INSERT INTO deployment_approvals (
        model_version_id, requested_by, approval_status
      ) VALUES ($1, $2, 'pending')
      RETURNING id
    `, [modelVersionId, requestedBy]);

    const approvalId = result.rows[0].id;

    // Notify administrators
    this.wsService.broadcast('deployment-approval-requested', {
      approvalId,
      modelVersionId,
      requestedBy,
      environment: 'production'
    });

    return { approvalId, status: 'pending' };
  }

  async approveProductionDeployment(approvalId, approvedBy, notes = '') {
    await this.db.query(`
      UPDATE deployment_approvals 
      SET 
        approval_status = 'approved',
        approved_by = $1,
        approved_at = NOW(),
        approval_notes = $2
      WHERE id = $3
    `, [approvedBy, notes, approvalId]);

    this.wsService.broadcast('deployment-approved', {
      approvalId,
      approvedBy
    });

    return { success: true, message: 'Deployment approved' };
  }

  async checkApprovalStatus(modelVersionId, environment) {
    if (environment !== 'production') return 'approved';

    const result = await this.db.query(`
      SELECT approval_status 
      FROM deployment_approvals 
      WHERE model_version_id = $1 
        AND approval_status = 'approved'
      ORDER BY approved_at DESC 
      LIMIT 1
    `, [modelVersionId]);

    return result.rows.length > 0 ? result.rows[0].approval_status : 'pending';
  }

  async getDeploymentStatus(deploymentId) {
    const result = await this.db.query(`
      SELECT 
        md.*,
        mv.version as model_version,
        u.first_name, u.last_name
      FROM model_deployments md
      JOIN model_versions mv ON md.model_version_id = mv.id
      LEFT JOIN users u ON md.deployed_by = u.id
      WHERE md.id = $1
    `, [deploymentId]);

    if (result.rows.length === 0) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const deployment = result.rows[0];
    
    // Get recent metrics
    const metrics = await this.getRecentMetrics(deploymentId);
    
    return {
      ...deployment,
      recentMetrics: metrics[0] || {},
      isMonitored: this.activeDeployments.has(deploymentId)
    };
  }

  async listDeployments(environment = null, limit = 50) {
    let query = `
      SELECT 
        md.id, md.deployment_type, md.status, md.deployed_at,
        md.endpoint_url, md.undeployed_at,
        mv.version as model_version,
        u.first_name, u.last_name
      FROM model_deployments md
      JOIN model_versions mv ON md.model_version_id = mv.id
      LEFT JOIN users u ON md.deployed_by = u.id
    `;
    
    const params = [];
    
    if (environment) {
      query += ` WHERE md.deployment_type = $1`;
      params.push(environment);
    }
    
    query += ` ORDER BY md.deployed_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async healthCheck() {
    const activeCount = this.activeDeployments.size;
    const totalDeployments = await this.getTotalDeploymentCount();
    
    return {
      service: 'ModelDeploymentService',
      status: 'healthy',
      isDeploying: this.isDeploying,
      activeDeployments: activeCount,
      totalDeployments,
      availableEnvironments: Object.keys(this.deploymentConfig.environments).filter(env => 
        this.deploymentConfig.environments[env].enabled
      ),
      availableProviders: Object.keys(this.deploymentConfig.providers).filter(provider =>
        this.deploymentConfig.providers[provider].enabled
      ),
      timestamp: new Date().toISOString()
    };
  }

  async getTotalDeploymentCount() {
    const result = await this.db.query('SELECT COUNT(*) as count FROM model_deployments');
    return parseInt(result.rows[0].count);
  }
}

module.exports = ModelDeploymentService;