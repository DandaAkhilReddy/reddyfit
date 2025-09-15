// DatabaseService.js - Enterprise-grade database service with connection pooling
// Principal DBA-level implementation with 100,000 years of experience

const { Pool } = require('pg');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class DatabaseService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      host: config.host || process.env.DB_HOST || 'reddytalk-db.postgres.database.azure.com',
      port: config.port || process.env.DB_PORT || 5432,
      database: config.database || process.env.DB_NAME || 'reddytalk',
      user: config.user || process.env.DB_USER || 'reddytalkadmin',
      password: config.password || process.env.DB_PASSWORD || 'ReddyTalk2025!',
      ssl: config.ssl !== false, // Enable SSL by default for Azure
      
      // Connection pool configuration
      max: config.max || 20, // Maximum connections
      idleTimeoutMillis: config.idleTimeout || 30000,
      connectionTimeoutMillis: config.connectionTimeout || 10000,
      
      // Azure-specific configurations
      sslmode: 'require',
      application_name: 'ReddyTalk-AI-System'
    };
    
    this.pool = null;
    this.isInitialized = false;
    this.healthCheck = {
      isHealthy: false,
      lastCheck: null,
      latency: null,
      activeConnections: 0,
      error: null
    };
    
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      connectionErrors: 0
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Enterprise Database Service...');
      
      // Create connection pool with enterprise-grade settings
      this.pool = new Pool({
        ...this.config,
        // Advanced pool settings for high-performance
        statement_timeout: 30000,
        query_timeout: 25000,
        idle_in_transaction_session_timeout: 60000,
      });
      
      // Set up pool event handlers
      this.pool.on('connect', (client) => {
        console.log('✅ New database connection established');
        client.query('SET timezone = "UTC"');
        this.emit('connectionEstablished', { client });
      });
      
      this.pool.on('error', (err, client) => {
        console.error('❌ Database pool error:', err);
        this.metrics.connectionErrors++;
        this.emit('error', err);
      });
      
      // Test connection and create database if not exists
      await this.createDatabaseIfNotExists();
      await this.runHealthCheck();
      await this.initializeSchema();
      
      this.isInitialized = true;
      console.log('✅ Database Service initialized successfully');
      this.emit('initialized');
      
      // Start periodic health checks
      this.startHealthCheckMonitoring();
      
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async createDatabaseIfNotExists() {
    try {
      // Connect to default database to create our database
      const defaultConfig = { ...this.config, database: 'postgres' };
      const tempPool = new Pool(defaultConfig);
      
      const createDbQuery = `
        SELECT 1 FROM pg_database WHERE datname = $1
      `;
      
      const result = await tempPool.query(createDbQuery, [this.config.database]);
      
      if (result.rows.length === 0) {
        console.log(`📦 Creating database: ${this.config.database}`);
        await tempPool.query(`CREATE DATABASE "${this.config.database}"`);
        console.log('✅ Database created successfully');
      } else {
        console.log('✅ Database already exists');
      }
      
      await tempPool.end();
    } catch (error) {
      console.error('❌ Error creating database:', error);
      throw error;
    }
  }

  async initializeSchema() {
    try {
      console.log('📋 Initializing database schema...');
      
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schemaSQL = await fs.readFile(schemaPath, 'utf8');
      
      // Split schema into individual statements
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        try {
          await this.pool.query(statement);
        } catch (error) {
          // Ignore already exists errors
          if (!error.message.includes('already exists')) {
            console.warn('⚠️ Schema statement warning:', error.message);
          }
        }
      }
      
      console.log('✅ Schema initialized successfully');
    } catch (error) {
      console.error('❌ Schema initialization failed:', error);
      throw error;
    }
  }

  async runHealthCheck() {
    const startTime = Date.now();
    
    try {
      const result = await this.pool.query('SELECT NOW() as current_time, version() as db_version');
      const latency = Date.now() - startTime;
      
      this.healthCheck = {
        isHealthy: true,
        lastCheck: new Date(),
        latency: latency,
        activeConnections: this.pool.totalCount || 0,
        error: null,
        dbVersion: result.rows[0].db_version,
        currentTime: result.rows[0].current_time
      };
      
      this.emit('healthCheck', this.healthCheck);
      return this.healthCheck;
    } catch (error) {
      this.healthCheck = {
        isHealthy: false,
        lastCheck: new Date(),
        latency: null,
        activeConnections: 0,
        error: error.message
      };
      
      this.emit('healthCheckFailed', this.healthCheck);
      throw error;
    }
  }

  startHealthCheckMonitoring() {
    // Run health check every 30 seconds
    setInterval(async () => {
      try {
        await this.runHealthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, 30000);
  }

  // ============ CONVERSATION MANAGEMENT ============

  async createConversation(sessionId, callerInfo = {}) {
    const query = `
      INSERT INTO conversations (session_id, caller_phone, caller_name, caller_insurance, start_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      sessionId,
      callerInfo.phone || null,
      callerInfo.name || null,
      callerInfo.insurance || null,
      new Date()
    ];
    
    return this.queryWithMetrics(query, values);
  }

  async updateConversation(conversationId, updates) {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE conversations 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [conversationId, ...Object.values(updates)];
    return this.queryWithMetrics(query, values);
  }

  async addMessage(conversationId, messageData) {
    const query = `
      INSERT INTO conversation_messages 
      (conversation_id, message_type, content, confidence_score, timestamp_offset, intent, entities, sentiment, emotion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      conversationId,
      messageData.type || 'user',
      messageData.content,
      messageData.confidence || null,
      messageData.timestampOffset || 0,
      messageData.intent || null,
      JSON.stringify(messageData.entities || {}),
      messageData.sentiment || null,
      messageData.emotion || null
    ];
    
    return this.queryWithMetrics(query, values);
  }

  async getActiveConversations() {
    const query = `
      SELECT * FROM active_conversations
      ORDER BY start_time DESC
    `;
    
    return this.queryWithMetrics(query);
  }

  async getConversationHistory(conversationId) {
    const query = `
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'id', cm.id,
            'type', cm.message_type,
            'content', cm.content,
            'confidence', cm.confidence_score,
            'timestamp', cm.processed_at,
            'intent', cm.intent,
            'sentiment', cm.sentiment
          ) ORDER BY cm.processed_at
        ) as messages
      FROM conversations c
      LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    return this.queryWithMetrics(query, [conversationId]);
  }

  // ============ APPOINTMENT MANAGEMENT ============

  async createAppointment(appointmentData) {
    const query = `
      INSERT INTO appointments 
      (conversation_id, doctor_id, patient_name, patient_phone, patient_dob, 
       patient_insurance, appointment_date, appointment_type, duration_minutes, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      appointmentData.conversationId,
      appointmentData.doctorId,
      appointmentData.patientName,
      appointmentData.patientPhone,
      appointmentData.patientDob,
      appointmentData.patientInsurance,
      appointmentData.appointmentDate,
      appointmentData.appointmentType || 'consultation',
      appointmentData.durationMinutes || 30,
      appointmentData.notes || null
    ];
    
    return this.queryWithMetrics(query, values);
  }

  async getAvailableDoctors(specialty = null, language = null) {
    let query = `
      SELECT * FROM doctors 
      WHERE is_active = true
    `;
    const values = [];
    
    if (specialty) {
      query += ` AND specialty ILIKE $${values.length + 1}`;
      values.push(`%${specialty}%`);
    }
    
    if (language) {
      query += ` AND $${values.length + 1} = ANY(languages)`;
      values.push(language);
    }
    
    query += ` ORDER BY name`;
    
    return this.queryWithMetrics(query, values);
  }

  // ============ ANALYTICS AND REPORTING ============

  async getDailyMetrics(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT * FROM daily_call_stats 
      WHERE call_date = $1
    `;
    
    return this.queryWithMetrics(query, [targetDate]);
  }

  async getSystemHealth() {
    const query = `
      SELECT 
        service_name,
        status,
        response_time_ms,
        uptime_percentage,
        last_error_message,
        checked_at
      FROM system_status 
      WHERE checked_at > NOW() - INTERVAL '1 hour'
      ORDER BY checked_at DESC
    `;
    
    return this.queryWithMetrics(query);
  }

  async recordSystemStatus(serviceName, status, responseTime, errorMessage = null) {
    const query = `
      INSERT INTO system_status 
      (service_name, status, response_time_ms, error_count, last_error_message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      serviceName,
      status,
      responseTime,
      errorMessage ? 1 : 0,
      errorMessage
    ];
    
    return this.queryWithMetrics(query, values);
  }

  // ============ ADVANCED QUERY METHODS ============

  async queryWithMetrics(query, values = []) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalQueries++;
      const result = await this.pool.query(query, values);
      
      const queryTime = Date.now() - startTime;
      this.metrics.successfulQueries++;
      this.metrics.averageQueryTime = 
        (this.metrics.averageQueryTime + queryTime) / 2;
      
      this.emit('querySuccess', {
        query: query.substring(0, 100) + '...',
        duration: queryTime,
        rowCount: result.rows.length
      });
      
      return result;
    } catch (error) {
      this.metrics.failedQueries++;
      this.emit('queryError', {
        query: query.substring(0, 100) + '...',
        error: error.message,
        duration: Date.now() - startTime
      });
      
      console.error('❌ Database query failed:', error);
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============ UTILITY METHODS ============

  getMetrics() {
    return {
      ...this.metrics,
      healthCheck: this.healthCheck,
      poolStats: {
        totalCount: this.pool?.totalCount || 0,
        idleCount: this.pool?.idleCount || 0,
        waitingCount: this.pool?.waitingCount || 0
      }
    };
  }

  async close() {
    if (this.pool) {
      console.log('🔌 Closing database connections...');
      await this.pool.end();
      this.isInitialized = false;
      console.log('✅ Database connections closed');
    }
  }

  // ============ REAL-TIME LIVE TRANSCRIPTION SUPPORT ============

  async getLiveConversationData(sessionId) {
    const query = `
      SELECT 
        c.id,
        c.session_id,
        c.caller_name,
        c.caller_phone,
        c.start_time,
        c.status,
        c.intent,
        COUNT(cm.id) as message_count,
        MAX(cm.processed_at) as last_activity,
        json_agg(
          json_build_object(
            'type', cm.message_type,
            'content', cm.content,
            'timestamp', cm.processed_at,
            'confidence', cm.confidence_score,
            'sentiment', cm.sentiment
          ) ORDER BY cm.processed_at DESC
        ) FILTER (WHERE cm.id IS NOT NULL) as recent_messages
      FROM conversations c
      LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
      WHERE c.session_id = $1
      GROUP BY c.id
    `;
    
    return this.queryWithMetrics(query, [sessionId]);
  }

  async streamConversationUpdates(callback) {
    // PostgreSQL LISTEN/NOTIFY for real-time updates
    const client = await this.pool.connect();
    
    await client.query('LISTEN conversation_updates');
    await client.query('LISTEN message_updates');
    
    client.on('notification', (msg) => {
      try {
        const data = JSON.parse(msg.payload);
        callback(msg.channel, data);
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    });
    
    return client;
  }
}

module.exports = DatabaseService;