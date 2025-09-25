#!/bin/bash

echo "========================================"
echo "    AetherMeet Production Deployment"
echo "========================================"
echo

echo "[1/4] Installing dependencies..."
npm ci --production=false
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo
echo "[2/4] Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed"
    exit 1
fi

echo
echo "[3/4] Running deployment setup..."
node build-scripts/deploy.js

echo
echo "[4/4] Build complete!"
echo
echo "Your application is ready for deployment."
echo "Check DEPLOYMENT.md for detailed hosting instructions."
echo

echo "Available commands:"
echo "  npm start                      - Start the application"
echo "  docker build -t aethermeet .   - Build Docker image"
echo "  pm2 start ecosystem.config.js - Start with PM2"
echo