@echo off
echo Opening ReddyTalk API Test Interface...
echo.
echo Make sure the backend server is running:
echo   node test-backend-api.js
echo.
echo Opening in default browser...
start "" "api-test-interface.html"
echo.
echo Interface URL: file://%CD%/api-test-interface.html
pause