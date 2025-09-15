@echo off
echo Stopping existing backend server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    taskkill /f /pid %%a 2>nul
)

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting backend server...
start /B node test-backend-api.js

echo Backend server restarted!
timeout /t 2 /nobreak >nul