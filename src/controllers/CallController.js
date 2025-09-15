// Call Management API Controller
const CallRecordingService = require('../services/calls/CallRecordingService');
const LiveTranscriptService = require('../services/calls/LiveTranscriptService');
const DatabaseService = require('../services/database/DatabaseService');
const WebSocketService = require('../services/realtime/WebSocketService');
const { body, validationResult, param, query } = require('express-validator');

class CallController {
  constructor() {
    this.recordingService = new CallRecordingService();
    this.transcriptService = new LiveTranscriptService();
    this.db = new DatabaseService();
    this.wsService = new WebSocketService();
  }

  async initialize() {
    await this.recordingService.initialize();
    await this.transcriptService.initialize();
    await this.db.initialize();
    console.log('📞 CallController initialized');
  }

  // =============================================
  // VALIDATION RULES
  // =============================================

  getCreateCallValidation() {
    return [
      body('phoneNumberFrom').isMobilePhone().withMessage('Valid phone number required'),
      body('phoneNumberTo').isMobilePhone().withMessage('Valid phone number required'),
      body('direction').isIn(['inbound', 'outbound']).withMessage('Valid direction required'),
      body('patientId').optional().isUUID().withMessage('Valid patient ID required')
    ];
  }

  // =============================================
  // CALL SESSION MANAGEMENT
  // =============================================

  /**
   * Create new call session
   * POST /api/calls
   */
  createCall = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        callId,
        phoneNumberFrom,
        phoneNumberTo,
        direction,
        patientId,
        userId,
        aiAgentVersion = '2.0'
      } = req.body;

      // Create call session in database
      const result = await this.db.query(`
        INSERT INTO call_sessions (
          call_id, patient_id, user_id, phone_number_from, phone_number_to,
          direction, started_at, status, ai_agent_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, call_id, started_at, status
      `, [
        callId || `CALL_${Date.now()}`,
        patientId || null,
        userId || req.user?.id || null,
        phoneNumberFrom,
        phoneNumberTo,
        direction,
        new Date(),
        'active',
        aiAgentVersion
      ]);

      const callSession = result.rows[0];

      // Broadcast call started event
      this.wsService.broadcast('call-started', {
        callSessionId: callSession.id,
        callId: callSession.call_id,
        direction,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: 'Call session created successfully',
        data: {
          sessionId: callSession.id,
          callId: callSession.call_id,
          startedAt: callSession.started_at,
          status: callSession.status
        }
      });

    } catch (error) {
      console.error('Create call error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'CALL_CREATION_FAILED'
      });
    }
  };

  /**
   * End call session
   * POST /api/calls/:sessionId/end
   */
  endCall = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { duration, reason = 'completed' } = req.body;

      // Update call session
      const result = await this.db.query(`
        UPDATE call_sessions 
        SET 
          ended_at = NOW(),
          duration_seconds = $1,
          status = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, call_id, started_at, ended_at, duration_seconds, status
      `, [duration, reason, sessionId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Call session not found'
        });
      }

      const callSession = result.rows[0];

      // Stop recording if active
      try {
        await this.recordingService.stopRecording(sessionId);
      } catch (error) {
        console.warn('Failed to stop recording:', error.message);
      }

      // Stop transcription if active
      try {
        await this.transcriptService.stopTranscription(sessionId);
      } catch (error) {
        console.warn('Failed to stop transcription:', error.message);
      }

      // Broadcast call ended event
      this.wsService.broadcast('call-ended', {
        callSessionId: sessionId,
        status: 'completed',
        duration: duration
      });

      res.json({
        success: true,
        message: 'Call ended successfully',
        data: {
          sessionId: callSession.id,
          callId: callSession.call_id,
          duration: callSession.duration_seconds,
          status: callSession.status
        }
      });

    } catch (error) {
      console.error('End call error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'CALL_END_FAILED'
      });
    }
  };

  /**
   * Get call details
   * GET /api/calls/:sessionId
   */
  getCall = async (req, res) => {
    try {
      const { sessionId } = req.params;

      const result = await this.db.query(`
        SELECT 
          cs.*,
          p.patient_id,
          u.first_name as user_first_name,
          u.last_name as user_last_name
        FROM call_sessions cs
        LEFT JOIN patients p ON cs.patient_id = p.id
        LEFT JOIN users u ON cs.user_id = u.id
        WHERE cs.id = $1
      `, [sessionId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Call session not found'
        });
      }

      const callSession = result.rows[0];

      // Get transcript summary
      const transcriptResult = await this.db.query(`
        SELECT 
          COUNT(*) as segment_count,
          AVG(confidence_score) as avg_confidence,
          COUNT(*) FILTER (WHERE urgency_level IN ('high', 'critical')) as urgent_segments,
          array_agg(DISTINCT urgency_level) as urgency_levels
        FROM call_transcripts
        WHERE call_session_id = $1
      `, [sessionId]);

      const transcriptSummary = transcriptResult.rows[0];

      res.json({
        success: true,
        data: {
          id: callSession.id,
          callId: callSession.call_id,
          patientId: callSession.patient_id,
          phoneNumberFrom: callSession.phone_number_from,
          phoneNumberTo: callSession.phone_number_to,
          direction: callSession.direction,
          startedAt: callSession.started_at,
          endedAt: callSession.ended_at,
          duration: callSession.duration_seconds,
          status: callSession.status,
          aiAgentVersion: callSession.ai_agent_version,
          conversationSummary: callSession.conversation_summary,
          sentimentAnalysis: callSession.sentiment_analysis,
          aiPerformanceScore: callSession.ai_performance_score,
          patientSatisfactionScore: callSession.patient_satisfaction_score,
          recordingUrl: callSession.recording_url,
          recordingDuration: callSession.recording_duration,
          transcript: {
            segmentCount: parseInt(transcriptSummary.segment_count || 0),
            avgConfidence: parseFloat(transcriptSummary.avg_confidence || 0),
            urgentSegments: parseInt(transcriptSummary.urgent_segments || 0),
            urgencyLevels: transcriptSummary.urgency_levels || []
          },
          user: callSession.user_first_name ? {
            firstName: callSession.user_first_name,
            lastName: callSession.user_last_name
          } : null
        }
      });

    } catch (error) {
      console.error('Get call error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve call details',
        code: 'CALL_RETRIEVAL_FAILED'
      });
    }
  };

  /**
   * List calls with filtering
   * GET /api/calls
   */
  listCalls = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        direction,
        patientId,
        dateFrom,
        dateTo,
        minDuration,
        maxDuration
      } = req.query;

      let whereClause = 'WHERE 1=1';
      const queryParams = [];
      let paramIndex = 1;

      // Add filters
      if (status) {
        whereClause += ` AND cs.status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
      }

      if (direction) {
        whereClause += ` AND cs.direction = $${paramIndex}`;
        queryParams.push(direction);
        paramIndex++;
      }

      if (patientId) {
        whereClause += ` AND p.patient_id = $${paramIndex}`;
        queryParams.push(patientId);
        paramIndex++;
      }

      if (dateFrom) {
        whereClause += ` AND cs.started_at >= $${paramIndex}`;
        queryParams.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        whereClause += ` AND cs.started_at <= $${paramIndex}`;
        queryParams.push(dateTo);
        paramIndex++;
      }

      if (minDuration) {
        whereClause += ` AND cs.duration_seconds >= $${paramIndex}`;
        queryParams.push(parseInt(minDuration));
        paramIndex++;
      }

      if (maxDuration) {
        whereClause += ` AND cs.duration_seconds <= $${paramIndex}`;
        queryParams.push(parseInt(maxDuration));
        paramIndex++;
      }

      // Get calls
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const result = await this.db.query(`
        SELECT 
          cs.id, cs.call_id, cs.phone_number_from, cs.phone_number_to,
          cs.direction, cs.started_at, cs.ended_at, cs.duration_seconds,
          cs.status, cs.ai_performance_score, cs.patient_satisfaction_score,
          p.patient_id,
          u.first_name as user_first_name, u.last_name as user_last_name
        FROM call_sessions cs
        LEFT JOIN patients p ON cs.patient_id = p.id
        LEFT JOIN users u ON cs.user_id = u.id
        ${whereClause}
        ORDER BY cs.started_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, parseInt(limit), offset]);

      // Get total count
      const countResult = await this.db.query(`
        SELECT COUNT(*) as total
        FROM call_sessions cs
        LEFT JOIN patients p ON cs.patient_id = p.id
        ${whereClause}
      `, queryParams);

      const totalCalls = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          calls: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCalls,
            pages: Math.ceil(totalCalls / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('List calls error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve calls',
        code: 'CALLS_LIST_FAILED'
      });
    }
  };

  // =============================================
  // CALL RECORDING ENDPOINTS
  // =============================================

  /**
   * Start call recording
   * POST /api/calls/:sessionId/recording/start
   */
  startRecording = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { audioStreamUrl, metadata = {} } = req.body;

      // In a real implementation, you'd get the audio stream from the call service
      // For now, we'll simulate the recording start
      const result = await this.recordingService.startRecording(
        sessionId,
        null, // audioStream would be passed here
        metadata
      );

      res.json({
        success: true,
        message: 'Recording started successfully',
        data: {
          recordingId: result.recordingId,
          sessionId
        }
      });

    } catch (error) {
      console.error('Start recording error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'RECORDING_START_FAILED'
      });
    }
  };

  /**
   * Stop call recording
   * POST /api/calls/:sessionId/recording/stop
   */
  stopRecording = async (req, res) => {
    try {
      const { sessionId } = req.params;

      const result = await this.recordingService.stopRecording(sessionId);

      res.json({
        success: true,
        message: 'Recording stopped successfully',
        data: {
          recordingId: result.recordingId,
          duration: result.duration,
          url: result.url
        }
      });

    } catch (error) {
      console.error('Stop recording error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'RECORDING_STOP_FAILED'
      });
    }
  };

  /**
   * Get call recording
   * GET /api/calls/:sessionId/recording
   */
  getRecording = async (req, res) => {
    try {
      const { sessionId } = req.params;

      const recording = await this.recordingService.getRecording(sessionId);

      res.json({
        success: true,
        data: {
          recordingUrl: recording.recording_url,
          playbackUrl: recording.playback_url,
          duration: recording.recording_duration,
          startedAt: recording.recording_started_at,
          completedAt: recording.recording_completed_at
        }
      });

    } catch (error) {
      console.error('Get recording error:', error);
      const statusCode = error.message === 'Recording not found' ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: 'RECORDING_RETRIEVAL_FAILED'
      });
    }
  };

  /**
   * Stream call recording
   * GET /api/calls/:sessionId/recording/stream
   */
  streamRecording = async (req, res) => {
    try {
      const { sessionId } = req.params;

      const stream = await this.recordingService.getRecordingStream(sessionId);

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Disposition', `inline; filename="call_${sessionId}.wav"`);
      
      stream.pipe(res);

    } catch (error) {
      console.error('Stream recording error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'RECORDING_STREAM_FAILED'
      });
    }
  };

  // =============================================
  // LIVE TRANSCRIPTION ENDPOINTS
  // =============================================

  /**
   * Start live transcription
   * POST /api/calls/:sessionId/transcription/start
   */
  startTranscription = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { language = 'en-US', options = {} } = req.body;

      // In a real implementation, you'd get the audio stream from the call service
      const result = await this.transcriptService.startTranscription(
        sessionId,
        null, // audioStream would be passed here
        { language, ...options }
      );

      res.json({
        success: true,
        message: 'Live transcription started successfully',
        data: {
          sessionId: result.sessionId,
          language
        }
      });

    } catch (error) {
      console.error('Start transcription error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'TRANSCRIPTION_START_FAILED'
      });
    }
  };

  /**
   * Stop live transcription
   * POST /api/calls/:sessionId/transcription/stop
   */
  stopTranscription = async (req, res) => {
    try {
      const { sessionId } = req.params;

      const result = await this.transcriptService.stopTranscription(sessionId);

      res.json({
        success: true,
        message: 'Transcription completed successfully',
        data: {
          totalSegments: result.totalSegments,
          summary: result.summary
        }
      });

    } catch (error) {
      console.error('Stop transcription error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'TRANSCRIPTION_STOP_FAILED'
      });
    }
  };

  /**
   * Get call transcript
   * GET /api/calls/:sessionId/transcript
   */
  getTranscript = async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { format = 'json', includeTimestamps = true } = req.query;

      const result = await this.db.query(`
        SELECT 
          sequence_number, speaker, text_content, confidence_score,
          start_time_ms, end_time_ms, medical_entities, symptoms_detected,
          urgency_level, created_at
        FROM call_transcripts
        WHERE call_session_id = $1
        ORDER BY sequence_number
      `, [sessionId]);

      const transcripts = result.rows.map(row => ({
        sequenceNumber: row.sequence_number,
        speaker: row.speaker,
        text: row.text_content,
        confidence: row.confidence_score,
        ...(includeTimestamps === 'true' && {
          startTime: row.start_time_ms,
          endTime: row.end_time_ms
        }),
        medicalEntities: JSON.parse(row.medical_entities || '[]'),
        symptoms: JSON.parse(row.symptoms_detected || '[]'),
        urgencyLevel: row.urgency_level,
        timestamp: row.created_at
      }));

      if (format === 'text') {
        // Return as plain text
        const textTranscript = transcripts.map(t => 
          `${t.speaker.toUpperCase()}: ${t.text}`
        ).join('\n\n');

        res.setHeader('Content-Type', 'text/plain');
        res.send(textTranscript);
      } else {
        // Return as JSON
        res.json({
          success: true,
          data: {
            sessionId,
            transcripts,
            totalSegments: transcripts.length
          }
        });
      }

    } catch (error) {
      console.error('Get transcript error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transcript',
        code: 'TRANSCRIPT_RETRIEVAL_FAILED'
      });
    }
  };

  // =============================================
  // REAL-TIME ENDPOINTS
  // =============================================

  /**
   * Get active calls
   * GET /api/calls/active
   */
  getActiveCalls = async (req, res) => {
    try {
      // Get active call sessions
      const result = await this.db.query(`
        SELECT 
          cs.id, cs.call_id, cs.phone_number_from, cs.phone_number_to,
          cs.direction, cs.started_at, cs.ai_agent_version,
          p.patient_id
        FROM call_sessions cs
        LEFT JOIN patients p ON cs.patient_id = p.id
        WHERE cs.status = 'active'
        ORDER BY cs.started_at DESC
      `);

      // Get active recordings
      const activeRecordings = await this.recordingService.getActiveRecordings();

      // Combine call and recording data
      const activeCalls = result.rows.map(call => ({
        ...call,
        isRecording: activeRecordings.some(rec => rec.callSessionId === call.id),
        duration: Math.floor((new Date() - new Date(call.started_at)) / 1000)
      }));

      res.json({
        success: true,
        data: {
          activeCalls,
          totalActive: activeCalls.length,
          recordingCount: activeRecordings.length
        }
      });

    } catch (error) {
      console.error('Get active calls error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve active calls',
        code: 'ACTIVE_CALLS_RETRIEVAL_FAILED'
      });
    }
  };

  /**
   * Health check
   * GET /api/calls/health
   */
  healthCheck = async (req, res) => {
    try {
      const recordingHealth = await this.recordingService.healthCheck();
      const transcriptHealth = await this.transcriptService.healthCheck();

      res.json({
        service: 'CallService',
        status: 'healthy',
        components: {
          recording: recordingHealth,
          transcription: transcriptHealth
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        service: 'CallService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
}

module.exports = CallController;