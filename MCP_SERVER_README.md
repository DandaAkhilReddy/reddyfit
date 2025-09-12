# ReddyTalk MCP Server

## Overview

The ReddyTalk MCP (Model Context Protocol) Server provides AI assistants with direct access to medical practice operations including appointment scheduling, patient management, insurance verification, and voice call analytics.

## Features

### 🏥 **Medical Operations**
- Real-time appointment scheduling and management
- Insurance verification and coverage checking
- Patient triage and symptom analysis
- Medication information lookup
- Emergency protocol guidance

### 📞 **Voice Integration** 
- AI-powered voice call management
- Call transcription and analytics
- Real-time conversation monitoring
- Multi-language support

### 📊 **Analytics & Reporting**
- Live call metrics and performance data
- Patient queue management
- Wait time estimation
- Daily operational insights

### 🔒 **HIPAA Compliance**
- Encrypted data transmission
- Audit logging for all operations
- Secure patient information handling
- Role-based access controls

## Quick Start

### 1. Setup (Automated)
```bash
# Run the setup script
chmod +x scripts/mcp-setup.sh
./scripts/mcp-setup.sh
```

### 2. Test the Server
```bash
npm run mcp:test
```

### 3. Start the Server
```bash
npm run mcp:start
```

## Available Tools

### Appointment Management
- `schedule_appointment` - Schedule new appointments with validation
- `cancel_appointment` - Cancel existing appointments
- `reschedule_appointment` - Reschedule to new date/time
- `add_to_waitlist` - Add patients to appointment waitlist

### Insurance & Billing
- `verify_insurance` - Real-time insurance verification
- `check_coverage` - Check coverage for specific procedures

### Patient Care
- `analyze_symptoms` - AI-powered symptom triage
- `check_wait_time` - Current wait times for services
- `get_prescription_info` - Medication information lookup

### Voice & Communication
- `create_voice_call` - Initiate AI-powered calls
- `get_call_transcript` - Retrieve call transcriptions

## Available Resources

### Real-time Data
- `reddytalk://clinic-info` - Current clinic status and hours
- `reddytalk://appointments` - Today's appointment schedule  
- `reddytalk://patient-queue` - Current patient wait times
- `reddytalk://call-analytics` - Live call performance metrics

### Reference Data
- `reddytalk://doctors` - Doctor directory with specialties
- `reddytalk://services` - Available medical services
- `reddytalk://insurance` - Accepted insurance providers
- `reddytalk://emergency-protocols` - Emergency response procedures

## Prompts

### Medical Assistant
```typescript
// Advanced medical receptionist with full context
await mcp.getPrompt('medical-receptionist-advanced', {
  conversationMode: 'voice',
  patientContext: 'returning patient'
});
```

### Emergency Triage  
```typescript
// Emergency assessment and guidance
await mcp.getPrompt('emergency-triage', {
  symptoms: 'chest pain, shortness of breath'
});
```

### Insurance Navigator
```typescript
// Insurance coverage explanation
await mcp.getPrompt('insurance-navigator', {
  insuranceType: 'Blue Cross',
  procedure: 'MRI scan'
});
```

## Configuration

### Environment Variables
```bash
# Core Settings
NODE_ENV=production
MCP_SERVER_PORT=9001
LOG_LEVEL=info

# Features
ENABLE_REAL_TIME=true
ENABLE_VOICE_INTEGRATION=true

# Database (if using real data)
DATABASE_URL=postgresql://user:pass@host:5432/reddytalk
```

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "reddytalk": {
      "command": "node",
      "args": ["/path/to/reddytalk/src/mcp/enhanced-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Example Usage

### Schedule an Appointment
```javascript
const result = await client.callTool('schedule_appointment', {
  patientName: 'John Doe',
  patientPhone: '+1-555-0123', 
  doctorName: 'Dr. Sarah Johnson',
  appointmentType: 'General Checkup',
  preferredDate: 'monday',
  reason: 'Annual physical'
});
```

### Verify Insurance
```javascript
const verification = await client.callTool('verify_insurance', {
  insuranceProvider: 'Aetna',
  memberId: '123456789',
  serviceType: 'office visit'
});
```

### Analyze Symptoms
```javascript
const triage = await client.callTool('analyze_symptoms', {
  symptoms: ['fever', 'headache', 'fatigue'],
  severity: 'moderate',
  duration: '2 days'
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Assistant (Claude)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol
┌─────────────────────▼───────────────────────────────────────┐
│                ReddyTalk MCP Server                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Tools     │  │  Resources  │  │      Prompts        │  │
│  │ • Schedule  │  │ • Clinic    │  │ • Med Receptionist  │  │
│  │ • Verify    │  │ • Analytics │  │ • Emergency Triage  │  │
│  │ • Analyze   │  │ • Queue     │  │ • Insurance Guide   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 ReddyTalk Services                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │   Database   │ │ Voice Engine │ │   Knowledge Base     │ │
│  │   Service    │ │   Service    │ │      Service         │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Testing

### Run Full Test Suite
```bash
npm run mcp:test
```

### Manual Testing
```bash
# Start server in one terminal
npm run mcp:start

# Test individual components
node src/mcp/client-example.js
```

## Troubleshooting

### Common Issues

1. **"MCP Server not responding"**
   ```bash
   # Check if server is running
   ps aux | grep mcp
   
   # Restart server
   npm run mcp:start
   ```

2. **"Permission denied"**
   ```bash
   # Fix permissions
   chmod +x src/mcp/*.js
   chmod +x scripts/*.sh
   ```

3. **"Module not found"**
   ```bash
   # Reinstall dependencies
   npm install @modelcontextprotocol/sdk
   ```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run mcp:start
```

## Security

- All patient data is handled in compliance with HIPAA
- Encrypted communication using MCP protocol
- Audit logs for all operations
- Role-based access control ready

## Contributing

1. Follow existing code patterns
2. Add tests for new tools/resources
3. Update documentation
4. Test with real medical scenarios

## License

Proprietary - ReddyTalk.ai Team

## Support

For technical support or feature requests:
- Create an issue in the repository
- Contact the ReddyTalk.ai development team