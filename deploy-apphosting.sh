#!/bin/bash

# Firebase App Hosting Deployment Script
# This script helps deploy the web app to Firebase App Hosting with target selection

set -e

echo "🚀 Starting Firebase App Hosting deployment..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root directory
cd "$SCRIPT_DIR"

# Cleanup function to ensure temporary files are removed
cleanup() {
    echo "🧹 Running cleanup..."
    # Always restore apphosting.yaml since we always create a backup
    if [ -f "web/apphosting.yaml.backup" ]; then
        mv web/apphosting.yaml.backup web/apphosting.yaml
        echo "✅ Restored original apphosting.yaml"
    fi
    if [ -f "web/firebase.json" ]; then
        rm web/firebase.json
        echo "✅ Removed temporary firebase.json"
    fi
}

# Set trap to run cleanup on script exit (success, error, or interruption)
trap cleanup EXIT

# Define backend targets
LIVE_BACKEND="ee-next-live"
TEST_BACKEND="ee-next-test"
DEV_BACKEND="ee-next-dev-1"
LIVE_URL="https://ee-next-live--ee-prod-apps.europe-west4.hosted.app"
TEST_URL="https://ee-next-test--ee-prod-apps.europe-west4.hosted.app"
DEV_URL="https://ee-next-dev-1--ee-dev-apps.europe-west4.hosted.app"

# Function to select target
select_target() {
    echo ""
    echo "📋 Available deployment targets:"
    echo "  1) Dev Environment (${DEV_BACKEND})"
    echo "  2) Test Environment (${TEST_BACKEND})"
    echo "  3) Live Environment (${LIVE_BACKEND})"
    echo ""
    
    while true; do
        read -p "🎯 Select deployment target (1 for dev, 2 for test, 3 for live): " choice
        case $choice in
            1)
                SELECTED_BACKEND=$DEV_BACKEND
                SELECTED_URL=$DEV_URL
                SELECTED_ENV="DEV"
                break
                ;;
            2)
                SELECTED_BACKEND=$TEST_BACKEND
                SELECTED_URL=$TEST_URL
                SELECTED_ENV="TEST"
                break
                ;;
            3)
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
                echo "❌ Invalid selection. Please enter 1, 2, or 3."
                ;;
        esac
    done
}

# Check if target is provided as argument
if [ "$1" == "dev" ]; then
    SELECTED_BACKEND=$DEV_BACKEND
    SELECTED_URL=$DEV_URL
    SELECTED_ENV="DEV"
    echo "🎯 Using DEV environment (provided as argument)"
elif [ "$1" == "test" ]; then
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
    echo "❌ Invalid argument. Use 'dev', 'test', or 'live', or run without arguments for interactive selection."
    echo "Usage: $0 [dev|test|live]"
    exit 1
fi

echo ""
echo "🎯 Selected target: ${SELECTED_ENV} (${SELECTED_BACKEND})"
echo "🌐 URL: ${SELECTED_URL}"

# Check if we're in the right directory
if [ ! -f "web/apphosting.dev.yaml" ] || [ ! -f "web/apphosting.test.yaml" ] || [ ! -f "web/apphosting.live.yaml" ]; then
    echo "❌ Error: apphosting configuration files not found in web/ directory"
    echo "Please ensure apphosting.dev.yaml, apphosting.test.yaml, and apphosting.live.yaml are properly set up"
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

# Build and copy shared types using centralized script
echo "🔨 Building and copying shared types..."
node scripts/build-shared-types.js
echo "✅ Shared types built and copied to all packages"

# Verify shared types are available for deployment
echo "� Verifying shared types for deployment..."
cd web
node scripts/verify-shared-types.js
cd ..
echo "✅ Shared types verified"

# Configure deployment files for the selected environment
echo "🔧 Configuring deployment files for ${SELECTED_ENV} environment..."

# Create web/firebase.json on-the-fly with the correct backend ID and ignore patterns
echo "📝 Creating firebase.json for backend: ${SELECTED_BACKEND}"
cat > web/firebase.json << EOF
{
  "apphosting": {
    "backendId": "${SELECTED_BACKEND}",
    "rootDir": ".",
    "ignore": [
      "node_modules/**",
      ".git/**",
      ".next/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "*.log",
      "*.local",
      ".env*",
      ".DS_Store",
      "*.swp",
      "*.swo",
      "*~",
      "README.md",
      "CHANGELOG.md",
      "LICENSE",
      "docs/**",
      "scripts/**",
      "*.md",
      "apphosting.*.yaml",
      "firebase.json.backup",
      "apphosting.yaml.backup"
    ]
  }
}
EOF

# Determine which apphosting config to use for deployment
if [ "$SELECTED_ENV" == "LIVE" ]; then
    APPHOSTING_CONFIG="apphosting.live.yaml"
    echo "✅ Using LIVE configuration: ${APPHOSTING_CONFIG}"
elif [ "$SELECTED_ENV" == "DEV" ]; then
    APPHOSTING_CONFIG="apphosting.dev.yaml"
    echo "✅ Using DEV configuration: ${APPHOSTING_CONFIG}"
else
    APPHOSTING_CONFIG="apphosting.test.yaml"
    echo "✅ Using TEST configuration: ${APPHOSTING_CONFIG}"
fi

echo "✅ Configuration files ready for ${SELECTED_ENV} environment"
echo "📝 Backend ID in web/firebase.json: ${SELECTED_BACKEND}"
echo "📝 App Hosting config: web/${APPHOSTING_CONFIG}"

# Deploy to App Hosting using standard Firebase deploy
echo ""
echo "🚀 Deploying to Firebase App Hosting backend: ${SELECTED_BACKEND}..."
echo "📝 Using configuration: web/${APPHOSTING_CONFIG}"
echo "📁 Deploying from web/ directory to upload only web folder content"

# Change to web directory for deployment
cd web

# Copy the appropriate apphosting config to use for deployment
# Create backup of current apphosting.yaml
cp apphosting.yaml apphosting.yaml.backup
# Copy environment-specific config
cp "${APPHOSTING_CONFIG}" apphosting.yaml
echo "✅ Using ${APPHOSTING_CONFIG} as apphosting.yaml"

# Deploy using standard firebase deploy command from web directory
# This ensures only the web directory content is uploaded
if [ "$SELECTED_ENV" == "DEV" ]; then
    firebase deploy --only apphosting --project ee-dev-apps
else
    firebase deploy --only apphosting --project ee-prod-apps
fi

# Return to root directory
cd ..

# Return to root directory
cd ..

echo ""
echo "🎉 Deployment completed successfully!"
fi

echo "✅ Original configuration files restored"

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Your app is available at: ${SELECTED_URL}"
if [ "$SELECTED_ENV" == "DEV" ]; then
    echo "📊 Monitor deployment at: https://console.firebase.google.com/project/ee-dev-apps/apphosting"
else
    echo "📊 Monitor deployment at: https://console.firebase.google.com/project/ee-prod-apps/apphosting"
fi
echo ""
echo "📝 Deployment Summary:"
echo "   Environment: ${SELECTED_ENV}"
echo "   Backend: ${SELECTED_BACKEND}"
if [ "$SELECTED_ENV" == "LIVE" ]; then
    echo "   Config: web/apphosting.live.yaml"
elif [ "$SELECTED_ENV" == "DEV" ]; then
    echo "   Config: web/apphosting.dev.yaml"
else
    echo "   Config: web/apphosting.test.yaml"
fi
echo "   Project: $([ "$SELECTED_ENV" == "DEV" ] && echo "ee-dev-apps" || echo "ee-prod-apps")"
echo "   Source: Local"
echo "   URL: ${SELECTED_URL}"
