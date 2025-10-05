#!/bin/bash

# Deploy script with environment variables
# This script sets environment variables for Firebase Functions and deploys to the correct project

set -e

echo "🚀 Deploying Firebase Functions with environment variables..."

# Function to select target environment
select_environment() {
    echo ""
    echo "📋 Available deployment environments:"
    echo "  1) Dev Environment (ee-dev-apps)"
    echo "  2) Prod Environment (ee-prod-apps)"
    echo ""
    
    while true; do
        read -p "🎯 Select deployment environment (1 for dev, 2 for prod): " choice
        case $choice in
            1)
                SELECTED_PROJECT="ee-dev-apps"
                SELECTED_ENV="DEV"
                SERVICE_ACCOUNT_FILE="admin-service-account-dev.json"
                break
                ;;
            2)
                SELECTED_PROJECT="ee-prod-apps"
                SELECTED_ENV="PROD"
                SERVICE_ACCOUNT_FILE="admin-service-account-prod.json"
                echo ""
                echo "⚠️  WARNING: You are deploying to the PRODUCTION environment!"
                read -p "🔴 Are you sure you want to proceed? (yes/no): " confirm
                if [[ $confirm == "yes" || $confirm == "y" || $confirm == "Y" ]]; then
                    break
                else
                    echo "❌ Deployment cancelled."
                    exit 0
                fi
                ;;
            *)
                echo "❌ Invalid selection. Please enter 1 or 2."
                ;;
        esac
    done
}

# Check if environment is provided as argument
if [ "$1" == "dev" ]; then
    SELECTED_PROJECT="ee-dev-apps"
    SELECTED_ENV="DEV"
    SERVICE_ACCOUNT_FILE="admin-service-account-dev.json"
    echo "🎯 Using DEV environment (provided as argument)"
elif [ "$1" == "prod" ]; then
    SELECTED_PROJECT="ee-prod-apps"
    SELECTED_ENV="PROD"
    SERVICE_ACCOUNT_FILE="admin-service-account-prod.json"
    echo "🎯 Using PROD environment (provided as argument)"
elif [ "$1" == "" ]; then
    # No argument provided, show interactive selection
    select_environment
else
    echo "❌ Invalid argument. Use 'dev' or 'prod', or run without arguments for interactive selection."
    echo "Usage: $0 [dev|prod]"
    exit 1
fi

echo ""
echo "🎯 Selected environment: ${SELECTED_ENV} (${SELECTED_PROJECT})"

# Check if the service account file exists
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "❌ Error: Service account file '$SERVICE_ACCOUNT_FILE' not found"
    echo "Please ensure the service account file is properly set up for the selected environment"
    exit 1
fi

# Set environment-specific variables
export PROJECT_ENV=$([ "$SELECTED_ENV" == "DEV" ] && echo "dev" || echo "prod")
export GOOGLE_APPLICATION_CREDENTIALS="$PWD/$SERVICE_ACCOUNT_FILE"

echo "📝 Using service account: $SERVICE_ACCOUNT_FILE"
echo "📝 Project environment: $PROJECT_ENV"

# Copy the appropriate .env file for deployment BEFORE building
ENV_FILE=".env.$([ "$SELECTED_ENV" == "DEV" ] && echo "dev" || echo "prod")"
if [ -f "$ENV_FILE" ]; then
    echo "📝 Using environment file: $ENV_FILE"
    cp "$ENV_FILE" ".env"
    echo "✅ Environment file copied successfully"
else
    echo "❌ Error: Environment file '$ENV_FILE' not found"
    exit 1
fi

# Switch web environment to match deployment target
echo "🔄 Switching web environment to match deployment target..."
cd ../web
if [ "$SELECTED_ENV" == "DEV" ]; then
    ./scripts/switch-to-dev.sh
else
    ./scripts/switch-to-prod.sh
fi
cd ../functions

# Ensure shared types are built and available
echo "🔧 Building shared types for functions..."
cd ..
npm run build:shared:functions
cd functions

echo "✅ Environment configuration prepared for $SELECTED_PROJECT."

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing function dependencies..."
    npm install
fi

# Build the functions with the correct environment
echo "🔨 Building functions with environment: $PROJECT_ENV"
npm run build

# Deploy functions to the selected project
firebase deploy --only functions --project=$SELECTED_PROJECT

echo ""
echo "🎉 Deployment complete!"
echo "📝 Deployment Summary:"
echo "   Environment: ${SELECTED_ENV}"
echo "   Project: ${SELECTED_PROJECT}"
echo "   Service Account: ${SERVICE_ACCOUNT_FILE}"
echo "   Functions URL: https://europe-west1-${SELECTED_PROJECT}.cloudfunctions.net"
