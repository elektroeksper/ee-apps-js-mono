#!/bin/bash

# Quick deployment script for prod environment with optional function name

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if a function name was provided
if [ -z "$1" ]; then
    echo "🚀 Deploying ALL functions to PROD environment (ee-prod-apps)..."
    cd "$SCRIPT_DIR"
    ./deploy-with-config.sh prod
else
    FUNCTION_NAME="$1"
    echo "🚀 Deploying function '$FUNCTION_NAME' to PROD environment (ee-prod-apps)..."
    
    # Validate function name exists in the codebase
    if ! grep -r "export const $FUNCTION_NAME" src/functions/ > /dev/null 2>&1; then
        echo "❌ Error: Function '$FUNCTION_NAME' not found in src/functions/"
        echo "💡 Available functions:"
        grep -r "^export const" src/functions/*.ts | sed 's/.*export const /  - /' | sed 's/ =.*//'
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
    
    # Set up environment (similar to deploy-with-config.sh)
    SELECTED_PROJECT="ee-prod-apps"
    SELECTED_ENV="PROD"
    SERVICE_ACCOUNT_FILE="admin-service-account-prod.json"
    
    echo "⚠️  WARNING: You are deploying to the PRODUCTION environment!"
    read -p "🔴 Are you sure you want to deploy '$FUNCTION_NAME' to production? (yes/no): " confirm
    if [[ ! ($confirm == "yes" || $confirm == "y" || $confirm == "Y") ]]; then
        echo "❌ Deployment cancelled."
        exit 0
    fi
    
    # Check service account file
    if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
        echo "❌ Error: Service account file '$SERVICE_ACCOUNT_FILE' not found"
        exit 1
    fi
    
    # Set environment variables
    export PROJECT_ENV="prod"
    export GOOGLE_APPLICATION_CREDENTIALS="$PWD/$SERVICE_ACCOUNT_FILE"
    
    # Copy environment file
    ENV_FILE=".env.prod"
    if [ -f "$ENV_FILE" ]; then
        echo "📝 Using environment file: $ENV_FILE"
        cp "$ENV_FILE" ".env"
    else
        echo "❌ Error: Environment file '$ENV_FILE' not found"
        exit 1
    fi
    
    # Switch web environment
    echo "🔄 Switching web environment to prod..."
    cd ../web
    ./scripts/switch-to-prod.sh
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
