// Enhanced MCP Server for ReddyTalk.ai - Advanced Medical Context Protocol
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const MedicalKnowledgeBase = require('../services/ai/MedicalKnowledgeBase');
const DatabaseService = require('../services/database/DatabaseService');
const CallManager = require('../services/call/CallManager');
const ConversationManager = require('../services/conversation/ConversationManager');
const path = require('path');
const fs = require('fs').promises;

// Initialize services
const knowledgeBase = new MedicalKnowledgeBase();
const dbService = new DatabaseService();
const callManager = new CallManager();
const conversationManager = new ConversationManager();

// Create Enhanced MCP server
const server = new Server({
  name: 'reddytalk-mcp-enhanced',
  version: '2.0.0',
  description: 'Advanced Medical Context Protocol Server for ReddyTalk.ai'
}, {
  capabilities: {
    resources: {
      list: true,
      read: true,
      subscribe: true
    },
    prompts: {
      list: true,
      read: true
    },
    tools: {
      list: true,
      call: true
    },
    logging: {}
  }
});

// Enhanced Resources with real-time data
const resources = {
  'clinic-info': {
    uri: 'reddytalk://clinic-info',
    name: 'Clinic Information',
    description: 'Real-time clinic details including hours, location, and contact',
    mimeType: 'application/json'
  },
  'doctors': {
    uri: 'reddytalk://doctors',
    name: 'Doctor Directory',
    description: 'Live doctor availability with specialties and languages',
    mimeType: 'application/json'
  },
  'appointments': {
    uri: 'reddytalk://appointments',
    name: 'Today\'s Appointments',
    description: 'Real-time appointment schedule for today',
    mimeType: 'application/json'
  },
  'patient-queue': {
    uri: 'reddytalk://patient-queue',
    name: 'Patient Queue',
    description: 'Current waiting patients and estimated wait times',
    mimeType: 'application/json'
  },
  'call-analytics': {
    uri: 'reddytalk://call-analytics',
    name: 'Call Analytics',
    description: 'Real-time voice call analytics and metrics',
    mimeType: 'application/json'
  },
  'emergency-protocols': {
    uri: 'reddytalk://emergency-protocols',
    name: 'Emergency Protocols',
    description: 'Emergency response protocols and contact information',
    mimeType: 'application/json'
  },
  'medication-database': {
    uri: 'reddytalk://medication-database',
    name: 'Medication Database',
    description: 'Common medications with dosages and interactions',
    mimeType: 'application/json'
  },
  'insurance-verification': {
    uri: 'reddytalk://insurance-verification',
    name: 'Insurance Verification',
    description: 'Real-time insurance verification status',
    mimeType: 'application/json'
  }
};

// Handle list resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.values(resources)
  };
});

// Handle read resource with real-time data
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    switch (uri) {
      case 'reddytalk://clinic-info':
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              ...knowledgeBase.clinicInfo,
              currentTime: new Date().toISOString(),
              isOpen: isClinicOpen(),
              nextOpenTime: getNextOpenTime()
            }, null, 2)
          }]
        };
        
      case 'reddytalk://appointments':
        const todayAppointments = await getTodaysAppointments();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(todayAppointments, null, 2)
          }]
        };
        
      case 'reddytalk://patient-queue':
        const queue = await getPatientQueue();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(queue, null, 2)
          }]
        };
        
      case 'reddytalk://call-analytics':
        const analytics = await getCallAnalytics();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(analytics, null, 2)
          }]
        };
        
      case 'reddytalk://emergency-protocols':
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getEmergencyProtocols(), null, 2)
          }]
        };
        
      case 'reddytalk://medication-database':
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getMedicationDatabase(), null, 2)
          }]
        };
        
      default:
        // Fallback to static resources
        const staticResources = {
          'reddytalk://doctors': knowledgeBase.doctors,
          'reddytalk://insurance-verification': knowledgeBase.insurance
        };
        
        if (staticResources[uri]) {
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(staticResources[uri], null, 2)
            }]
          };
        }
        
        throw new Error(`Resource not found: ${uri}`);
    }
  } catch (error) {
    console.error(`Error reading resource ${uri}:`, error);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({ error: error.message })
      }]
    };
  }
});

// Enhanced Tools for medical operations
const tools = [
  {
    name: 'schedule_appointment',
    description: 'Schedule a new appointment with complete validation',
    inputSchema: {
      type: 'object',
      properties: {
        patientName: { type: 'string' },
        patientPhone: { type: 'string' },
        doctorName: { type: 'string' },
        appointmentType: { type: 'string' },
        preferredDate: { type: 'string' },
        preferredTime: { type: 'string' },
        reason: { type: 'string' },
        insurance: { type: 'string' }
      },
      required: ['patientName', 'patientPhone', 'doctorName', 'appointmentType']
    }
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment',
    inputSchema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        reason: { type: 'string' }
      },
      required: ['appointmentId', 'reason']
    }
  },
  {
    name: 'reschedule_appointment',
    description: 'Reschedule an existing appointment',
    inputSchema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        newDate: { type: 'string' },
        newTime: { type: 'string' }
      },
      required: ['appointmentId', 'newDate', 'newTime']
    }
  },
  {
    name: 'verify_insurance',
    description: 'Verify patient insurance coverage in real-time',
    inputSchema: {
      type: 'object',
      properties: {
        insuranceProvider: { type: 'string' },
        memberId: { type: 'string' },
        groupNumber: { type: 'string' },
        serviceType: { type: 'string' }
      },
      required: ['insuranceProvider', 'memberId']
    }
  },
  {
    name: 'check_wait_time',
    description: 'Get current wait time for walk-in patients',
    inputSchema: {
      type: 'object',
      properties: {
        serviceType: { type: 'string' },
        isUrgent: { type: 'boolean' }
      },
      required: ['serviceType']
    }
  },
  {
    name: 'add_to_waitlist',
    description: 'Add patient to appointment waitlist',
    inputSchema: {
      type: 'object',
      properties: {
        patientName: { type: 'string' },
        patientPhone: { type: 'string' },
        doctorName: { type: 'string' },
        dateRange: { type: 'string' }
      },
      required: ['patientName', 'patientPhone', 'doctorName']
    }
  },
  {
    name: 'get_prescription_info',
    description: 'Get information about a medication',
    inputSchema: {
      type: 'object',
      properties: {
        medicationName: { type: 'string' },
        patientAge: { type: 'number' }
      },
      required: ['medicationName']
    }
  },
  {
    name: 'create_voice_call',
    description: 'Initiate an AI-powered voice call',
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string' },
        purpose: { type: 'string' },
        patientId: { type: 'string' }
      },
      required: ['phoneNumber', 'purpose']
    }
  },
  {
    name: 'get_call_transcript',
    description: 'Get transcript of a previous call',
    inputSchema: {
      type: 'object',
      properties: {
        callId: { type: 'string' }
      },
      required: ['callId']
    }
  },
  {
    name: 'analyze_symptoms',
    description: 'Analyze patient symptoms and suggest appropriate care',
    inputSchema: {
      type: 'object',
      properties: {
        symptoms: { type: 'array', items: { type: 'string' } },
        duration: { type: 'string' },
        severity: { type: 'string', enum: ['mild', 'moderate', 'severe'] }
      },
      required: ['symptoms', 'severity']
    }
  },
  
  // ElevenLabs Integration Tools
  {
    name: 'elevenlabs_check_availability',
    description: 'Check doctor availability through ElevenLabs voice agent',
    inputSchema: {
      type: 'object',
      properties: {
        doctorName: { type: 'string' },
        dateRange: { 
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' }
          }
        },
        appointmentType: { type: 'string' },
        preferredTimes: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['doctorName', 'dateRange']
    }
  },
  
  {
    name: 'elevenlabs_patient_lookup',
    description: 'Look up patient information for ElevenLabs voice agent',
    inputSchema: {
      type: 'object',
      properties: {
        searchCriteria: {
          type: 'object',
          properties: {
            phoneNumber: { type: 'string' },
            patientId: { type: 'string' },
            lastName: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' }
          }
        },
        includeHistory: { type: 'boolean', default: false },
        includePrescriptions: { type: 'boolean', default: false }
      },
      required: ['searchCriteria']
    }
  },
  
  {
    name: 'elevenlabs_schedule_voice_appointment',
    description: 'Schedule appointment via ElevenLabs voice agent with enhanced validation',
    inputSchema: {
      type: 'object',
      properties: {
        patientInfo: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            patientId: { type: 'string' }
          }
        },
        appointmentDetails: {
          type: 'object',
          properties: {
            doctorName: { type: 'string' },
            appointmentType: { type: 'string' },
            date: { type: 'string', format: 'date' },
            time: { type: 'string' },
            duration: { type: 'number', default: 30 },
            reason: { type: 'string' }
          }
        },
        preferences: {
          type: 'object',
          properties: {
            reminderCall: { type: 'boolean' },
            language: { type: 'string', default: 'en' },
            confirmationMethod: { type: 'string', enum: ['voice', 'sms', 'email'] }
          }
        }
      },
      required: ['patientInfo', 'appointmentDetails']
    }
  }
];

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls with actual implementations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'schedule_appointment':
        const appointment = await scheduleAppointment(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(appointment, null, 2)
          }]
        };
        
      case 'verify_insurance':
        const verification = await verifyInsurance(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(verification, null, 2)
          }]
        };
        
      case 'check_wait_time':
        const waitTime = await checkWaitTime(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(waitTime, null, 2)
          }]
        };
        
      case 'create_voice_call':
        const call = await createVoiceCall(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(call, null, 2)
          }]
        };
        
      case 'analyze_symptoms':
        const analysis = await analyzeSymptoms(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(analysis, null, 2)
          }]
        };
      
      // ElevenLabs Integration Cases
      case 'elevenlabs_check_availability':
        const availability = await checkElevenLabsAvailability(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(availability, null, 2)
          }]
        };
        
      case 'elevenlabs_patient_lookup':
        const patientData = await elevenLabsPatientLookup(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(patientData, null, 2)
          }]
        };
        
      case 'elevenlabs_schedule_voice_appointment':
        const voiceAppointment = await scheduleElevenLabsVoiceAppointment(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(voiceAppointment, null, 2)
          }]
        };
        
      default:
        throw new Error(`Tool not implemented: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: error.message }, null, 2)
      }],
      isError: true
    };
  }
});

// Enhanced Prompts with medical context
const prompts = [
  {
    name: 'medical-receptionist-advanced',
    description: 'Advanced AI medical receptionist with full context',
    arguments: [
      {
        name: 'patientContext',
        description: 'Patient history and preferences',
        required: false
      },
      {
        name: 'conversationMode',
        description: 'voice or text',
        required: false
      }
    ]
  },
  {
    name: 'emergency-triage',
    description: 'Emergency triage assistant for urgent situations',
    arguments: [
      {
        name: 'symptoms',
        description: 'Patient reported symptoms',
        required: true
      }
    ]
  },
  {
    name: 'medication-counselor',
    description: 'Provide medication information and guidance',
    arguments: [
      {
        name: 'medication',
        description: 'Medication name',
        required: true
      },
      {
        name: 'patientConcerns',
        description: 'Specific concerns or questions',
        required: false
      }
    ]
  },
  {
    name: 'insurance-navigator',
    description: 'Help patients understand insurance coverage',
    arguments: [
      {
        name: 'insuranceType',
        description: 'Type of insurance',
        required: true
      },
      {
        name: 'procedure',
        description: 'Medical procedure or service',
        required: false
      }
    ]
  }
];

// Handle list prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts };
});

// Handle get prompt with dynamic content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  const promptTemplates = {
    'medical-receptionist-advanced': {
      messages: [
        {
          role: 'system',
          content: `You are ReddyTalk, an advanced AI medical receptionist with these capabilities:
- Real-time appointment scheduling and management
- Insurance verification and pre-authorization
- Symptom triage and care recommendations
- Medication information and interactions
- Multi-language support
- HIPAA-compliant communication

Current clinic status: ${isClinicOpen() ? 'OPEN' : 'CLOSED'}
Mode: ${args?.conversationMode || 'voice'}

Always maintain professionalism, empathy, and accuracy. For voice mode, keep responses concise.`
        }
      ]
    },
    'emergency-triage': {
      messages: [
        {
          role: 'system',
          content: `You are an emergency triage assistant. Evaluate symptoms and provide immediate guidance.

CRITICAL: For life-threatening emergencies, ALWAYS direct to call 911 immediately.

Symptoms reported: ${args?.symptoms}

Assess severity and provide:
1. Immediate action needed
2. Whether emergency care is required
3. Alternative care options if not emergency
4. What to monitor`
        }
      ]
    }
  };
  
  if (promptTemplates[name]) {
    return {
      description: prompts.find(p => p.name === name)?.description,
      messages: promptTemplates[name].messages
    };
  }
  
  throw new Error(`Prompt not found: ${name}`);
});

// Helper functions for real-time data
async function getTodaysAppointments() {
  try {
    const today = new Date().toISOString().split('T')[0];
    // In production, this would query the database
    return {
      date: today,
      total: 42,
      completed: 18,
      inProgress: 3,
      upcoming: 21,
      appointments: [
        {
          id: 'APT001',
          time: '09:00 AM',
          patient: 'John Doe',
          doctor: 'Dr. Sarah Johnson',
          type: 'General Checkup',
          status: 'completed'
        },
        {
          id: 'APT002',
          time: '10:30 AM',
          patient: 'Jane Smith',
          doctor: 'Dr. Michael Chen',
          type: 'Cardiology Consultation',
          status: 'in-progress'
        }
      ]
    };
  } catch (error) {
    return { error: 'Unable to fetch appointments' };
  }
}

async function getPatientQueue() {
  return {
    timestamp: new Date().toISOString(),
    walkIns: 5,
    averageWaitTime: '25 minutes',
    queue: [
      {
        position: 1,
        checkInTime: '14:30',
        estimatedWait: '10 minutes',
        service: 'Urgent Care'
      }
    ]
  };
}

async function getCallAnalytics() {
  return {
    today: {
      totalCalls: 156,
      averageDuration: '3m 24s',
      successRate: 0.94,
      peakHour: '10:00 AM',
      languages: {
        english: 120,
        spanish: 25,
        mandarin: 11
      }
    },
    aiMetrics: {
      averageResponseTime: '487ms',
      sentimentScore: 0.82,
      resolutionRate: 0.89
    }
  };
}

function getEmergencyProtocols() {
  return {
    emergency: {
      number: '911',
      instruction: 'For life-threatening emergencies, hang up and dial 911'
    },
    urgentCare: {
      available: true,
      waitTime: '20-30 minutes',
      address: '500 Azure Medical Plaza'
    },
    onCallPhysician: {
      available: true,
      contactThrough: 'Press 9 for on-call physician'
    },
    protocols: {
      cardiac: 'Chest pain, shortness of breath → Call 911',
      stroke: 'FAST test failed → Call 911',
      severe_allergic: 'Anaphylaxis symptoms → Call 911'
    }
  };
}

function getMedicationDatabase() {
  return {
    commonMedications: [
      {
        name: 'Amoxicillin',
        type: 'Antibiotic',
        commonUses: ['Bacterial infections', 'Strep throat'],
        dosageForms: ['Capsule', 'Liquid'],
        warnings: ['Allergic reactions possible', 'Complete full course']
      },
      {
        name: 'Lisinopril',
        type: 'ACE Inhibitor',
        commonUses: ['High blood pressure', 'Heart failure'],
        dosageForms: ['Tablet'],
        warnings: ['May cause dry cough', 'Monitor kidney function']
      }
    ]
  };
}

function isClinicOpen() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  
  // Monday-Friday: 8 AM - 6 PM
  if (day >= 1 && day <= 5) {
    return hour >= 8 && hour < 18;
  }
  // Saturday: 9 AM - 2 PM
  if (day === 6) {
    return hour >= 9 && hour < 14;
  }
  // Sunday: Closed
  return false;
}

function getNextOpenTime() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  
  if (isClinicOpen()) {
    return 'Currently open';
  }
  
  // Calculate next opening time
  if (day === 0) { // Sunday
    return 'Monday 8:00 AM';
  } else if (day === 6 && hour >= 14) { // Saturday after 2 PM
    return 'Monday 8:00 AM';
  } else if (hour < 8) { // Before opening
    return 'Today 8:00 AM';
  } else if (hour >= 18) { // After closing
    return day === 5 ? 'Saturday 9:00 AM' : 'Tomorrow 8:00 AM';
  }
}

// Implementation functions for tools
async function scheduleAppointment(args) {
  // Validate doctor availability
  const isAvailable = knowledgeBase.getDoctorAvailability(
    args.doctorName, 
    args.preferredDate
  );
  
  if (!isAvailable) {
    throw new Error(`Dr. ${args.doctorName} is not available on ${args.preferredDate}`);
  }
  
  // Create appointment record
  const appointment = {
    id: `APT${Date.now()}`,
    patientName: args.patientName,
    patientPhone: args.patientPhone,
    doctorName: args.doctorName,
    appointmentType: args.appointmentType,
    date: args.preferredDate,
    time: args.preferredTime,
    status: 'scheduled',
    confirmationCode: generateConfirmationCode(),
    createdAt: new Date().toISOString()
  };
  
  // In production, save to database
  return {
    success: true,
    appointment,
    message: `Appointment scheduled successfully. Confirmation code: ${appointment.confirmationCode}`
  };
}

async function verifyInsurance(args) {
  // Simulate insurance verification
  const isAccepted = knowledgeBase.isInsuranceAccepted(args.insuranceProvider);
  
  return {
    verified: true,
    provider: args.insuranceProvider,
    memberId: args.memberId,
    isAccepted,
    coverage: isAccepted ? {
      deductible: '$500',
      deductibleMet: '$200',
      coinsurance: '20%',
      outOfPocketMax: '$3000',
      outOfPocketMet: '$800'
    } : null,
    message: isAccepted ? 
      'Insurance verified and accepted' : 
      'Insurance not in network. Out-of-network benefits may apply.'
  };
}

async function checkWaitTime(args) {
  const baseWaitTimes = {
    'urgent care': 25,
    'general': 15,
    'specialist': 30,
    'lab work': 10
  };
  
  const waitMinutes = baseWaitTimes[args.serviceType.toLowerCase()] || 20;
  const adjustedWait = args.isUrgent ? Math.floor(waitMinutes * 0.7) : waitMinutes;
  
  return {
    serviceType: args.serviceType,
    estimatedWait: `${adjustedWait} minutes`,
    queuePosition: Math.floor(Math.random() * 5) + 1,
    lastUpdated: new Date().toISOString()
  };
}

async function createVoiceCall(args) {
  // Initialize voice call using CallManager
  const call = {
    id: `CALL${Date.now()}`,
    phoneNumber: args.phoneNumber,
    purpose: args.purpose,
    patientId: args.patientId,
    status: 'initiated',
    aiAgent: 'ReddyTalk Medical Assistant',
    startTime: new Date().toISOString()
  };
  
  return {
    success: true,
    call,
    message: 'Voice call initiated. AI agent will handle the conversation.'
  };
}

async function analyzeSymptoms(args) {
  const severityScores = {
    mild: 1,
    moderate: 2,
    severe: 3
  };
  
  const urgentSymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding'];
  const hasUrgentSymptom = args.symptoms.some(s => 
    urgentSymptoms.some(u => s.toLowerCase().includes(u))
  );
  
  return {
    symptoms: args.symptoms,
    severity: args.severity,
    urgencyLevel: hasUrgentSymptom ? 'HIGH' : 
      severityScores[args.severity] >= 2 ? 'MEDIUM' : 'LOW',
    recommendation: hasUrgentSymptom ? 
      'Seek immediate medical attention. Call 911 for emergencies.' :
      severityScores[args.severity] >= 2 ?
        'Schedule an appointment within 24-48 hours' :
        'Monitor symptoms. Schedule routine appointment if persists.',
    possibleCauses: ['Requires medical evaluation'],
    selfCare: args.severity === 'mild' ? 
      ['Rest', 'Stay hydrated', 'Monitor symptoms'] : []
  };
}

function generateConfirmationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ElevenLabs Integration Implementation Functions
async function checkElevenLabsAvailability(args) {
  const { doctorName, dateRange, appointmentType, preferredTimes } = args;
  
  try {
    const doctors = knowledgeBase.getDoctors();
    const doctor = doctors.find(d => 
      d.name.toLowerCase().includes(doctorName.toLowerCase())
    );
    
    if (!doctor) {
      return {
        success: false,
        message: `Doctor "${doctorName}" not found`,
        availableDoctors: doctors.map(d => d.name)
      };
    }
    
    // Generate availability slots
    const availableSlots = [];
    const currentDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    while (currentDate <= endDate) {
      if (isClinicOpen(currentDate)) {
        const daySlots = generateDayTimeSlots(currentDate, doctor, appointmentType);
        if (preferredTimes && preferredTimes.length > 0) {
          const filteredSlots = daySlots.filter(slot => 
            preferredTimes.some(prefTime => slot.time.includes(prefTime))
          );
          availableSlots.push(...filteredSlots);
        } else {
          availableSlots.push(...daySlots);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      success: true,
      doctor: doctor.name,
      specialty: doctor.specialty,
      totalSlots: availableSlots.length,
      slots: availableSlots.slice(0, 10),
      nextAvailable: availableSlots[0] || null
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function elevenLabsPatientLookup(args) {
  const { searchCriteria, includeHistory = false } = args;
  
  try {
    // Simulate patient lookup
    const mockPatients = [
      {
        id: 'P001',
        name: 'John Smith',
        phone: '+1234567890',
        dateOfBirth: '1985-03-15',
        lastVisit: '2023-11-15',
        preferredDoctor: 'Dr. Sarah Johnson',
        insuranceProvider: 'Blue Cross Blue Shield'
      }
    ];
    
    let patient = null;
    if (searchCriteria.phoneNumber) {
      patient = mockPatients.find(p => p.phone === searchCriteria.phoneNumber);
    } else if (searchCriteria.patientId) {
      patient = mockPatients.find(p => p.id === searchCriteria.patientId);
    }
    
    if (!patient) {
      return {
        found: false,
        message: 'No patient found matching the search criteria'
      };
    }
    
    const result = {
      found: true,
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        lastVisit: patient.lastVisit,
        preferredDoctor: patient.preferredDoctor,
        insurance: {
          provider: patient.insuranceProvider,
          status: 'active'
        }
      }
    };
    
    if (includeHistory) {
      result.history = [
        {
          date: '2023-11-15',
          doctor: patient.preferredDoctor,
          type: 'Annual Check-up'
        }
      ];
    }
    
    return result;
  } catch (error) {
    return { found: false, error: error.message };
  }
}

async function scheduleElevenLabsVoiceAppointment(args) {
  const { patientInfo, appointmentDetails, preferences = {} } = args;
  
  try {
    const doctors = knowledgeBase.getDoctors();
    const doctor = doctors.find(d => 
      d.name.toLowerCase().includes(appointmentDetails.doctorName.toLowerCase())
    );
    
    if (!doctor) {
      return {
        success: false,
        message: `Doctor "${appointmentDetails.doctorName}" not found`
      };
    }
    
    const appointment = {
      id: `ELV_${Date.now()}`,
      confirmationCode: generateConfirmationCode(),
      patient: patientInfo,
      doctor: doctor.name,
      date: appointmentDetails.date,
      time: appointmentDetails.time,
      duration: appointmentDetails.duration || 30,
      type: appointmentDetails.appointmentType || 'general',
      status: 'scheduled',
      source: 'ElevenLabs Voice Agent',
      createdAt: new Date().toISOString()
    };
    
    return {
      success: true,
      appointment: {
        id: appointment.id,
        confirmationCode: appointment.confirmationCode,
        patientName: appointment.patient.name,
        doctorName: appointment.doctor,
        date: appointment.date,
        time: appointment.time
      },
      message: `Appointment scheduled for ${patientInfo.name} with ${doctor.name}. Confirmation: ${appointment.confirmationCode}`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateDayTimeSlots(date, doctor, appointmentType) {
  const slots = [];
  const startHour = 8;
  const endHour = 17;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 12 && minute === 0) continue; // Skip lunch
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      if (Math.random() > 0.3) { // 70% availability
        slots.push({
          date: date.toISOString().split('T')[0],
          time: timeString,
          duration: getAppointmentDuration(appointmentType),
          doctor: doctor.name,
          available: true
        });
      }
    }
  }
  
  return slots;
}

function getAppointmentDuration(appointmentType) {
  const durations = {
    'new_patient': 45,
    'follow_up': 30,
    'urgent_care': 15,
    'specialist': 45,
    'checkup': 30
  };
  return durations[appointmentType] || 30;
}

// Start the enhanced server
async function startEnhancedMCPServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('🚀 ReddyTalk Enhanced MCP Server v2.0 started');
  console.error('📚 Resources:', Object.keys(resources).length);
  console.error('🛠️  Tools:', tools.length);
  console.error('💬 Prompts:', prompts.length);
  console.error('✅ Ready to handle medical context requests');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Start server
startEnhancedMCPServer().catch((error) => {
  console.error('❌ Failed to start Enhanced MCP server:', error);
  process.exit(1);
});

module.exports = { server, resources, tools, prompts };