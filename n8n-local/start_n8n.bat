@echo off
echo =====================================================
echo           Starting n8n Workflow Automation
echo =====================================================
echo.
echo n8n will be available at: http://localhost:5678
echo.
echo Default login (first time setup):
echo Email: testuser@hhamedicvine.com
echo Password: Audicia@2025
echo.
echo Starting n8n with Docker...
echo.

cd /d "%~dp0"
docker-compose up -d

echo.
echo Waiting for n8n to start...
timeout /t 10 /nobreak > nul

echo.
echo Opening n8n in your browser...
start http://localhost:5678

echo.
echo n8n is running! To stop, run: docker-compose down
echo.
pause