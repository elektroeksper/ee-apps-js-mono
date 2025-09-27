#!/bin/bash

# Local Development Setup for Firebase Upload Testing
# This script starts the Firebase emulators and sets up environment variables

echo "🚀 Starting Firebase Emulators for Local Development"

# Set environment variables for emulator mode
export USE_FIREBASE_EMULATOR=true
export NODE_ENV=development

# Start Firebase emulators in the background
echo "📡 Starting Firebase emulators for ee-dev-apps project..."
firebase emulators:start --project=ee-dev-apps --import=./emulator-data --export-on-exit &

# Wait for emulators to start
echo "⏳ Waiting for emulators to initialize..."
sleep 5

# Start Next.js dev server with emulator environment
echo "🌐 Starting Next.js development server..."
cd web
USE_FIREBASE_EMULATOR=true NODE_ENV=development pnpm run dev

# Cleanup: kill emulators when Next.js stops
echo "🧹 Cleaning up emulators..."
pkill -f "firebase emulators"