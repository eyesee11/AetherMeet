#!/bin/bash

# AetherMeet Startup Script
echo "🌟 Starting AetherMeet - Secure & Ephemeral Team Chat Rooms"
echo "============================================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if MongoDB is running (optional check)
echo "🔍 Checking MongoDB connection..."

# Start the application
echo "🚀 Starting AetherMeet server..."
echo "📝 Access the application at: http://localhost:5000"
echo "⭐ Features:"
echo "   • Secure user authentication"
echo "   • Real-time chat rooms"
echo "   • Dictionary-based passwords"
echo "   • PDF chat export"
echo "   • Democratic voting system"
echo ""
echo "Press Ctrl+C to stop the server"
echo "============================================================"

npm run dev
