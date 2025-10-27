#!/bin/bash

# Quick deployment script for dev environment with optional function name

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if a function name was provided
if [ -z "$1" ]; then
    echo "🚀 Deploying ALL functions to DEV environment (ee-dev-apps)..."
    cd "$SCRIPT_DIR"
    ./deploy-with-config.sh dev
else
    FUNCTION_NAME="$1"
    echo "🚀 Deploying function '$FUNCTION_NAME' to DEV environment (ee-dev-apps)..."
    
    # Validate function name exists in the codebase
    if ! grep -r "export const $FUNCTION_NAME" src/functions/ > /dev/null 2>&1; then
        echo "❌ Error: Function '$FUNCTION_NAME' not found in src/functions/"
        echo "💡 Available functions:"
        grep -r "^export const" src/functions/*.ts | sed 's/.*export const /  - /' | sed 's/ =.*//'
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
    
    # Set up environment (similar to deploy-with-config.sh)
    SELECTED_PROJECT="ee-dev-apps"
    SELECTED_ENV="DEV"
    SERVICE_ACCOUNT_FILE="admin-service-account-dev.json"
    
    # Check service account file
    if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
        echo "❌ Error: Service account file '$SERVICE_ACCOUNT_FILE' not found"
        exit 1
    fi
    
    # Set environment variables
    export PROJECT_ENV="dev"
    export GOOGLE_APPLICATION_CREDENTIALS="$PWD/$SERVICE_ACCOUNT_FILE"
    
    # Copy environment file
    ENV_FILE=".env.dev"
    if [ -f "$ENV_FILE" ]; then
        echo "📝 Using environment file: $ENV_FILE"
        cp "$ENV_FILE" ".env"
    else
        echo "❌ Error: Environment file '$ENV_FILE' not found"
        exit 1
    fi
    
    # Switch web environment
    echo "🔄 Switching web environment to dev..."
    cd ../web
    ./scripts/switch-to-dev.sh
    cd ../functions
    
    # Build shared types
    echo "🔧 Building shared types..."
    cd ..
    npm run build:shared:functions
    cd functions
    
    # Build functions
    echo "🔨 Building functions..."
    npm run build
    
    # Deploy only the specified function
    echo "🚀 Deploying function: $FUNCTION_NAME"
    firebase deploy --only functions:$FUNCTION_NAME --project=$SELECTED_PROJECT
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "📝 Function: $FUNCTION_NAME"
    echo "📝 Project: $SELECTED_PROJECT"
    echo "📝 URL: https://europe-west1-${SELECTED_PROJECT}.cloudfunctions.net/$FUNCTION_NAME"
fi
