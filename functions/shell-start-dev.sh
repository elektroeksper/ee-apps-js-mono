#!/bin/bash

# Firebase Functions Shell - Development Environment
# This script sets up the development environment and starts the Firebase Functions shell

set -e

echo "🚀 Starting Firebase Functions Shell with DEV environment..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if development service account file exists
SERVICE_ACCOUNT_FILE="admin-service-account-dev.json"
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "❌ Error: Development service account file '$SERVICE_ACCOUNT_FILE' not found"
    echo "Please ensure the development service account file is properly set up"
    exit 1
fi

# Check if development environment file exists
ENV_FILE=".env.dev"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Development environment file '$ENV_FILE' not found"
    exit 1
fi

echo "🔧 Setting up development environment..."

# Copy development environment file
echo "📝 Using development environment file: $ENV_FILE"
cp "$ENV_FILE" ".env"
echo "✅ Development environment file copied"

# Set environment variables
export PROJECT_ENV=dev
export GOOGLE_APPLICATION_CREDENTIALS="$PWD/$SERVICE_ACCOUNT_FILE"

echo "📝 Environment configuration:"
echo "   Project: ee-dev-apps"
echo "   Service Account: $SERVICE_ACCOUNT_FILE"
echo "   Environment: $PROJECT_ENV"
echo "   Functions URL: https://europe-west1-ee-dev-apps.cloudfunctions.net"

# Build functions if needed
if [ ! -d "lib" ] || [ ! "$(ls -A lib 2>/dev/null)" ]; then
    echo "🔨 Building functions..."
    npm run build
    echo "✅ Functions built successfully"
fi

echo ""
echo "🐚 Starting Firebase Functions Shell..."
echo "💡 Available functions will be loaded from the development project (ee-dev-apps)"
echo ""

# Start Firebase Functions shell with development project
firebase functions:shell --project ee-dev-apps