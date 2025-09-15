@echo off
echo Testing ReddyTalk API Endpoints
echo ================================

echo.
echo 1. Health Check:
curl -s http://localhost:8080/health

echo.
echo.
echo 2. Login Test:
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@reddytalk.ai\",\"password\":\"admin123\"}"

echo.
echo.
echo 3. Patient List:
curl -s http://localhost:8080/api/patients

echo.
echo.
echo 4. AI Conversation Start:
curl -s -X POST http://localhost:8080/api/conversation/start -H "Content-Type: application/json" -d "{\"patientId\":1,\"context\":\"New patient\"}"

echo.
echo.
echo 5. Voice Text-to-Speech:
curl -s -X POST http://localhost:8080/api/voice/text-to-speech -H "Content-Type: application/json" -d "{\"text\":\"Hello from ReddyTalk AI\",\"voice\":\"emily\"}"

echo.
echo.
echo All tests complete!
pause