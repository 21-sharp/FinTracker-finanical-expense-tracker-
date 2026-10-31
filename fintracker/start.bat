@echo off
cls
echo ============================================================
echo      FinTrack Pro - Startup Launcher
echo ============================================================
echo.
echo Starting Backend with MySQL Database...
cd backend
start cmd /k "maven\bin\mvn.cmd spring-boot:run"

cd ../frontend
echo Starting Frontend development server...
start cmd /k "npm start"

echo.
echo Both services are starting up!
echo.
