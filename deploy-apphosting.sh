#!/bin/bash

# Firebase App Hosting Deployment Script
# This script helps deploy the web app to Firebase App Hosting with target selection

set -e

echo "🚀 Starting Firebase App Hosting deployment..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root directory
cd "$SCRIPT_DIR"

# Define backend targets
LIVE_BACKEND="electro-expert-next"
TEST_BACKEND="ee-next-test"
LIVE_URL="https://electro-expert-next--elektro-ekspert-apps.europe-west4.hosted.app"
TEST_URL="https://ee-next-test--elektro-ekspert-apps.europe-west4.hosted.app"

# Function to select target
select_target() {
    echo ""
    echo "📋 Available deployment targets:"
    echo "  1) Test Environment (${TEST_BACKEND})"
    echo "  2) Live Environment (${LIVE_BACKEND})"
    echo ""
    
    while true; do
        read -p "🎯 Select deployment target (1 for test, 2 for live): " choice
        case $choice in
            1)
                SELECTED_BACKEND=$TEST_BACKEND
                SELECTED_URL=$TEST_URL
                SELECTED_ENV="TEST"
                break
                ;;
            2)
                SELECTED_BACKEND=$LIVE_BACKEND
                SELECTED_URL=$LIVE_URL
                SELECTED_ENV="LIVE"
                echo ""
                echo "⚠️  WARNING: You are deploying to the LIVE environment!"
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

# Check if target is provided as argument
if [ "$1" == "test" ]; then
    SELECTED_BACKEND=$TEST_BACKEND
    SELECTED_URL=$TEST_URL
    SELECTED_ENV="TEST"
    echo "🎯 Using TEST environment (provided as argument)"
elif [ "$1" == "live" ]; then
    SELECTED_BACKEND=$LIVE_BACKEND
    SELECTED_URL=$LIVE_URL
    SELECTED_ENV="LIVE"
    echo "🎯 Using LIVE environment (provided as argument)"
elif [ "$1" == "" ]; then
    # No argument provided, show interactive selection
    select_target
else
    echo "❌ Invalid argument. Use 'test' or 'live', or run without arguments for interactive selection."
    echo "Usage: $0 [test|live]"
    exit 1
fi

echo ""
echo "🎯 Selected target: ${SELECTED_ENV} (${SELECTED_BACKEND})"
echo "🌐 URL: ${SELECTED_URL}"

# Check if we're in the right directory
if [ ! -f "web/apphosting.yaml" ]; then
    echo "❌ Error: apphosting.yaml not found in web/ directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase"
    echo "Please run: firebase login"
    exit 1
fi

# Note: Firebase predeploy will build shared types automatically before upload
# Note: We don't run the full web:build here since App Hosting will build the app
# in the cloud using the apphosting.yaml configuration

# Deploy to App Hosting using local source
echo ""
echo "🚀 Deploying to Firebase App Hosting backend: ${SELECTED_BACKEND}..."

# Deploy using firebase deploy command from web directory
echo "📦 Deploying from web directory..."
cd web
firebase deploy --only apphosting --project elektro-ekspert-apps
cd ..

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Your app is available at: ${SELECTED_URL}"
echo "📊 Monitor deployment at: https://console.firebase.google.com/project/elektro-ekspert-apps/apphosting"
echo ""
echo "📝 Deployment Summary:"
echo "   Environment: ${SELECTED_ENV}"
echo "   Backend: ${SELECTED_BACKEND}"
echo "   Source: Local"
echo "   URL: ${SELECTED_URL}"
