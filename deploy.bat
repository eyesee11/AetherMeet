@echo off
echo ========================================
echo     AetherMeet Production Deployment
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm ci --production=false
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/4] Running deployment setup...
node build-scripts/deploy.js

echo.
echo [4/4] Build complete!
echo.
echo Your application is ready for deployment.
echo Check DEPLOYMENT.md for detailed hosting instructions.
echo.

echo Available commands:
echo   npm start                 - Start the application
echo   docker build -t aethermeet .  - Build Docker image
echo   pm2 start ecosystem.config.js - Start with PM2
echo.

pause