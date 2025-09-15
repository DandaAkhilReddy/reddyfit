# 🚀 ReddyTalk Backend Testing Guide

## Current Status
✅ **Backend Server**: Running on `http://localhost:8080`  
✅ **API Endpoints**: All working with mock data  
⚠️ **Frontend**: Has dependency issues (we'll use web interface instead)

## Option 1: Simple Web Interface (Ready Now)

### Step 1: Open the Test Interface
```bash
# Navigate to your project
cd C:\users\akhil\reddytalk

# Open the web interface
start api-test-interface.html
```

**Or double-click**: `api-test-interface.html`

### Step 2: Test Key Features
1. **Server Status**: Should show "Server Online"
2. **Quick Login**: Click "Quick Login" button
3. **Test Endpoints**: Try each section:
   - Health Checks ✅
   - Authentication ✅ 
   - Patient Management ✅
   - AI Conversation ✅
   - Voice Services ✅

## Option 2: Install Postman (Recommended)

### Step 1: Install Postman
**Choose one method:**

**Method A: Direct Download**
1. Go to: https://www.postman.com/downloads/
2. Download Windows version
3. Install and create free account

**Method B: Via Package Manager**
```bash
# If you have Chocolatey:
choco install postman

# If you have Winget:
winget install Postman.Postman

# If you have Scoop:
scoop install postman
```

### Step 2: Import Collection
1. Open Postman
2. Click **Import** (top left)
3. Select file: `ReddyTalk-API-Postman-Collection.json`
4. Collection appears in left sidebar

### Step 3: Test with Postman
1. **Set Base URL**: Should be `http://localhost:8080`
2. **Test Login**: Authentication → Login
3. **Auto-save token**: Login saves auth token automatically
4. **Test other endpoints**: Try patients, calls, conversations

## Current Test Results (Working!)

### ✅ Health Check
```bash
curl http://localhost:8080/health
```
**Response**:
```json
{
  "status": "healthy",
  "service": "ReddyTalk Mock Backend",
  "uptime": 516
}
```

### ✅ Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reddytalk.ai","password":"admin123"}'
```
**Response**:
```json
{
  "success": true,
  "token": "mock-jwt-token-xyz",
  "user": {"id": 1, "email": "admin@reddytalk.ai", "role": "admin"}
}
```

### ✅ Patients List
```bash
curl http://localhost:8080/api/patients
```
**Response**:
```json
{
  "success": true,
  "patients": [
    {"id": 1, "name": "John Doe", "phone": "+1234567890"},
    {"id": 2, "name": "Jane Smith", "phone": "+0987654321"}
  ]
}
```

## Quick Manual Tests

### Test 1: Basic Flow
```bash
cd reddytalk

# 1. Health check
curl http://localhost:8080/health

# 2. Login (save the token)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reddytalk.ai","password":"admin123"}'

# 3. Get patients
curl http://localhost:8080/api/patients
```

### Test 2: AI Conversation
```bash
# Start conversation
curl -X POST http://localhost:8080/api/conversation/start \
  -H "Content-Type: application/json" \
  -d '{"patientId":1,"context":"New patient calling"}'

# Send message
curl -X POST http://localhost:8080/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"conv-123","message":"I need an appointment"}'
```

### Test 3: Voice Services
```bash
# Text to Speech
curl -X POST http://localhost:8080/api/voice/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from ReddyTalk AI","voice":"emily"}'
```

## Troubleshooting

### Backend Not Running?
```bash
cd reddytalk
node test-backend-api.js
```
**Should show**: "Server running on http://localhost:8080"

### Port 8080 Busy?
```bash
# Windows - find what's using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### CORS Issues?
- Backend has CORS enabled for localhost
- Use `http://localhost:8080` (not 127.0.0.1)

## Next Steps

### 1. Complete Local Testing
- [ ] Install Postman
- [ ] Import collection  
- [ ] Test all endpoints
- [ ] Verify AI responses

### 2. Fix Frontend (Later)
- [ ] Install missing dependencies
- [ ] Fix routing issues
- [ ] Build and run frontend

### 3. Real Backend Integration
- [ ] Fix Azure database connection
- [ ] Test with real AI services
- [ ] Enable Twilio voice calls

## API Endpoints Summary

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/health` | GET | Basic health | ✅ |
| `/health/ready` | GET | Full readiness | ✅ |
| `/api/auth/login` | POST | Authentication | ✅ |
| `/api/patients` | GET | List patients | ✅ |
| `/api/patients` | POST | Create patient | ✅ |
| `/api/calls` | POST | Start call | ✅ |
| `/api/conversation/start` | POST | AI conversation | ✅ |
| `/api/voice/text-to-speech` | POST | TTS service | ✅ |

**All endpoints working with mock data!** 🎉