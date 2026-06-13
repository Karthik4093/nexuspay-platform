@echo off
title NexusPay Platform Launcher
color 0A
echo.
echo  ====================================================
echo   NexusPay Platform - Starting...
echo  ====================================================
echo.

cd /d E:\nexuspay-platform

echo  [1/2] Starting API Server on http://localhost:3001
start "NexusPay API" cmd /k "cd /d E:\nexuspay-platform && set PORT=3001 && npx tsx src/server.ts"

echo  Waiting 8 seconds for API to initialize...
timeout /t 8 /nobreak > nul

echo  [2/2] Starting Frontend Server on http://localhost:8080
start "NexusPay Frontend" cmd /k "cd /d E:\nexuspay-platform && npx serve frontend -p 8080"

echo  Waiting 5 seconds for frontend server...
timeout /t 5 /nobreak > nul

echo.
echo  ====================================================
echo   Opening NexusPay in Chrome...
echo  ====================================================
echo.
start chrome "http://localhost:8080"

echo.
echo  ====================================================
echo   NexusPay is LIVE!
echo.
echo   Frontend:  http://localhost:8080
echo   API:       http://localhost:3001
echo   API Docs:  http://localhost:3001/api/docs
echo.
echo   Login: admin@nexuspay.com / Admin@123456
echo  ====================================================
echo.
pause
