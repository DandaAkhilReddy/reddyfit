# ReddyTalk AI Backend Testing Guide

## Quick Start

### 1. Start the Mock Backend Server
```bash
cd reddytalk
node test-backend-api.js
```

The server will run on `http://localhost:8080`

### 2. Import Postman Collection
1. Open Postman
2. Click "Import" → Select `ReddyTalk-API-Postman-Collection.json`
3. The collection will appear in your workspace

## API Endpoints Overview

### Health Checks
- `GET /health` - Basic health status
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe (checks all services)

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user

**Test Credentials:**
```json
{
  "email": "admin@reddytalk.ai",
  "password": "admin123"
}
```

### Patient Management
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get specific patient
- `POST /api/patients` - Create new patient

### Call Management
- `POST /api/calls` - Initiate new call
- `GET /api/calls` - List all calls
- `GET /api/calls/active` - Get active calls
- `POST /api/calls/:id/end` - End a call

### AI Conversation
- `POST /api/conversation/start` - Start AI conversation
- `POST /api/conversation/message` - Send message to AI

### Voice Services
- `POST /api/voice/text-to-speech` - Convert text to speech
- `POST /api/voice/speech-to-text` - Convert speech to text

## Testing Scenarios

### 1. Basic Health Check
```bash
curl http://localhost:8080/health
```

### 2. Complete Patient Flow
1. Login → Get auth token
2. Create a patient
3. Start a call with the patient
4. Start AI conversation
5. Send messages
6. End call

### 3. Voice Pipeline Test
1. Send text to TTS endpoint
2. Get audio URL
3. Send audio URL to STT endpoint
4. Verify transcription

## Manual Testing with cURL

### Health Check
```bash
curl http://localhost:8080/health
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reddytalk.ai","password":"admin123"}'
```

### Create Patient
```bash
curl -X POST http://localhost:8080/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"John Doe","phone":"+1234567890","email":"john@example.com"}'
```

### Start Conversation
```bash
curl -X POST http://localhost:8080/api/conversation/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"patientId":1,"context":"New patient inquiry"}'
```

## Testing Real Backend

To test the real backend with Azure services:

1. Ensure `.env` file has correct Azure credentials
2. Start with: `npm start`
3. The real backend includes:
   - Azure PostgreSQL database
   - Azure OpenAI integration
   - Azure Speech Services
   - Twilio voice integration

## Common Issues & Solutions

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080  # Mac/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Connection Failed
- Check Azure PostgreSQL credentials in `.env`
- Ensure your IP is whitelisted in Azure
- Use mock backend for testing without database

### Voice Services Not Working
- Verify Twilio account has voice enabled
- Check Azure Speech Services API keys
- Test with mock endpoints first

## Advanced Testing

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Create load test
artillery quick --count 10 --num 5 http://localhost:8080/health
```

### WebSocket Testing
Use Postman's WebSocket client or:
```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => {
  ws.send(JSON.stringify({type: 'join-call', callId: '123'}));
});
```

## Next Steps

1. Test all endpoints with Postman
2. Verify mock responses match expected format
3. Switch to real backend when Azure services are configured
4. Implement automated tests using the test suite