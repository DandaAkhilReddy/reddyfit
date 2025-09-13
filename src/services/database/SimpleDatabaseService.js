// SimpleDatabaseService.js - In-memory database for testing
// Temporary solution for testing without PostgreSQL setup

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class SimpleDatabaseService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.dataDir = options.dataDir || path.join(__dirname, '../../../data');
    this.isInitialized = false;
    
    // In-memory storage
    this.data = {
      patients: new Map(),
      appointments: new Map(),
      callSessions: new Map(),
      transcripts: new Map(),
      recordings: new Map(),
      voicemails: new Map(),
      users: new Map(),
      callLogs: []
    };
    
    // File paths for persistence
    this.filePaths = {
      patients: path.join(this.dataDir, 'patients.json'),
      appointments: path.join(this.dataDir, 'appointments.json'),
      callSessions: path.join(this.dataDir, 'call-sessions.json'),
      transcripts: path.join(this.dataDir, 'transcripts.json'),
      recordings: path.join(this.dataDir, 'recordings.json'),
      voicemails: path.join(this.dataDir, 'voicemails.json'),
      users: path.join(this.dataDir, 'users.json'),
      callLogs: path.join(this.dataDir, 'call-logs.json')
    };
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Simple Database Service...');
      
      // Create data directory if it doesn't exist
      await this.ensureDataDirectory();
      
      // Load existing data
      await this.loadData();
      
      // Create default admin user if none exists
      await this.createDefaultUsers();
      
      this.isInitialized = true;
      console.log('✅ Simple Database Service initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Simple Database Service:', error);
      throw error;
    }
  }

  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log(`📁 Created data directory: ${this.dataDir}`);
    }
  }

  async loadData() {
    for (const [key, filePath] of Object.entries(this.filePaths)) {
      try {
        const data = await fs.readFile(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        
        if (Array.isArray(parsedData)) {
          this.data[key] = parsedData;
        } else if (typeof parsedData === 'object') {
          this.data[key] = new Map(Object.entries(parsedData));
        }
        
        console.log(`📊 Loaded ${key}: ${this.data[key].size || this.data[key].length} records`);
      } catch (error) {
        // File doesn't exist or is corrupted, start with empty data
        console.log(`📄 No existing ${key} data, starting fresh`);
      }
    }
  }

  async saveData() {
    for (const [key, filePath] of Object.entries(this.filePaths)) {
      try {
        let dataToSave;
        
        if (this.data[key] instanceof Map) {
          dataToSave = Object.fromEntries(this.data[key]);
        } else {
          dataToSave = this.data[key];
        }
        
        await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
      } catch (error) {
        console.error(`❌ Failed to save ${key}:`, error);
      }
    }
  }

  async createDefaultUsers() {
    if (this.data.users.size === 0) {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@reddytalk.ai',
        name: 'ReddyTalk Admin',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };
      
      this.data.users.set(adminUser.id, adminUser);
      
      const doctorUser = {
        id: 'doctor-1',
        email: 'doctor@reddytalk.ai',
        name: 'Dr. Test Doctor',
        role: 'doctor',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };
      
      this.data.users.set(doctorUser.id, doctorUser);
      
      console.log('👤 Created default users: admin, doctor');
    }
  }

  // ============ PATIENT MANAGEMENT ============
  
  async createPatient(patientData) {
    const id = `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const patient = {
      id,
      ...patientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    this.data.patients.set(id, patient);
    await this.saveData();
    
    return patient;
  }

  async getPatient(patientId) {
    return this.data.patients.get(patientId);
  }

  async updatePatient(patientId, updateData) {
    const patient = this.data.patients.get(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    const updatedPatient = {
      ...patient,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    this.data.patients.set(patientId, updatedPatient);
    await this.saveData();
    
    return updatedPatient;
  }

  async searchPatients(criteria) {
    const patients = Array.from(this.data.patients.values());
    
    if (criteria.name) {
      return patients.filter(p => 
        p.name.toLowerCase().includes(criteria.name.toLowerCase())
      );
    }
    
    if (criteria.phone) {
      return patients.filter(p => 
        p.phone && p.phone.includes(criteria.phone)
      );
    }
    
    return patients;
  }

  // ============ APPOINTMENT MANAGEMENT ============
  
  async createAppointment(appointmentData) {
    const id = `appointment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const appointment = {
      id,
      ...appointmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: appointmentData.status || 'scheduled'
    };
    
    this.data.appointments.set(id, appointment);
    await this.saveData();
    
    return appointment;
  }

  async getAppointment(appointmentId) {
    return this.data.appointments.get(appointmentId);
  }

  async updateAppointment(appointmentId, updateData) {
    const appointment = this.data.appointments.get(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    const updatedAppointment = {
      ...appointment,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    this.data.appointments.set(appointmentId, updatedAppointment);
    await this.saveData();
    
    return updatedAppointment;
  }

  // ============ CALL MANAGEMENT ============
  
  async createCallSession(sessionData) {
    const session = {
      ...sessionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: sessionData.status || 'active'
    };
    
    this.data.callSessions.set(sessionData.sessionId, session);
    await this.saveData();
    
    return session;
  }

  async updateCallSession(sessionId, updateData) {
    const session = this.data.callSessions.get(sessionId);
    if (!session) {
      throw new Error('Call session not found');
    }
    
    const updatedSession = {
      ...session,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    this.data.callSessions.set(sessionId, updatedSession);
    await this.saveData();
    
    return updatedSession;
  }

  async getCallSession(sessionId) {
    return this.data.callSessions.get(sessionId);
  }

  // ============ RECORDING AND TRANSCRIPTION ============
  
  async addRecording(recordingData) {
    const id = `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const recording = {
      id,
      ...recordingData,
      createdAt: new Date().toISOString()
    };
    
    this.data.recordings.set(id, recording);
    await this.saveData();
    
    return recording;
  }

  async addTranscription(transcriptData) {
    const id = `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transcript = {
      id,
      ...transcriptData,
      createdAt: new Date().toISOString()
    };
    
    this.data.transcripts.set(id, transcript);
    await this.saveData();
    
    return transcript;
  }

  async addVoicemail(voicemailData) {
    const id = `voicemail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const voicemail = {
      id,
      ...voicemailData,
      createdAt: new Date().toISOString()
    };
    
    this.data.voicemails.set(id, voicemail);
    await this.saveData();
    
    return voicemail;
  }

  async updateVoicemailTranscription(callSid, transcriptionText) {
    for (const [id, voicemail] of this.data.voicemails) {
      if (voicemail.callSid === callSid) {
        voicemail.transcriptionText = transcriptionText;
        voicemail.updatedAt = new Date().toISOString();
        await this.saveData();
        return voicemail;
      }
    }
    throw new Error('Voicemail not found');
  }

  // ============ CALL LOGGING ============
  
  async logCallStatus(logData) {
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...logData,
      timestamp: logData.timestamp || new Date().toISOString()
    };
    
    this.data.callLogs.push(logEntry);
    
    // Keep only last 1000 logs
    if (this.data.callLogs.length > 1000) {
      this.data.callLogs = this.data.callLogs.slice(-1000);
    }
    
    await this.saveData();
    
    return logEntry;
  }

  // ============ QUERIES ============
  
  async query(sql, params = []) {
    // Simple mock query method for compatibility
    console.log('📝 Mock query:', sql, params);
    
    // Return mock result structure
    return {
      rows: [],
      rowCount: 0
    };
  }

  async getConnectionCount() {
    return 1; // Mock connection count
  }

  // ============ HEALTH CHECK ============
  
  async healthCheck() {
    return {
      service: 'SimpleDatabaseService',
      status: 'healthy',
      records: {
        patients: this.data.patients.size,
        appointments: this.data.appointments.size,
        callSessions: this.data.callSessions.size,
        transcripts: this.data.transcripts.size,
        recordings: this.data.recordings.size,
        voicemails: this.data.voicemails.size,
        users: this.data.users.size,
        callLogs: this.data.callLogs.length
      },
      dataDir: this.dataDir,
      timestamp: new Date().toISOString()
    };
  }

  // ============ CLEANUP ============
  
  async shutdown() {
    console.log('💾 Saving data before shutdown...');
    await this.saveData();
    console.log('✅ Simple Database Service shutdown complete');
  }
}

module.exports = SimpleDatabaseService;