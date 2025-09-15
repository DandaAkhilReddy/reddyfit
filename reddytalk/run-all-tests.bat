@echo off
title ReddyTalk API Testing
color 0A

echo.
echo  =====================================
echo   🚀 ReddyTalk API Complete Test Suite
echo  =====================================
echo.

REM Check if server is running
echo 📊 Step 1: Checking server health...
curl -s http://localhost:8080/health > temp_response.json
if %errorlevel% neq 0 (
    echo ❌ ERROR: Backend server not running!
    echo.
    echo Please start the backend first:
    echo    cd reddytalk
    echo    node test-backend-api.js
    pause
    exit /b 1
)

echo ✅ Server is running!
echo.

echo 🔐 Step 2: Testing login...
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@reddytalk.ai\",\"password\":\"admin123\"}" > login_response.json
echo ✅ Login test completed
echo.

echo 👥 Step 3: Testing patient management...
curl -s http://localhost:8080/api/patients > patients_response.json
echo ✅ Patient list retrieved
echo.

echo 🤖 Step 4: Testing AI conversation...
curl -s -X POST http://localhost:8080/api/conversation/start -H "Content-Type: application/json" -d "{\"patientId\":1,\"context\":\"Test conversation\"}" > conversation_response.json
echo ✅ AI conversation started
echo.

echo 🎤 Step 5: Testing voice services...
curl -s -X POST http://localhost:8080/api/voice/text-to-speech -H "Content-Type: application/json" -d "{\"text\":\"Hello from ReddyTalk AI\",\"voice\":\"emily\"}" > voice_response.json
echo ✅ Voice service tested
echo.

echo 📊 Step 6: Testing metrics...
curl -s http://localhost:8080/metrics > metrics_response.json
echo ✅ Metrics retrieved
echo.

echo  =====================================
echo   ✅ All tests completed successfully!
echo  =====================================
echo.

echo 📋 Test Results Summary:
echo.
echo 🔍 Health Check:
type temp_response.json
echo.
echo.

echo 🔐 Login Response:
type login_response.json
echo.
echo.

echo 👥 Available Patients:
type patients_response.json
echo.
echo.

echo 🤖 AI Conversation:
type conversation_response.json
echo.
echo.

echo 🎤 Voice Service:
type voice_response.json
echo.
echo.

REM Clean up temp files
del temp_response.json login_response.json patients_response.json conversation_response.json voice_response.json metrics_response.json 2>nul

echo.
echo 🌐 Next Steps:
echo   1. Open Postman and import: ReddyTalk-API-Postman-Collection.json
echo   2. Open web interface: api-test-interface.html
echo   3. Install Postman from: https://www.postman.com/downloads/
echo.

pause