// Patient Management Service for ReddyTalk.ai
// HIPAA-compliant patient data management with encryption and audit logging

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const DatabaseService = require('../database/DatabaseService');
const AuthService = require('../auth/AuthService');

class PatientManagementService {
  constructor() {
    this.db = new DatabaseService();
    this.authService = new AuthService();
    
    // Encryption configuration
    this.encryptionKey = process.env.PATIENT_DATA_ENCRYPTION_KEY || 'reddytalk_patient_key_2025_change_in_production';
    this.encryptionAlgorithm = 'aes-256-gcm';
    
    // Patient ID generation
    this.patientIdPrefix = 'RT';
    this.patientIdLength = 8;
    
    // HIPAA compliance settings
    this.auditAllAccess = true;
    this.requireReasonForAccess = true;
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('👥 Initializing Patient Management Service...');
      
      await this.db.initialize();
      await this.authService.initialize();
      
      // Verify encryption setup
      await this.testEncryption();
      
      this.isInitialized = true;
      console.log('✅ Patient Management Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Patient Management Service:', error);
      throw error;
    }
  }

  // =============================================
  // PATIENT CREATION AND REGISTRATION
  // =============================================

  /**
   * Create a new patient record
   */
  async createPatient(patientData, createdByUserId, accessReason = 'Patient Registration') {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      // Validate required fields
      this.validatePatientData(patientData);
      
      // Generate unique patient ID
      const patientId = await this.generatePatientId();
      
      // Encrypt PII fields
      const encryptedData = await this.encryptPatientPII({
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        email: patientData.email,
        phone: patientData.phone,
        ssn: patientData.ssn,
        insurancePolicyNumber: patientData.insurancePolicyNumber
      });
      
      // Prepare medical information
      const medicalInfo = {
        allergies: patientData.allergies || [],
        chronicConditions: patientData.chronicConditions || [],
        currentMedications: patientData.currentMedications || [],
        emergencyContact: patientData.emergencyContact || {}
      };
      
      // Insert patient record
      const result = await this.db.query(`
        INSERT INTO patients (
          patient_id, first_name_encrypted, last_name_encrypted,
          email_encrypted, phone_encrypted, ssn_encrypted,
          date_of_birth, gender, preferred_language, blood_type,
          allergies, chronic_conditions, current_medications, emergency_contact,
          insurance_provider, insurance_policy_number_encrypted, insurance_group_number,
          ai_interaction_preferences, communication_preferences,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING id, patient_id, created_at
      `, [
        patientId,
        encryptedData.firstName,
        encryptedData.lastName,
        encryptedData.email,
        encryptedData.phone,
        encryptedData.ssn,
        patientData.dateOfBirth,
        patientData.gender,
        patientData.preferredLanguage || 'en',
        patientData.bloodType,
        JSON.stringify(medicalInfo.allergies),
        JSON.stringify(medicalInfo.chronicConditions),
        JSON.stringify(medicalInfo.currentMedications),
        JSON.stringify(medicalInfo.emergencyContact),
        patientData.insuranceProvider,
        encryptedData.insurancePolicyNumber,
        patientData.insuranceGroupNumber,
        JSON.stringify(patientData.aiInteractionPreferences || {}),
        JSON.stringify(patientData.communicationPreferences || {}),
        createdByUserId
      ]);
      
      const createdPatient = result.rows[0];
      
      // Log patient creation
      await this.logPatientAccess(createdByUserId, createdPatient.id, 'PATIENT_CREATED', accessReason, {
        patient_id: patientId,
        fields_created: Object.keys(patientData)
      });
      
      return {
        success: true,
        patient: {
          id: createdPatient.id,
          patientId: createdPatient.patient_id,
          createdAt: createdPatient.created_at
        },
        message: 'Patient created successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to create patient:', error);
      throw error;
    }
  }

  /**
   * Get patient information (with decryption)
   */
  async getPatient(patientId, requestedByUserId, accessReason, options = {}) {
    try {
      // Validate access permissions
      await this.validatePatientAccess(requestedByUserId, patientId, 'read');
      
      // Query patient data
      const result = await this.db.query(`
        SELECT 
          p.*, 
          u.first_name as created_by_name, u.last_name as created_by_lastname
        FROM patients p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.patient_id = $1 AND p.is_active = true
      `, [patientId]);
      
      if (result.rows.length === 0) {
        throw new Error('Patient not found');
      }
      
      const patientData = result.rows[0];
      
      // Decrypt PII fields
      const decryptedData = await this.decryptPatientPII({
        firstName: patientData.first_name_encrypted,
        lastName: patientData.last_name_encrypted,
        email: patientData.email_encrypted,
        phone: patientData.phone_encrypted,
        ssn: patientData.ssn_encrypted,
        insurancePolicyNumber: patientData.insurance_policy_number_encrypted
      });
      
      // Build patient object
      const patient = {
        id: patientData.id,
        patientId: patientData.patient_id,
        firstName: decryptedData.firstName,
        lastName: decryptedData.lastName,
        email: decryptedData.email,
        phone: decryptedData.phone,
        dateOfBirth: patientData.date_of_birth,
        gender: patientData.gender,
        preferredLanguage: patientData.preferred_language,
        bloodType: patientData.blood_type,
        allergies: JSON.parse(patientData.allergies || '[]'),
        chronicConditions: JSON.parse(patientData.chronic_conditions || '[]'),
        currentMedications: JSON.parse(patientData.current_medications || '[]'),
        emergencyContact: JSON.parse(patientData.emergency_contact || '{}'),
        insuranceProvider: patientData.insurance_provider,
        insuranceGroupNumber: patientData.insurance_group_number,
        aiInteractionPreferences: JSON.parse(patientData.ai_interaction_preferences || '{}'),
        communicationPreferences: JSON.parse(patientData.communication_preferences || '{}'),
        createdAt: patientData.created_at,
        lastContactAt: patientData.last_contact_at
      };
      
      // Conditionally include sensitive fields
      if (!options.excludeSensitive) {
        patient.ssn = decryptedData.ssn;
        patient.insurancePolicyNumber = decryptedData.insurancePolicyNumber;
      }
      
      // Log patient access
      await this.logPatientAccess(requestedByUserId, patientData.id, 'PATIENT_ACCESSED', accessReason, {
        fields_accessed: options.fieldsAccessed || 'all',
        exclude_sensitive: options.excludeSensitive
      });
      
      return {
        success: true,
        patient,
        message: 'Patient data retrieved successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to get patient:', error);
      throw error;
    }
  }

  /**
   * Update patient information
   */
  async updatePatient(patientId, updateData, updatedByUserId, accessReason) {
    try {
      // Validate access permissions
      await this.validatePatientAccess(updatedByUserId, patientId, 'write');
      
      // Get current patient data
      const currentPatient = await this.getPatient(patientId, updatedByUserId, accessReason);
      
      // Prepare update fields
      const updateFields = {};
      const encryptedUpdates = {};
      
      // Handle PII updates (encrypt if needed)
      const piiFields = ['firstName', 'lastName', 'email', 'phone', 'ssn', 'insurancePolicyNumber'];
      for (const field of piiFields) {
        if (updateData[field] !== undefined) {
          const encryptedFieldName = this.getEncryptedFieldName(field);
          encryptedUpdates[field] = updateData[field];
          updateFields[encryptedFieldName] = true;
        }
      }
      
      // Encrypt PII updates
      if (Object.keys(encryptedUpdates).length > 0) {
        const encrypted = await this.encryptPatientPII(encryptedUpdates);
        Object.assign(updateFields, encrypted);
      }
      
      // Handle non-PII updates
      const nonPiiFields = [
        'dateOfBirth', 'gender', 'preferredLanguage', 'bloodType',
        'allergies', 'chronicConditions', 'currentMedications', 'emergencyContact',
        'insuranceProvider', 'insuranceGroupNumber',
        'aiInteractionPreferences', 'communicationPreferences'
      ];
      
      for (const field of nonPiiFields) {
        if (updateData[field] !== undefined) {
          const dbField = this.camelToSnakeCase(field);
          if (['allergies', 'chronicConditions', 'currentMedications', 'emergencyContact', 'aiInteractionPreferences', 'communicationPreferences'].includes(field)) {
            updateFields[dbField] = JSON.stringify(updateData[field]);
          } else {
            updateFields[dbField] = updateData[field];
          }
        }
      }
      
      if (Object.keys(updateFields).length === 0) {
        throw new Error('No valid fields to update');
      }
      
      // Add updated timestamp
      updateFields.updated_at = new Date();
      
      // Build update query
      const setClause = Object.keys(updateFields)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [patientId, ...Object.values(updateFields)];
      
      // Execute update
      const result = await this.db.query(`
        UPDATE patients 
        SET ${setClause}
        WHERE patient_id = $1 AND is_active = true
        RETURNING id, patient_id, updated_at
      `, values);
      
      if (result.rows.length === 0) {
        throw new Error('Patient not found or update failed');
      }
      
      const updatedPatient = result.rows[0];
      
      // Log patient update
      await this.logPatientAccess(updatedByUserId, updatedPatient.id, 'PATIENT_UPDATED', accessReason, {
        fields_updated: Object.keys(updateData),
        change_summary: this.generateChangeSummary(currentPatient.patient, updateData)
      });
      
      return {
        success: true,
        patient: {
          id: updatedPatient.id,
          patientId: updatedPatient.patient_id,
          updatedAt: updatedPatient.updated_at
        },
        message: 'Patient updated successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to update patient:', error);
      throw error;
    }
  }

  /**
   * Search patients (with limited PII exposure)
   */
  async searchPatients(searchQuery, requestedByUserId, accessReason, options = {}) {
    try {
      // Validate search permissions
      await this.validateSearchAccess(requestedByUserId);
      
      const { page = 1, limit = 10, filters = {} } = options;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE p.is_active = true';
      let queryParams = [];
      let paramIndex = 1;
      
      // Add search conditions (search in encrypted fields requires special handling)
      if (searchQuery && searchQuery.trim()) {
        // For demonstration, we'll search patient_id and non-encrypted fields
        // In production, you might implement encrypted search or maintain searchable hashes
        whereClause += ` AND (
          p.patient_id ILIKE $${paramIndex} OR
          p.preferred_language ILIKE $${paramIndex} OR
          p.insurance_provider ILIKE $${paramIndex}
        )`;
        queryParams.push(`%${searchQuery.trim()}%`);
        paramIndex++;
      }
      
      // Add filters
      if (filters.gender) {
        whereClause += ` AND p.gender = $${paramIndex}`;
        queryParams.push(filters.gender);
        paramIndex++;
      }
      
      if (filters.insuranceProvider) {
        whereClause += ` AND p.insurance_provider = $${paramIndex}`;
        queryParams.push(filters.insuranceProvider);
        paramIndex++;
      }
      
      if (filters.ageRange) {
        const { min, max } = filters.ageRange;
        if (min) {
          whereClause += ` AND DATE_PART('year', AGE(p.date_of_birth)) >= $${paramIndex}`;
          queryParams.push(min);
          paramIndex++;
        }
        if (max) {
          whereClause += ` AND DATE_PART('year', AGE(p.date_of_birth)) <= $${paramIndex}`;
          queryParams.push(max);
          paramIndex++;
        }
      }
      
      // Execute search query
      const result = await this.db.query(`
        SELECT 
          p.id, p.patient_id, p.first_name_encrypted, p.last_name_encrypted,
          p.date_of_birth, p.gender, p.preferred_language,
          p.insurance_provider, p.created_at, p.last_contact_at,
          u.first_name as created_by_name, u.last_name as created_by_lastname
        FROM patients p
        LEFT JOIN users u ON p.created_by = u.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, limit, offset]);
      
      // Get total count
      const countResult = await this.db.query(`
        SELECT COUNT(*) as total
        FROM patients p
        ${whereClause}
      `, queryParams);
      
      const totalPatients = parseInt(countResult.rows[0].total);
      
      // Decrypt patient names for search results
      const patients = await Promise.all(result.rows.map(async (patient) => {
        const decryptedName = await this.decryptPatientPII({
          firstName: patient.first_name_encrypted,
          lastName: patient.last_name_encrypted
        });
        
        return {
          id: patient.id,
          patientId: patient.patient_id,
          firstName: decryptedName.firstName,
          lastName: decryptedName.lastName,
          dateOfBirth: patient.date_of_birth,
          gender: patient.gender,
          preferredLanguage: patient.preferred_language,
          insuranceProvider: patient.insurance_provider,
          createdAt: patient.created_at,
          lastContactAt: patient.last_contact_at,
          age: this.calculateAge(patient.date_of_birth)
        };
      }));
      
      // Log search activity
      await this.logPatientAccess(requestedByUserId, null, 'PATIENT_SEARCH', accessReason, {
        search_query: searchQuery,
        filters: filters,
        results_count: patients.length,
        total_matches: totalPatients
      });
      
      return {
        success: true,
        patients,
        pagination: {
          page,
          limit,
          total: totalPatients,
          pages: Math.ceil(totalPatients / limit)
        },
        message: `Found ${patients.length} patients`
      };
      
    } catch (error) {
      console.error('❌ Failed to search patients:', error);
      throw error;
    }
  }

  // =============================================
  // PATIENT MEDICAL HISTORY
  // =============================================

  /**
   * Add medical history entry
   */
  async addMedicalHistory(patientId, historyData, addedByUserId, accessReason) {
    try {
      // Validate access
      await this.validatePatientAccess(addedByUserId, patientId, 'write');
      
      // Get patient UUID from patient_id
      const patientResult = await this.db.query(
        'SELECT id FROM patients WHERE patient_id = $1 AND is_active = true',
        [patientId]
      );
      
      if (patientResult.rows.length === 0) {
        throw new Error('Patient not found');
      }
      
      const patientUuid = patientResult.rows[0].id;
      
      // Encrypt medical notes
      const encryptedNotes = await this.encryptData(historyData.notes || '');
      
      // Insert medical history
      const result = await this.db.query(`
        INSERT INTO patient_medical_history (
          patient_id, visit_date, diagnosis, treatment, medications,
          notes_encrypted, doctor_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, visit_date, created_at
      `, [
        patientUuid,
        historyData.visitDate,
        JSON.stringify(historyData.diagnosis || {}),
        JSON.stringify(historyData.treatment || {}),
        JSON.stringify(historyData.medications || {}),
        encryptedNotes,
        addedByUserId
      ]);
      
      const historyEntry = result.rows[0];
      
      // Log medical history addition
      await this.logPatientAccess(addedByUserId, patientUuid, 'MEDICAL_HISTORY_ADDED', accessReason, {
        history_entry_id: historyEntry.id,
        visit_date: historyData.visitDate
      });
      
      return {
        success: true,
        historyEntry,
        message: 'Medical history added successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to add medical history:', error);
      throw error;
    }
  }

  /**
   * Get patient medical history
   */
  async getMedicalHistory(patientId, requestedByUserId, accessReason, options = {}) {
    try {
      // Validate access
      await this.validatePatientAccess(requestedByUserId, patientId, 'read');
      
      // Get patient UUID
      const patientResult = await this.db.query(
        'SELECT id FROM patients WHERE patient_id = $1 AND is_active = true',
        [patientId]
      );
      
      if (patientResult.rows.length === 0) {
        throw new Error('Patient not found');
      }
      
      const patientUuid = patientResult.rows[0].id;
      
      // Query medical history
      const result = await this.db.query(`
        SELECT 
          pmh.*, 
          u.first_name as doctor_first_name, 
          u.last_name as doctor_last_name
        FROM patient_medical_history pmh
        LEFT JOIN users u ON pmh.doctor_id = u.id
        WHERE pmh.patient_id = $1
        ORDER BY pmh.visit_date DESC
        LIMIT $2 OFFSET $3
      `, [
        patientUuid,
        options.limit || 10,
        options.offset || 0
      ]);
      
      // Decrypt notes
      const history = await Promise.all(result.rows.map(async (entry) => {
        const decryptedNotes = await this.decryptData(entry.notes_encrypted);
        
        return {
          id: entry.id,
          visitDate: entry.visit_date,
          diagnosis: JSON.parse(entry.diagnosis || '{}'),
          treatment: JSON.parse(entry.treatment || '{}'),
          medications: JSON.parse(entry.medications || '{}'),
          notes: decryptedNotes,
          doctor: {
            firstName: entry.doctor_first_name,
            lastName: entry.doctor_last_name
          },
          createdAt: entry.created_at
        };
      }));
      
      // Log access
      await this.logPatientAccess(requestedByUserId, patientUuid, 'MEDICAL_HISTORY_ACCESSED', accessReason, {
        entries_accessed: history.length
      });
      
      return {
        success: true,
        history,
        message: 'Medical history retrieved successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to get medical history:', error);
      throw error;
    }
  }

  // =============================================
  // ENCRYPTION/DECRYPTION
  // =============================================

  async encryptPatientPII(data) {
    const encrypted = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        encrypted[this.getEncryptedFieldName(key)] = await this.encryptData(value.toString());
      }
    }
    
    return encrypted;
  }

  async decryptPatientPII(encryptedData) {
    const decrypted = {};
    
    for (const [key, value] of Object.entries(encryptedData)) {
      if (value !== undefined && value !== null) {
        const originalKey = this.getOriginalFieldName(key);
        decrypted[originalKey] = await this.decryptData(value);
      }
    }
    
    return decrypted;
  }

  async encryptData(data) {
    try {
      if (!data) return null;
      
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.encryptionAlgorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('reddytalk-patient-data'));
      
      let encrypted = cipher.update(data.toString(), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
      
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  async decryptData(encryptedData) {
    try {
      if (!encryptedData) return null;
      
      const buffer = Buffer.isBuffer(encryptedData) ? encryptedData : Buffer.from(encryptedData);
      
      const iv = buffer.slice(0, 16);
      const authTag = buffer.slice(16, 32);
      const encrypted = buffer.slice(32);
      
      const decipher = crypto.createDecipher(this.encryptionAlgorithm, this.encryptionKey);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from('reddytalk-patient-data'));
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
      
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return '[DECRYPTION_FAILED]';
    }
  }

  // =============================================
  // VALIDATION AND PERMISSIONS
  // =============================================

  validatePatientData(data) {
    const required = ['firstName', 'lastName', 'dateOfBirth'];
    
    for (const field of required) {
      if (!data[field] || data[field].trim() === '') {
        throw new Error(`${field} is required`);
      }
    }
    
    // Validate date of birth
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime()) || dob > new Date()) {
      throw new Error('Invalid date of birth');
    }
    
    // Validate email format if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate phone format if provided
    if (data.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
      throw new Error('Invalid phone number format');
    }
  }

  async validatePatientAccess(userId, patientId, action) {
    // Check if user has permission to access patient data
    const hasPermission = await this.authService.checkPermission(userId, 'patients', action);
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions to access patient data');
    }
    
    return true;
  }

  async validateSearchAccess(userId) {
    const hasPermission = await this.authService.checkPermission(userId, 'patients', 'read');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions to search patients');
    }
    
    return true;
  }

  // =============================================
  // AUDIT LOGGING
  // =============================================

  async logPatientAccess(userId, patientId, action, reason, details = {}) {
    try {
      await this.authService.logAuditEvent(
        userId,
        action,
        'patients',
        patientId,
        {
          ...details,
          access_reason: reason,
          hipaa_event: true,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to log patient access:', error);
      // Don't throw - audit logging failure shouldn't break main functionality
    }
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  async generatePatientId() {
    let patientId;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      // Generate ID: RT + random 8 digits
      const randomPart = Math.random().toString().substr(2, this.patientIdLength);
      patientId = `${this.patientIdPrefix}${randomPart}`;
      
      // Check if ID already exists
      const result = await this.db.query(
        'SELECT id FROM patients WHERE patient_id = $1',
        [patientId]
      );
      
      if (result.rows.length === 0) {
        break; // ID is unique
      }
      
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique patient ID');
    }
    
    return patientId;
  }

  getEncryptedFieldName(fieldName) {
    const mapping = {
      firstName: 'first_name_encrypted',
      lastName: 'last_name_encrypted',
      email: 'email_encrypted',
      phone: 'phone_encrypted',
      ssn: 'ssn_encrypted',
      insurancePolicyNumber: 'insurance_policy_number_encrypted'
    };
    
    return mapping[fieldName] || `${fieldName}_encrypted`;
  }

  getOriginalFieldName(encryptedFieldName) {
    const mapping = {
      first_name_encrypted: 'firstName',
      last_name_encrypted: 'lastName',
      email_encrypted: 'email',
      phone_encrypted: 'phone',
      ssn_encrypted: 'ssn',
      insurance_policy_number_encrypted: 'insurancePolicyNumber'
    };
    
    return mapping[encryptedFieldName] || encryptedFieldName.replace('_encrypted', '');
  }

  camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  generateChangeSummary(oldData, newData) {
    const changes = {};
    
    for (const [key, newValue] of Object.entries(newData)) {
      const oldValue = oldData[key];
      if (oldValue !== newValue) {
        changes[key] = {
          from: typeof oldValue === 'object' ? '[OBJECT]' : oldValue,
          to: typeof newValue === 'object' ? '[OBJECT]' : newValue
        };
      }
    }
    
    return changes;
  }

  async testEncryption() {
    try {
      const testData = 'test-patient-data-123';
      const encrypted = await this.encryptData(testData);
      const decrypted = await this.decryptData(encrypted);
      
      if (decrypted !== testData) {
        throw new Error('Encryption test failed');
      }
      
      console.log('🔐 Patient data encryption test passed');
      
    } catch (error) {
      console.error('❌ Encryption test failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return {
      service: 'PatientManagementService',
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      encryptionStatus: 'enabled',
      auditLogging: this.auditAllAccess ? 'enabled' : 'disabled',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = PatientManagementService;