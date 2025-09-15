// MCP Server for ReddyTalk.ai - Model Context Protocol Integration

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema, 
  ListPromptsRequestSchema, 
  GetPromptRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const MedicalKnowledgeBase = require('../services/ai/MedicalKnowledgeBase');
const path = require('path');
const fs = require('fs').promises;

// Initialize medical knowledge base
const knowledgeBase = new MedicalKnowledgeBase();

// Create MCP server
const server = new Server({
  name: 'reddytalk-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    resources: {
      list: true,
      read: true,
    },
    prompts: {
      list: true,
      read: true,
    },
    tools: {
      list: true,
      call: true,
    }
  }
});

// Define available resources
const resources = {
  'clinic-info': {
    uri: 'reddytalk://clinic-info',
    name: 'Clinic Information',
    description: 'Azure Medical Center details including hours, location, and contact',
    mimeType: 'application/json'
  },
  'doctors': {
    uri: 'reddytalk://doctors',
    name: 'Doctor Directory',
    description: 'List of all doctors with specialties, languages, and availability',
    mimeType: 'application/json'
  },
  'services': {
    uri: 'reddytalk://services',
    name: 'Medical Services',
    description: 'Available medical services with pricing and duration',
    mimeType: 'application/json'
  },
  'insurance': {
    uri: 'reddytalk://insurance',
    name: 'Accepted Insurance',
    description: 'List of accepted insurance providers',
    mimeType: 'application/json'
  },
  'appointment-types': {
    uri: 'reddytalk://appointment-types',
    name: 'Appointment Types',
    description: 'Types of appointments available with requirements',
    mimeType: 'application/json'
  },
  'conversation-samples': {
    uri: 'reddytalk://conversation-samples',
    name: 'Sample Conversations',
    description: 'Example conversations for training and reference',
    mimeType: 'application/json'
  },
  'call-logs': {
    uri: 'reddytalk://call-logs',
    name: 'Recent Call Logs',
    description: 'Recent voice call transcripts and summaries',
    mimeType: 'application/json'
  }
};

// Handle list resources request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.values(resources)
  };
});

// Handle read resource request
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  switch (uri) {
    case 'reddytalk://clinic-info':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase.clinicInfo, null, 2)
        }]
      };
      
    case 'reddytalk://doctors':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase.doctors, null, 2)
        }]
      };
      
    case 'reddytalk://services':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase.services, null, 2)
        }]
      };
      
    case 'reddytalk://insurance':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase.insurance, null, 2)
        }]
      };
      
    case 'reddytalk://appointment-types':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase.appointmentTypes, null, 2)
        }]
      };
      
    case 'reddytalk://conversation-samples':
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase.sampleConversations, null, 2)
        }]
      };
      
    case 'reddytalk://call-logs':
      // Read recent call logs from file system
      const logsPath = path.join(__dirname, '../../logs/calls');
      try {
        const files = await fs.readdir(logsPath);
        const recentLogs = files.slice(-10); // Last 10 logs
        const logs = [];
        
        for (const file of recentLogs) {
          const content = await fs.readFile(path.join(logsPath, file), 'utf-8');
          logs.push(JSON.parse(content));
        }
        
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(logs, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'No call logs available', message: error.message })
          }]
        };
      }
      
    default:
      throw new Error(`Resource not found: ${uri}`);
  }
});

// Define available prompts
const prompts = [
  {
    name: 'medical-receptionist',
    description: 'Act as a medical receptionist for Azure Medical Center',
    arguments: [
      {
        name: 'context',
        description: 'Additional context about the patient or situation',
        required: false
      }
    ]
  },
  {
    name: 'appointment-scheduler',
    description: 'Help schedule medical appointments',
    arguments: [
      {
        name: 'patientNeeds',
        description: 'What the patient needs (e.g., "general checkup", "see cardiologist")',
        required: true
      },
      {
        name: 'timePreference',
        description: 'Preferred time (e.g., "next Tuesday morning")',
        required: false
      }
    ]
  },
  {
    name: 'insurance-verifier',
    description: 'Verify insurance coverage and explain benefits',
    arguments: [
      {
        name: 'insuranceProvider',
        description: 'Name of insurance provider',
        required: true
      }
    ]
  }
];

// Handle list prompts  
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts };
});

// Handle get prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'medical-receptionist':
      const kb = knowledgeBase.getSystemPromptContext();
      return {
        prompt: {
          name,
          arguments: args,
          template: `You are ReddyTalk, a professional medical receptionist AI assistant for ${kb.clinicInfo.name}.

Your role is to help patients with:
- Scheduling appointments
- Answering questions about services and hours
- Verifying insurance coverage
- Providing clinic information

Clinic Details:
${JSON.stringify(kb.clinicInfo, null, 2)}

Available Doctors:
${kb.doctors.map(d => `- ${d.name}: ${d.specialty}`).join('\n')}

${args?.context ? `Additional Context: ${args.context}` : ''}

Be professional, empathetic, and helpful. Keep responses concise for voice conversations.`
        }
      };
      
    case 'appointment-scheduler':
      return {
        prompt: {
          name,
          arguments: args,
          template: `Help schedule an appointment at Azure Medical Center.

Patient needs: ${args.patientNeeds}
${args.timePreference ? `Preferred time: ${args.timePreference}` : 'Time preference: No specific preference'}

Available doctors and their specialties:
${knowledgeBase.doctors.map(d => `- ${d.name}: ${d.specialty}, Languages: ${d.languages.join(', ')}`).join('\n')}

Suggest appropriate doctors based on the patient's needs and check availability.`
        }
      };
      
    case 'insurance-verifier':
      const isAccepted = knowledgeBase.isInsuranceAccepted(args.insuranceProvider);
      return {
        prompt: {
          name,
          arguments: args,
          template: `Verify insurance coverage for: ${args.insuranceProvider}

Status: ${isAccepted ? 'ACCEPTED' : 'NOT ACCEPTED'}

Accepted insurance providers:
${knowledgeBase.insurance.join(', ')}

${isAccepted ? 
  'This insurance is accepted. Inform the patient they should bring their insurance card to their appointment.' :
  'This insurance is not currently accepted. Suggest alternative payment options or recommend checking with their insurance about out-of-network coverage.'}`
        }
      };
      
    default:
      throw new Error(`Prompt not found: ${name}`);
  }
});

// Define available tools
const tools = [
  {
    name: 'check_doctor_availability',
    description: 'Check if a specific doctor is available at a given time',
    inputSchema: {
      type: 'object',
      properties: {
        doctorName: { type: 'string', description: 'Name of the doctor' },
        date: { type: 'string', description: 'Day of week (e.g., "monday", "tuesday")' }
      },
      required: ['doctorName', 'date']
    }
  },
  {
    name: 'find_doctors_by_specialty',
    description: 'Find doctors by their specialty',
    inputSchema: {
      type: 'object',
      properties: {
        specialty: { type: 'string', description: 'Medical specialty' }
      },
      required: ['specialty']
    }
  },
  {
    name: 'get_next_available_slot',
    description: 'Get next available appointment slot for a doctor',
    inputSchema: {
      type: 'object',
      properties: {
        doctorName: { type: 'string', description: 'Name of the doctor' },
        preferredTime: { type: 'string', description: 'Preferred time (optional)' }
      },
      required: ['doctorName']
    }
  }
];

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'check_doctor_availability':
      const availability = knowledgeBase.getDoctorAvailability(args.doctorName, args.date);
      return {
        result: {
          available: availability && availability.length > 0,
          slots: availability || [],
          message: availability ? 
            `Dr. ${args.doctorName} is available on ${args.date} at: ${availability.join(', ')}` :
            `Dr. ${args.doctorName} is not available on ${args.date}`
        }
      };
      
    case 'find_doctors_by_specialty':
      const doctors = knowledgeBase.getDoctorBySpecialty(args.specialty);
      return {
        result: {
          doctors: doctors.map(d => ({
            name: d.name,
            specialty: d.specialty,
            languages: d.languages,
            newPatients: d.newPatients
          })),
          count: doctors.length,
          message: doctors.length > 0 ?
            `Found ${doctors.length} doctors specializing in ${args.specialty}` :
            `No doctors found specializing in ${args.specialty}`
        }
      };
      
    case 'get_next_available_slot':
      const slot = knowledgeBase.getNextAvailableSlot(args.doctorName, args.preferredTime);
      return {
        result: slot ? {
          available: true,
          ...slot,
          message: `Next available slot for ${slot.doctor}: ${slot.date} at ${slot.time}`
        } : {
          available: false,
          message: `Unable to find availability for ${args.doctorName}`
        }
      };
      
    default:
      throw new Error(`Tool not found: ${name}`);
  }
});

// Start the server
async function startMCPServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('ReddyTalk MCP Server started');
  console.error('Available resources:', Object.keys(resources).length);
  console.error('Available prompts:', prompts.length);
  console.error('Available tools:', tools.length);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Start server
startMCPServer().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});