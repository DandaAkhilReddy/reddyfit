// ElevenLabs Integration Routes for ReddyTalk.ai
// Webhook endpoints for ElevenLabs agent to interact with ReddyTalk backend

const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Import your existing services
const MedicalKnowledgeBase = require('../services/ai/MedicalKnowledgeBase');
const DatabaseService = require('../services/database/DatabaseService');
const PatientManagementService = require('../services/patients/PatientManagementService');

// Initialize services
const knowledgeBase = new MedicalKnowledgeBase();
const dbService = new DatabaseService();
const patientService = new PatientManagementService();

// Rate limiting for ElevenLabs webhooks
const elevenLabsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests from ElevenLabs agent' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all ElevenLabs routes
router.use(elevenLabsRateLimit);

// Authentication middleware for ElevenLabs
const authenticateElevenLabs = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.ELEVENLABS_WEBHOOK_TOKEN || 'your-secure-webhook-token';
  
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized ElevenLabs request' });
  }
  next();
};

router.use(authenticateElevenLabs);

/**
 * Schedule Appointment Endpoint
 * POST /api/elevenlabs/schedule
 */
router.post('/schedule', [
  body('patient_name').trim().isLength({ min: 2 }).notEmpty(),
  body('phone_number').isMobilePhone(),
  body('preferred_date').isISO8601().toDate(),
  body('preferred_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('appointment_type').isIn(['new_patient', 'follow_up', 'urgent_care', 'checkup', 'specialist']),
  body('reason_for_visit').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        success: false,
        error: 'Invalid appointment data',
        details: errors.array()
      });
    }

    const {
      patient_name,
      phone_number,
      preferred_date,
      preferred_time,
      appointment_type,
      reason_for_visit,
      doctor_preference,
      insurance_provider,
      date_of_birth
    } = req.body;

    console.log(`📅 ElevenLabs scheduling request for ${patient_name}`);

    // Check doctor availability
    const availableSlots = await checkDoctorAvailability(preferred_date, doctor_preference);
    
    if (!availableSlots.length) {
      return res.json({
        success: false,
        error: 'No availability for requested date',
        alternative_dates: await getAlternativeDates(appointment_type, doctor_preference)
      });
    }

    // Create appointment
    const appointmentData = {
      patientName: patient_name,
      phoneNumber: phone_number,
      appointmentDate: preferred_date,
      appointmentTime: preferred_time,
      appointmentType: appointment_type,
      reasonForVisit: reason_for_visit || '',
      doctorPreference: doctor_preference,
      insuranceProvider: insurance_provider,
      dateOfBirth: date_of_birth,
      source: 'elevenlabs',
      status: 'scheduled'
    };

    // Use your existing appointment scheduling service
    const appointment = await scheduleAppointmentInternal(appointmentData);

    // Send confirmation SMS via Twilio (using existing service)
    await sendAppointmentConfirmation(appointment);

    console.log(`✅ Appointment scheduled: ID ${appointment.id}`);

    res.json({
      success: true,
      appointment_id: appointment.id,
      confirmation_number: appointment.confirmationNumber,
      scheduled_date: appointment.appointmentDate,
      scheduled_time: appointment.appointmentTime,
      doctor_name: appointment.doctorName,
      message: `Appointment confirmed for ${patient_name} on ${preferred_date} at ${preferred_time}`
    });

  } catch (error) {
    console.error('❌ ElevenLabs appointment scheduling error:', error);
    res.json({
      success: false,
      error: 'Unable to schedule appointment',
      message: 'Please try again or call our office directly'
    });
  }
});

/**
 * Check Availability Endpoint
 * GET /api/elevenlabs/availability
 */
router.get('/availability', [
  query('date').isISO8601().toDate(),
  query('appointment_type').optional().isIn(['new_patient', 'follow_up', 'urgent_care', 'checkup', 'specialist']),
  query('doctor_name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        success: false,
        error: 'Invalid availability request',
        details: errors.array()
      });
    }

    const { date, appointment_type, doctor_name } = req.query;
    
    console.log(`🔍 ElevenLabs checking availability for ${date}`);

    const availability = await checkDoctorAvailability(date, doctor_name, appointment_type);
    
    // Format availability for ElevenLabs agent
    const formattedSlots = availability.map(slot => ({
      time: slot.time,
      doctor: slot.doctorName,
      specialty: slot.specialty,
      duration: slot.duration,
      available: slot.isAvailable
    }));

    res.json({
      success: true,
      date: date,
      available_slots: formattedSlots,
      total_slots: formattedSlots.length,
      next_available: formattedSlots.find(slot => slot.available)?.time || 'No availability today'
    });

  } catch (error) {
    console.error('❌ ElevenLabs availability check error:', error);
    res.json({
      success: false,
      error: 'Unable to check availability'
    });
  }
});

/**
 * Patient Lookup Endpoint
 * GET /api/elevenlabs/patient
 */
router.get('/patient', [
  query('patient_name').trim().isLength({ min: 2 }),
  query('phone_number').optional().isMobilePhone(),
  query('date_of_birth').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        success: false,
        error: 'Invalid patient lookup request'
      });
    }

    const { patient_name, phone_number, date_of_birth } = req.query;
    
    console.log(`👤 ElevenLabs patient lookup for ${patient_name}`);

    // Search for existing patient
    const patient = await patientService.findPatient({
      name: patient_name,
      phoneNumber: phone_number,
      dateOfBirth: date_of_birth
    });

    if (!patient) {
      return res.json({
        success: false,
        patient_found: false,
        message: 'Patient not found in our records',
        is_new_patient: true
      });
    }

    // Return patient info (HIPAA-safe subset)
    res.json({
      success: true,
      patient_found: true,
      patient_id: patient.id,
      name: patient.name,
      phone_number: patient.phoneNumber,
      insurance_provider: patient.insuranceProvider,
      last_visit: patient.lastVisitDate,
      upcoming_appointments: await getUpcomingAppointments(patient.id),
      is_new_patient: false
    });

  } catch (error) {
    console.error('❌ ElevenLabs patient lookup error:', error);
    res.json({
      success: false,
      error: 'Unable to lookup patient'
    });
  }
});

/**
 * Insurance Verification Endpoint
 * POST /api/elevenlabs/verify-insurance
 */
router.post('/verify-insurance', [
  body('insurance_provider').trim().notEmpty(),
  body('member_id').trim().notEmpty(),
  body('patient_name').trim().notEmpty(),
  body('date_of_birth').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        success: false,
        error: 'Invalid insurance verification request'
      });
    }

    const { insurance_provider, member_id, patient_name, date_of_birth } = req.body;
    
    console.log(`🏥 ElevenLabs insurance verification for ${insurance_provider}`);

    // Check if we accept this insurance
    const acceptedInsurance = knowledgeBase.getAcceptedInsurance();
    const isAccepted = acceptedInsurance.some(ins => 
      ins.name.toLowerCase().includes(insurance_provider.toLowerCase())
    );

    if (!isAccepted) {
      return res.json({
        success: false,
        insurance_accepted: false,
        message: `We do not currently accept ${insurance_provider}`,
        accepted_plans: acceptedInsurance.map(ins => ins.name)
      });
    }

    // Simulate insurance verification (in production, integrate with insurance API)
    const verificationResult = {
      verified: true,
      copay: '$25',
      deductible_remaining: '$150',
      coverage_percentage: '80%',
      prior_authorization_required: false
    };

    res.json({
      success: true,
      insurance_accepted: true,
      provider: insurance_provider,
      verification: verificationResult,
      message: `Your ${insurance_provider} insurance is accepted and verified`
    });

  } catch (error) {
    console.error('❌ ElevenLabs insurance verification error:', error);
    res.json({
      success: false,
      error: 'Unable to verify insurance at this time'
    });
  }
});

/**
 * Clinic Information Endpoint
 * GET /api/elevenlabs/clinic-info
 */
router.get('/clinic-info', async (req, res) => {
  try {
    const clinicInfo = knowledgeBase.getClinicInformation();
    const doctors = knowledgeBase.getDoctors();
    const services = knowledgeBase.getServices();
    
    res.json({
      success: true,
      clinic: clinicInfo,
      doctors: doctors.map(doc => ({
        name: doc.name,
        specialty: doc.specialty,
        languages: doc.languages,
        available_days: doc.schedule
      })),
      services: services,
      current_time: new Date().toISOString(),
      is_open: isClinicOpen()
    });

  } catch (error) {
    console.error('❌ ElevenLabs clinic info error:', error);
    res.json({
      success: false,
      error: 'Unable to retrieve clinic information'
    });
  }
});

// Helper Functions

async function checkDoctorAvailability(date, doctorName, appointmentType) {
  // Integrate with your existing appointment system
  // This is a simplified version - replace with actual database queries
  
  const doctors = knowledgeBase.getDoctors();
  const targetDoctor = doctorName ? 
    doctors.find(d => d.name.toLowerCase().includes(doctorName.toLowerCase())) : 
    null;

  const timeSlots = generateTimeSlots(date);
  
  // Mock availability check - replace with real database query
  return timeSlots.map(slot => ({
    time: slot,
    doctorName: targetDoctor?.name || 'Available Doctor',
    specialty: targetDoctor?.specialty || 'General',
    duration: getDurationForAppointmentType(appointmentType),
    isAvailable: Math.random() > 0.3 // 70% availability simulation
  }));
}

function generateTimeSlots(date) {
  const slots = [];
  const startHour = 8; // 8 AM
  const endHour = 17; // 5 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  
  return slots;
}

function getDurationForAppointmentType(type) {
  const durations = {
    'new_patient': 45,
    'follow_up': 30,
    'urgent_care': 15,
    'checkup': 30,
    'specialist': 45
  };
  return durations[type] || 30;
}

async function scheduleAppointmentInternal(appointmentData) {
  // Replace this with your actual appointment scheduling logic
  const appointment = {
    id: `apt_${Date.now()}`,
    confirmationNumber: `RDY${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    ...appointmentData,
    doctorName: appointmentData.doctorPreference || 'Dr. Available',
    createdAt: new Date().toISOString()
  };
  
  // Here you would save to your database
  // await dbService.createAppointment(appointment);
  
  return appointment;
}

async function sendAppointmentConfirmation(appointment) {
  // Integrate with your existing Twilio SMS service
  console.log(`📱 Sending confirmation SMS for appointment ${appointment.id}`);
  // Your SMS logic here
}

async function getUpcomingAppointments(patientId) {
  // Query your database for upcoming appointments
  return [];
}

async function getAlternativeDates(appointmentType, doctorPreference) {
  // Generate alternative dates when preferred date is unavailable
  const alternatives = [];
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    alternatives.push({
      date: futureDate.toISOString().split('T')[0],
      available_times: ['09:00', '10:30', '14:00', '15:30']
    });
  }
  
  return alternatives;
}

function isClinicOpen() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday
  
  // Clinic hours: Mon-Fri 8AM-6PM, Sat 9AM-2PM
  if (day === 0) return false; // Closed Sunday
  if (day === 6) return hour >= 9 && hour < 14; // Saturday 9AM-2PM
  return hour >= 8 && hour < 18; // Weekdays 8AM-6PM
}

module.exports = router;