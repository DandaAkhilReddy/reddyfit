// Call Recording Service for ReddyTalk.ai
// Handles call recording, storage, and playback with HIPAA compliance

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const AWS = require('aws-sdk');
const DatabaseService = require('../database/DatabaseService');
const WebSocketService = require('../realtime/WebSocketService');

class CallRecordingService {
  constructor() {
    this.db = new DatabaseService();
    this.wsService = new WebSocketService();
    
    // Storage configuration
    this.localStoragePath = process.env.RECORDINGS_PATH || './storage/recordings';
    this.useCloudStorage = process.env.USE_CLOUD_STORAGE === 'true';
    
    // AWS S3 configuration for cloud storage
    if (this.useCloudStorage) {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      this.s3BucketName = process.env.S3_RECORDINGS_BUCKET || 'reddytalk-recordings';
    }
    
    // Recording settings
    this.audioFormat = 'wav';
    this.sampleRate = 16000; // 16kHz for speech recognition
    this.channels = 1; // Mono
    this.bitDepth = 16;
    
    // Active recordings tracking
    this.activeRecordings = new Map();
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🎙️ Initializing Call Recording Service...');
      
      await this.db.initialize();
      
      // Create local storage directory
      await this.ensureStorageDirectory();
      
      // Test cloud storage connection if enabled
      if (this.useCloudStorage) {
        await this.testCloudStorageConnection();
      }
      
      this.isInitialized = true;
      console.log('✅ Call Recording Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Call Recording Service:', error);
      throw error;
    }
  }

  // =============================================
  // CALL RECORDING MANAGEMENT
  // =============================================

  /**
   * Start recording a call
   */
  async startRecording(callSessionId, audioStream, metadata = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      console.log(`🎙️ Starting recording for call: ${callSessionId}`);
      
      // Generate recording ID
      const recordingId = uuidv4();
      const fileName = `${callSessionId}_${recordingId}.${this.audioFormat}`;
      const filePath = path.join(this.localStoragePath, fileName);
      
      // Create recording session
      const recordingSession = {
        recordingId,
        callSessionId,
        fileName,
        filePath,
        startTime: new Date(),
        metadata,
        chunks: [],
        isActive: true
      };
      
      // Store active recording
      this.activeRecordings.set(callSessionId, recordingSession);
      
      // Set up audio stream processing
      await this.setupAudioProcessing(recordingSession, audioStream);
      
      // Update call session in database
      await this.updateCallRecordingStatus(callSessionId, 'recording', {
        recording_id: recordingId,
        recording_started_at: new Date()
      });
      
      // Notify clients via WebSocket
      this.wsService.broadcast('call-recording-started', {
        callSessionId,
        recordingId,
        status: 'recording'
      });
      
      return {
        success: true,
        recordingId,
        message: 'Recording started successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording a call
   */
  async stopRecording(callSessionId) {
    try {
      const recordingSession = this.activeRecordings.get(callSessionId);
      
      if (!recordingSession) {
        throw new Error('No active recording found for this call');
      }
      
      console.log(`⏹️ Stopping recording for call: ${callSessionId}`);
      
      // Mark as inactive
      recordingSession.isActive = false;
      recordingSession.endTime = new Date();
      
      // Finalize audio file
      const finalizedFile = await this.finalizeRecording(recordingSession);
      
      // Upload to cloud storage if enabled
      let cloudUrl = null;
      if (this.useCloudStorage) {
        cloudUrl = await this.uploadToCloudStorage(finalizedFile);
      }
      
      // Calculate duration
      const duration = Math.round(
        (recordingSession.endTime - recordingSession.startTime) / 1000
      );
      
      // Update database
      await this.updateCallRecordingStatus(callSessionId, 'completed', {
        recording_url: cloudUrl || finalizedFile.filePath,
        recording_duration: duration,
        recording_completed_at: new Date(),
        file_size: finalizedFile.size
      });
      
      // Remove from active recordings
      this.activeRecordings.delete(callSessionId);
      
      // Notify clients
      this.wsService.broadcast('call-recording-completed', {
        callSessionId,
        recordingId: recordingSession.recordingId,
        duration,
        url: cloudUrl || finalizedFile.filePath,
        status: 'completed'
      });
      
      // Clean up local file if using cloud storage
      if (this.useCloudStorage && cloudUrl) {
        await this.cleanupLocalFile(finalizedFile.filePath);
      }
      
      return {
        success: true,
        recordingId: recordingSession.recordingId,
        duration,
        url: cloudUrl || finalizedFile.filePath,
        message: 'Recording completed successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Pause/Resume recording
   */
  async pauseRecording(callSessionId) {
    const recording = this.activeRecordings.get(callSessionId);
    if (recording) {
      recording.isPaused = true;
      console.log(`⏸️ Recording paused for call: ${callSessionId}`);
      
      this.wsService.broadcast('call-recording-paused', {
        callSessionId,
        status: 'paused'
      });
    }
  }

  async resumeRecording(callSessionId) {
    const recording = this.activeRecordings.get(callSessionId);
    if (recording) {
      recording.isPaused = false;
      console.log(`▶️ Recording resumed for call: ${callSessionId}`);
      
      this.wsService.broadcast('call-recording-resumed', {
        callSessionId,
        status: 'recording'
      });
    }
  }

  // =============================================
  // AUDIO PROCESSING
  // =============================================

  async setupAudioProcessing(recordingSession, audioStream) {
    return new Promise((resolve, reject) => {
      try {
        const writeStream = fs.createWriteStream(recordingSession.filePath);
        
        // Configure FFmpeg for audio processing
        const ffmpegProcess = ffmpeg(audioStream)
          .audioFrequency(this.sampleRate)
          .audioChannels(this.channels)
          .audioBitrate(this.bitDepth + 'k')
          .format(this.audioFormat)
          .on('start', (commandLine) => {
            console.log(`🔊 FFmpeg started: ${commandLine}`);
          })
          .on('error', (error) => {
            console.error('❌ FFmpeg error:', error);
            reject(error);
          })
          .on('end', () => {
            console.log('✅ Audio processing completed');
          });
        
        // Pipe to file
        ffmpegProcess.pipe(writeStream, { end: true });
        
        // Handle audio chunks for real-time processing
        audioStream.on('data', (chunk) => {
          if (!recordingSession.isPaused) {
            recordingSession.chunks.push({
              timestamp: Date.now(),
              size: chunk.length
            });
          }
        });
        
        recordingSession.ffmpegProcess = ffmpegProcess;
        recordingSession.writeStream = writeStream;
        
        resolve();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async finalizeRecording(recordingSession) {
    return new Promise(async (resolve, reject) => {
      try {
        // Close streams
        if (recordingSession.writeStream) {
          recordingSession.writeStream.end();
        }
        
        if (recordingSession.ffmpegProcess) {
          recordingSession.ffmpegProcess.kill('SIGTERM');
        }
        
        // Wait a bit for file to be fully written
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get file stats
        const stats = await fs.stat(recordingSession.filePath);
        
        // Optimize audio file
        const optimizedPath = await this.optimizeAudioFile(recordingSession.filePath);
        
        resolve({
          filePath: optimizedPath,
          size: stats.size,
          duration: recordingSession.endTime - recordingSession.startTime
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async optimizeAudioFile(originalPath) {
    return new Promise((resolve, reject) => {
      const optimizedPath = originalPath.replace(`.${this.audioFormat}`, `_optimized.${this.audioFormat}`);
      
      ffmpeg(originalPath)
        .audioFilters('highpass=f=80', 'lowpass=f=8000') // Remove noise
        .audioCodec('pcm_s16le')
        .on('end', () => {
          // Replace original with optimized
          fs.rename(optimizedPath, originalPath)
            .then(() => resolve(originalPath))
            .catch(reject);
        })
        .on('error', reject)
        .save(optimizedPath);
    });
  }

  // =============================================
  // CLOUD STORAGE OPERATIONS
  // =============================================

  async uploadToCloudStorage(fileInfo) {
    try {
      if (!this.useCloudStorage) {
        return null;
      }
      
      const fileContent = await fs.readFile(fileInfo.filePath);
      const fileName = path.basename(fileInfo.filePath);
      const s3Key = `recordings/${new Date().getFullYear()}/${fileName}`;
      
      const uploadParams = {
        Bucket: this.s3BucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: `audio/${this.audioFormat}`,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'uploaded-by': 'reddytalk-ai',
          'file-size': fileInfo.size.toString(),
          'duration': fileInfo.duration.toString()
        }
      };
      
      const uploadResult = await this.s3.upload(uploadParams).promise();
      console.log('☁️ Recording uploaded to cloud storage:', uploadResult.Location);
      
      return uploadResult.Location;
      
    } catch (error) {
      console.error('❌ Failed to upload to cloud storage:', error);
      throw error;
    }
  }

  async testCloudStorageConnection() {
    try {
      await this.s3.headBucket({ Bucket: this.s3BucketName }).promise();
      console.log('✅ Cloud storage connection verified');
    } catch (error) {
      console.warn('⚠️ Cloud storage connection failed:', error.message);
      this.useCloudStorage = false;
    }
  }

  // =============================================
  // DATABASE OPERATIONS
  // =============================================

  async updateCallRecordingStatus(callSessionId, status, data = {}) {
    try {
      const updateFields = {
        recording_status: status,
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
      console.error('❌ Failed to update recording status:', error);
    }
  }

  // =============================================
  // PLAYBACK & RETRIEVAL
  // =============================================

  async getRecording(callSessionId) {
    try {
      const result = await this.db.query(`
        SELECT 
          id, recording_url, recording_duration, 
          recording_started_at, recording_completed_at
        FROM call_sessions 
        WHERE id = $1
      `, [callSessionId]);
      
      if (result.rows.length === 0) {
        throw new Error('Recording not found');
      }
      
      const recording = result.rows[0];
      
      // Generate signed URL for cloud storage
      if (this.useCloudStorage && recording.recording_url.includes('amazonaws.com')) {
        const s3Key = recording.recording_url.split('.com/')[1];
        const signedUrl = await this.s3.getSignedUrlPromise('getObject', {
          Bucket: this.s3BucketName,
          Key: s3Key,
          Expires: 3600 // 1 hour
        });
        
        recording.playback_url = signedUrl;
      } else {
        recording.playback_url = recording.recording_url;
      }
      
      return recording;
      
    } catch (error) {
      console.error('❌ Failed to get recording:', error);
      throw error;
    }
  }

  async getRecordingStream(callSessionId) {
    try {
      const recording = await this.getRecording(callSessionId);
      
      if (this.useCloudStorage && recording.recording_url.includes('amazonaws.com')) {
        // Stream from S3
        const s3Key = recording.recording_url.split('.com/')[1];
        const s3Stream = this.s3.getObject({
          Bucket: this.s3BucketName,
          Key: s3Key
        }).createReadStream();
        
        return s3Stream;
      } else {
        // Stream from local file
        const fs = require('fs');
        return fs.createReadStream(recording.recording_url);
      }
      
    } catch (error) {
      console.error('❌ Failed to get recording stream:', error);
      throw error;
    }
  }

  // =============================================
  // UTILITIES
  // =============================================

  async ensureStorageDirectory() {
    try {
      await fs.access(this.localStoragePath);
    } catch (error) {
      await fs.mkdir(this.localStoragePath, { recursive: true });
      console.log(`📁 Created recordings directory: ${this.localStoragePath}`);
    }
  }

  async cleanupLocalFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Cleaned up local file: ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup local file: ${error.message}`);
    }
  }

  async getActiveRecordings() {
    return Array.from(this.activeRecordings.entries()).map(([callSessionId, session]) => ({
      callSessionId,
      recordingId: session.recordingId,
      startTime: session.startTime,
      isPaused: session.isPaused,
      isActive: session.isActive
    }));
  }

  async cleanupExpiredRecordings(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const result = await this.db.query(`
        SELECT recording_url 
        FROM call_sessions 
        WHERE recording_completed_at < $1 
        AND recording_url IS NOT NULL
      `, [cutoffDate]);
      
      let cleanedCount = 0;
      
      for (const row of result.rows) {
        try {
          if (this.useCloudStorage && row.recording_url.includes('amazonaws.com')) {
            const s3Key = row.recording_url.split('.com/')[1];
            await this.s3.deleteObject({
              Bucket: this.s3BucketName,
              Key: s3Key
            }).promise();
          } else {
            await fs.unlink(row.recording_url);
          }
          cleanedCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to delete recording: ${row.recording_url}`);
        }
      }
      
      // Update database
      await this.db.query(`
        UPDATE call_sessions 
        SET recording_url = NULL, recording_status = 'expired'
        WHERE recording_completed_at < $1
      `, [cutoffDate]);
      
      console.log(`🧹 Cleaned up ${cleanedCount} expired recordings`);
      return cleanedCount;
      
    } catch (error) {
      console.error('❌ Failed to cleanup expired recordings:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return {
      service: 'CallRecordingService',
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      activeRecordings: this.activeRecordings.size,
      cloudStorage: this.useCloudStorage,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = CallRecordingService;