#!/bin/bash

# Master deployment script for both web app and functions
# This script coordinates deployment of both components to the same environment

set -e

echo "🚀 Starting coordinated deployment of web app and functions..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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
                SELECTED_ENV="dev"
                SELECTED_PROJECT="ee-dev-apps"
                DISPLAY_ENV="DEV"
                break
                ;;
            2)
                SELECTED_ENV="prod"
                SELECTED_PROJECT="ee-prod-apps"
                DISPLAY_ENV="PROD"
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
    SELECTED_ENV="dev"
    SELECTED_PROJECT="ee-dev-apps"
    DISPLAY_ENV="DEV"
    echo "🎯 Using DEV environment (provided as argument)"
elif [ "$1" == "prod" ]; then
    SELECTED_ENV="prod"
    SELECTED_PROJECT="ee-prod-apps"
    DISPLAY_ENV="PROD"
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
echo "🎯 Selected environment: ${DISPLAY_ENV} (${SELECTED_PROJECT})"
echo ""

# Ask what to deploy
echo "📋 What would you like to deploy?"
echo "  1) Functions only"
echo "  2) Web app only"
echo "  3) Both functions and web app"
echo ""

while true; do
    read -p "🎯 Select deployment target (1, 2, or 3): " deploy_choice
    case $deploy_choice in
        1)
            DEPLOY_FUNCTIONS=true
            DEPLOY_WEB=false
            break
            ;;
        2)
            DEPLOY_FUNCTIONS=false
            DEPLOY_WEB=true
            break
            ;;
        3)
            DEPLOY_FUNCTIONS=true
            DEPLOY_WEB=true
            break
            ;;
        *)
            echo "❌ Invalid selection. Please enter 1, 2, or 3."
            ;;
    esac
done

echo ""
echo "📝 Deployment Plan:"
echo "   Environment: ${DISPLAY_ENV}"
echo "   Project: ${SELECTED_PROJECT}"
echo "   Functions: $([ "$DEPLOY_FUNCTIONS" == "true" ] && echo "✅ Yes" || echo "❌ No")"
echo "   Web App: $([ "$DEPLOY_WEB" == "true" ] && echo "✅ Yes" || echo "❌ No")"
echo ""

read -p "🚀 Proceed with deployment? (yes/no): " proceed
if [[ $proceed != "yes" && $proceed != "y" && $proceed != "Y" ]]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

# Deploy functions if requested
if [ "$DEPLOY_FUNCTIONS" == "true" ]; then
    echo ""
    echo "🔧 Deploying Firebase Functions..."
    cd functions
    ./deploy-with-config.sh $SELECTED_ENV
    cd ..
    echo "✅ Functions deployment completed"
fi

# Deploy web app if requested
if [ "$DEPLOY_WEB" == "true" ]; then
    echo ""
    echo "🌐 Deploying Web Application..."
    ./deploy-apphosting.sh $SELECTED_ENV
    echo "✅ Web app deployment completed"
fi

echo ""
echo "🎉 All deployments completed successfully!"
echo "📝 Final Summary:"
echo "   Environment: ${DISPLAY_ENV}"
echo "   Project: ${SELECTED_PROJECT}"
echo "   Functions: $([ "$DEPLOY_FUNCTIONS" == "true" ] && echo "✅ Deployed" || echo "⏭️ Skipped")"
echo "   Web App: $([ "$DEPLOY_WEB" == "true" ] && echo "✅ Deployed" || echo "⏭️ Skipped")"

if [ "$DEPLOY_WEB" == "true" ]; then
    if [ "$SELECTED_ENV" == "dev" ]; then
        echo "   Web URL: https://ee-next-dev-1--ee-dev-apps.europe-west4.hosted.app"
    else
        echo "   Web URL: https://ee-next-live--ee-prod-apps.europe-west4.hosted.app"
    fi
fi

if [ "$DEPLOY_FUNCTIONS" == "true" ]; then
    echo "   Functions URL: https://europe-west1-${SELECTED_PROJECT}.cloudfunctions.net"
fi

echo "   Console: https://console.firebase.google.com/project/${SELECTED_PROJECT}"