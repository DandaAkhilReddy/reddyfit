// Patient Management API Controller
const PatientManagementService = require('../services/patients/PatientManagementService');
const { body, validationResult, param, query } = require('express-validator');

class PatientController {
  constructor() {
    this.patientService = new PatientManagementService();
  }

  async initialize() {
    await this.patientService.initialize();
    console.log('👥 PatientController initialized');
  }

  // =============================================
  // VALIDATION RULES
  // =============================================

  getCreatePatientValidation() {
    return [
      body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
      body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
      body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
      body('email').optional().isEmail().withMessage('Valid email required'),
      body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
      body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
      body('preferredLanguage').optional().isLength({ min: 2, max: 10 }).withMessage('Valid language code required'),
      body('accessReason').notEmpty().withMessage('Access reason is required for HIPAA compliance')
    ];
  }

  getUpdatePatientValidation() {
    return [
      param('patientId').isLength({ min: 5 }).withMessage('Valid patient ID required'),
      body('accessReason').notEmpty().withMessage('Access reason is required for HIPAA compliance')
    ];
  }

  getSearchValidation() {
    return [
      query('accessReason').notEmpty().withMessage('Access reason is required for HIPAA compliance')
    ];
  }

  // =============================================
  // PATIENT CRUD OPERATIONS
  // =============================================

  /**
   * Create new patient
   * POST /api/patients
   */
  createPatient = async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const patientData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        email: req.body.email,
        phone: req.body.phone,
        ssn: req.body.ssn,
        gender: req.body.gender,
        preferredLanguage: req.body.preferredLanguage || 'en',
        bloodType: req.body.bloodType,
        allergies: req.body.allergies || [],
        chronicConditions: req.body.chronicConditions || [],
        currentMedications: req.body.currentMedications || [],
        emergencyContact: req.body.emergencyContact || {},
        insuranceProvider: req.body.insuranceProvider,
        insurancePolicyNumber: req.body.insurancePolicyNumber,
        insuranceGroupNumber: req.body.insuranceGroupNumber,
        aiInteractionPreferences: req.body.aiInteractionPreferences || {},
        communicationPreferences: req.body.communicationPreferences || {}
      };

      const result = await this.patientService.createPatient(
        patientData,
        req.user.id,
        req.body.accessReason
      );

      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: result.patient
      });

    } catch (error) {
      console.error('Create patient error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'PATIENT_CREATION_FAILED'
      });
    }
  };

  /**
   * Get patient by ID
   * GET /api/patients/:patientId
   */
  getPatient = async (req, res) => {
    try {
      const { patientId } = req.params;
      const { accessReason, excludeSensitive } = req.query;

      if (!accessReason) {
        return res.status(400).json({
          success: false,
          error: 'Access reason is required for HIPAA compliance'
        });
      }

      const options = {
        excludeSensitive: excludeSensitive === 'true'
      };

      const result = await this.patientService.getPatient(
        patientId,
        req.user.id,
        accessReason,
        options
      );

      res.json({
        success: true,
        data: result.patient
      });

    } catch (error) {
      console.error('Get patient error:', error);
      const statusCode = error.message === 'Patient not found' ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: 'PATIENT_RETRIEVAL_FAILED'
      });
    }
  };

  /**
   * Update patient
   * PUT /api/patients/:patientId
   */
  updatePatient = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { patientId } = req.params;
      const { accessReason, ...updateData } = req.body;

      const result = await this.patientService.updatePatient(
        patientId,
        updateData,
        req.user.id,
        accessReason
      );

      res.json({
        success: true,
        message: 'Patient updated successfully',
        data: result.patient
      });

    } catch (error) {
      console.error('Update patient error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'PATIENT_UPDATE_FAILED'
      });
    }
  };

  /**
   * Search patients
   * GET /api/patients/search
   */
  searchPatients = async (req, res) => {
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
        q: searchQuery,
        accessReason,
        page = 1,
        limit = 10,
        gender,
        insuranceProvider,
        minAge,
        maxAge
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50), // Max 50 results per page
        filters: {}
      };

      if (gender) options.filters.gender = gender;
      if (insuranceProvider) options.filters.insuranceProvider = insuranceProvider;
      if (minAge || maxAge) {
        options.filters.ageRange = {};
        if (minAge) options.filters.ageRange.min = parseInt(minAge);
        if (maxAge) options.filters.ageRange.max = parseInt(maxAge);
      }

      const result = await this.patientService.searchPatients(
        searchQuery,
        req.user.id,
        accessReason,
        options
      );

      res.json({
        success: true,
        data: {
          patients: result.patients,
          pagination: result.pagination
        }
      });

    } catch (error) {
      console.error('Search patients error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'PATIENT_SEARCH_FAILED'
      });
    }
  };

  // =============================================
  // MEDICAL HISTORY OPERATIONS
  // =============================================

  /**
   * Add medical history entry
   * POST /api/patients/:patientId/history
   */
  addMedicalHistory = async (req, res) => {
    try {
      const { patientId } = req.params;
      const { accessReason, visitDate, diagnosis, treatment, medications, notes } = req.body;

      if (!accessReason) {
        return res.status(400).json({
          success: false,
          error: 'Access reason is required'
        });
      }

      const historyData = {
        visitDate,
        diagnosis,
        treatment,
        medications,
        notes
      };

      const result = await this.patientService.addMedicalHistory(
        patientId,
        historyData,
        req.user.id,
        accessReason
      );

      res.status(201).json({
        success: true,
        message: 'Medical history added successfully',
        data: result.historyEntry
      });

    } catch (error) {
      console.error('Add medical history error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'MEDICAL_HISTORY_ADD_FAILED'
      });
    }
  };

  /**
   * Get patient medical history
   * GET /api/patients/:patientId/history
   */
  getMedicalHistory = async (req, res) => {
    try {
      const { patientId } = req.params;
      const { accessReason, limit = 10, offset = 0 } = req.query;

      if (!accessReason) {
        return res.status(400).json({
          success: false,
          error: 'Access reason is required'
        });
      }

      const options = {
        limit: Math.min(parseInt(limit), 50),
        offset: parseInt(offset)
      };

      const result = await this.patientService.getMedicalHistory(
        patientId,
        req.user.id,
        accessReason,
        options
      );

      res.json({
        success: true,
        data: result.history
      });

    } catch (error) {
      console.error('Get medical history error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'MEDICAL_HISTORY_RETRIEVAL_FAILED'
      });
    }
  };

  // =============================================
  // UTILITY ENDPOINTS
  // =============================================

  /**
   * Get patient statistics (for authorized users)
   * GET /api/patients/stats
   */
  getPatientStats = async (req, res) => {
    try {
      // Only admins and medical staff can access stats
      if (!req.user.permissions.patients) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // Get basic stats from database
      const statsQuery = `
        SELECT 
          COUNT(*) as total_patients,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_patients_30d,
          COUNT(*) FILTER (WHERE last_contact_at >= CURRENT_DATE - INTERVAL '30 days') as active_patients_30d,
          COUNT(DISTINCT preferred_language) as languages_supported,
          COUNT(*) FILTER (WHERE gender = 'male') as male_patients,
          COUNT(*) FILTER (WHERE gender = 'female') as female_patients,
          COUNT(DISTINCT insurance_provider) as insurance_providers
        FROM patients 
        WHERE is_active = true
      `;

      const result = await this.patientService.db.query(statsQuery);
      const stats = result.rows[0];

      res.json({
        success: true,
        data: {
          totalPatients: parseInt(stats.total_patients),
          newPatients30d: parseInt(stats.new_patients_30d),
          activePatients30d: parseInt(stats.active_patients_30d),
          languagesSupported: parseInt(stats.languages_supported),
          demographics: {
            male: parseInt(stats.male_patients),
            female: parseInt(stats.female_patients),
            other: parseInt(stats.total_patients) - parseInt(stats.male_patients) - parseInt(stats.female_patients)
          },
          insuranceProviders: parseInt(stats.insurance_providers)
        }
      });

    } catch (error) {
      console.error('Get patient stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve patient statistics',
        code: 'STATS_RETRIEVAL_FAILED'
      });
    }
  };

  /**
   * Health check
   * GET /api/patients/health
   */
  healthCheck = async (req, res) => {
    try {
      const health = await this.patientService.healthCheck();
      res.json(health);
    } catch (error) {
      res.status(500).json({
        service: 'PatientManagementService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
}

module.exports = PatientController;