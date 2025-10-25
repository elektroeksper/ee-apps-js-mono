#!/bin/bash

# Firebase Functions Shell - Production Environment
# This script sets up the production environment and starts the Firebase Functions shell

set -e

echo "🚀 Starting Firebase Functions Shell with PROD environment..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if production service account file exists
SERVICE_ACCOUNT_FILE="admin-service-account-prod.json"
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "❌ Error: Production service account file '$SERVICE_ACCOUNT_FILE' not found"
    echo "Please ensure the production service account file is properly set up"
    exit 1
fi

# Check if production environment file exists
ENV_FILE=".env.prod"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Production environment file '$ENV_FILE' not found"
    exit 1
fi

echo "⚠️  WARNING: You are starting the shell with PRODUCTION environment!"
read -p "🔴 Are you sure you want to proceed? (yes/no): " confirm
if [[ $confirm != "yes" && $confirm != "y" && $confirm != "Y" ]]; then
    echo "❌ Operation cancelled."
    exit 0
fi

echo "🔧 Setting up production environment..."

# Copy production environment file
echo "📝 Using production environment file: $ENV_FILE"
cp "$ENV_FILE" ".env"
echo "✅ Production environment file copied"

# Set environment variables
export PROJECT_ENV=prod
export GOOGLE_APPLICATION_CREDENTIALS="$PWD/$SERVICE_ACCOUNT_FILE"

echo "📝 Environment configuration:"
echo "   Project: ee-prod-apps"
echo "   Service Account: $SERVICE_ACCOUNT_FILE"
echo "   Environment: $PROJECT_ENV"
echo "   Functions URL: https://europe-west1-ee-prod-apps.cloudfunctions.net"

# Build functions if needed
if [ ! -d "lib" ] || [ ! "$(ls -A lib 2>/dev/null)" ]; then
    echo "🔨 Building functions..."
    npm run build
    echo "✅ Functions built successfully"
fi

echo ""
echo "🐚 Starting Firebase Functions Shell..."
echo "💡 Available functions will be loaded from the production project (ee-prod-apps)"
echo "⚠️  Remember: You are connected to the PRODUCTION environment!"
echo ""

# Start Firebase Functions shell with production project
firebase functions:shell --project ee-prod-apps