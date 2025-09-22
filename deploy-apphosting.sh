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
LIVE_BACKEND="ee-next-live"
TEST_BACKEND="ee-next-test"
LIVE_URL="https://ee-next-live--elektro-ekspert-apps.europe-west4.hosted.app"
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
if [ ! -f "web/apphosting.test.yaml" ] || [ ! -f "web/apphosting.live.yaml" ]; then
    echo "❌ Error: apphosting configuration files not found in web/ directory"
    echo "Please ensure apphosting.test.yaml and apphosting.live.yaml are properly set up"
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

# Ensure web directory has standalone lock file for Firebase App Hosting
echo "🔧 Preparing web directory for deployment..."
if [ ! -f "web/pnpm-lock.yaml" ]; then
    echo "📦 Creating standalone pnpm-lock.yaml for web directory..."
    cd web
    pnpm install --frozen-lockfile=false --no-optional --ignore-workspace
    cd ..
    echo "✅ Standalone lock file created"
else
    echo "✅ Standalone lock file already exists"
fi

# Ensure shared types are built and available
echo "🔨 Building shared types..."
cd shared
pnpm run build
cd ..
echo "✅ Shared types built"

# Copy shared types to web directory for standalone deployment
echo "📂 Copying shared types to web directory..."
if [ -d "web/src/shared-generated" ]; then
    rm -rf web/src/shared-generated
fi
cp -r shared/dist web/src/shared-generated
echo "✅ Shared types copied to web directory"

# Configure firebase.json and apphosting.yaml for the selected environment
echo "🔧 Configuring deployment files for ${SELECTED_ENV} environment..."

# Create backup of original files
cp firebase.json firebase.json.backup
cp web/apphosting.yaml web/apphosting.yaml.backup

# Update firebase.json to point to the correct backend
sed -i "s/\"backendId\": \"[^\"]*\"/\"backendId\": \"$SELECTED_BACKEND\"/" firebase.json

# Copy the appropriate apphosting config to the web directory (required for remote build)
if [ "$SELECTED_ENV" == "LIVE" ]; then
    cp "web/apphosting.live.yaml" "web/apphosting.yaml"
    echo "✅ Using LIVE configuration: web/apphosting.live.yaml → web/apphosting.yaml"
else
    cp "web/apphosting.test.yaml" "web/apphosting.yaml"
    echo "✅ Using TEST configuration: web/apphosting.test.yaml → web/apphosting.yaml"
fi

echo "✅ Configuration files ready for ${SELECTED_ENV} environment"
echo "📝 Backend ID in firebase.json: ${SELECTED_BACKEND}"
echo "📝 App Hosting config: web/apphosting.yaml (uploaded for remote build)"

# Deploy to App Hosting using standard Firebase deploy
echo ""
echo "🚀 Deploying to Firebase App Hosting backend: ${SELECTED_BACKEND}..."
echo "📝 Using configuration: web/apphosting.yaml"

# Deploy using standard firebase deploy command
# The backend is determined by the backendId in firebase.json
# The apphosting.yaml is uploaded with source code for remote build configuration
firebase deploy --only apphosting --project elektro-ekspert-apps

# Restore original configuration files
echo "🔄 Restoring original configuration files..."
mv firebase.json.backup firebase.json
mv web/apphosting.yaml.backup web/apphosting.yaml
echo "✅ Original configuration files restored"

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Your app is available at: ${SELECTED_URL}"
echo "📊 Monitor deployment at: https://console.firebase.google.com/project/elektro-ekspert-apps/apphosting"
echo ""
echo "📝 Deployment Summary:"
echo "   Environment: ${SELECTED_ENV}"
echo "   Backend: ${SELECTED_BACKEND}"
echo "   Config: web/apphosting.$([ "$SELECTED_ENV" == "LIVE" ] && echo "live" || echo "test").yaml"
echo "   Source: Local"
echo "   URL: ${SELECTED_URL}"
