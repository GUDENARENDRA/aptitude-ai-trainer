@echo off
title Aptitude Trainer Launcher
echo ===================================================
echo   Starting Aptitude & Interview Trainer Platform
echo ===================================================
echo.

REM Start Backend Server in a new window
echo Starting Backend Server on http://localhost:5000 ...
start "Aptitude Backend Server" cmd /k "cd /d "%~dp0server" && node server.js"

REM Start Frontend Dev Server in a new window
echo Starting Frontend Web App on http://localhost:5173 ...
start "Aptitude Frontend Client" cmd /k "cd /d "%~dp0client" && npm run dev"

REM Wait 3 seconds then open default browser
timeout /t 3 >nul
echo Opening Web Browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo Both services started successfully!
echo Close the command windows to stop the servers when finished.
echo.
