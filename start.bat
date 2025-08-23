@echo off
REM AetherMeet Startup Script for Windows

echo 🌟 Starting AetherMeet - Secure ^& Ephemeral Team Chat Rooms
echo ============================================================

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Check MongoDB connection
echo 🔍 Checking MongoDB connection...

REM Start the application
echo 🚀 Starting AetherMeet server...
echo 📝 Access the application at: http://localhost:5000
echo ⭐ Features:
echo    • Secure user authentication
echo    • Real-time chat rooms
echo    • Dictionary-based passwords
echo    • PDF chat export
echo    • Democratic voting system
echo.
echo Press Ctrl+C to stop the server
echo ============================================================

npm run dev
