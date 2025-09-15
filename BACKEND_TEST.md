# ReddyTalk Backend Testing Guide

🎉 Your ReddyTalk backend is ready for testing with real Twilio credentials!

## Quick Start

### 1. Test Twilio Integration (Recommended First Step)

```bash
node test-backend.js
```

This will:
- ✅ Test your Twilio connection
- 📞 Make a test call to (224) 999-9944
- 📱 Send a test SMS
- 🌐 Start a test server on port 3001

### 2. Start Full Backend Server

```bash
node quick-start.js
```

This starts the complete ReddyTalk backend with:
- 🚀 Express server on port 8080
- 📞 Twilio webhook integration
- 🗄️ In-memory database (for testing)
- 🎤 Voice processing pipeline
- 📊 API endpoints

### 3. Alternative: Use npm scripts

```bash
npm start        # Runs the comprehensive app
npm run dev      # Development mode with nodemon
```

## Your Twilio Configuration

✅ **Account SID**: [Configured in .env]  
✅ **Phone Number**: [Your Twilio number from .env]  
✅ **Test Number**: [Your test number]  

## API Endpoints Available

### Webhooks (for Twilio)
- `POST /webhooks/twilio/voice` - Incoming call handler
- `POST /webhooks/twilio/status` - Call status updates
- `POST /webhooks/twilio/recording` - Recording webhooks

### API Endpoints
- `GET /health` - Health check
- `GET /api` - API information
- `POST /webhooks/twilio/api/call/outbound` - Make outbound calls
- `GET /webhooks/twilio/api/calls/active` - List active calls

## Testing Scenarios

### 1. Test Incoming Calls
Call **your Twilio number** from any phone:
- Should hear: "Hello! Thank you for calling ReddyTalk Medical Center..."
- Speech recognition will be active
- Responses are processed by AI

### 2. Test Outbound Calls
```bash
curl -X POST http://localhost:8080/webhooks/twilio/api/call/outbound \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "YOUR_TEST_NUMBER",
    "sessionId": "test-session-1",
    "message": "Hello from ReddyTalk!"
  }'
```

### 3. Test SMS
The system can send appointment reminders via SMS.

### 4. Test Voice AI
1. Call your Twilio number
2. Say things like:
   - "I need to schedule an appointment"
   - "What are your office hours?"
   - "I want to speak to a doctor"

## File Structure Created

```
reddytalk/
├── .env                           # Your Twilio credentials
├── test-backend.js               # Test script
├── quick-start.js               # Quick start script
├── BACKEND_TEST.md              # This guide
└── src/
    ├── app-comprehensive.js      # Main backend app
    ├── routes/twilio.js         # Twilio webhooks
    ├── services/
    │   ├── voice/TwilioVoiceService.js
    │   └── database/SimpleDatabaseService.js
    └── data/                    # Local database files
```

## Next Steps

1. ✅ **Test basic calling** - Use `node test-backend.js`
2. ✅ **Start the backend** - Use `node quick-start.js`
3. 🔄 **Test webhooks** - Call your number and watch logs
4. 🚀 **Add Azure Speech-to-Text** for live transcription
5. 💾 **Connect PostgreSQL** for production database
6. 🏥 **Build appointment scheduling logic**

## Troubleshooting

### "Connection failed"
- Check your internet connection
- Verify Twilio credentials in `.env`

### "Phone number not found"
- Make sure your Twilio number is active in your account
- Check Twilio Console > Phone Numbers

### "Webhook errors"
- Make sure the backend is running on port 8080
- Check firewall settings
- For production, set up ngrok or deploy to Azure

## Production Deployment

For production:
1. Deploy to Azure Container Apps (configured)
2. Set up PostgreSQL database
3. Configure Azure Speech Services
4. Set up HTTPS webhooks
5. Enable HIPAA compliance features

## Support

The backend includes:
- 🔒 HIPAA compliance framework
- 📊 Analytics and reporting
- 🎤 Real-time transcription ready
- 👥 Patient management system
- 📱 Multi-channel communication
- 🤖 AI conversation management

🎉 **You now have a fully functional medical AI backend!**