#!/bin/bash

# Switch to production environment configuration
echo "🔄 Switching to production environment..."

echo "⚠️  WARNING: You are switching to the PRODUCTION environment configuration!"
read -p "🔴 Are you sure you want to proceed? (yes/no): " confirm

if [[ $confirm == "yes" || $confirm == "y" || $confirm == "Y" ]]; then
    # Copy prod environment file to .env.local
    cp .env.prod .env.local
    
    echo "✅ Switched to production environment (ee-prod-apps)"
    echo "📋 Configuration:"
    echo "   - Project: ee-prod-apps"
    echo "   - API Keys: Production environment"
    echo "   - Functions: europe-west1-ee-prod-apps.cloudfunctions.net"
    echo ""
    echo "💡 You can now run 'npm run dev' to start the development server with production config"
    echo "⚠️  Remember: You are using PRODUCTION Firebase project!"
else
    echo "❌ Environment switch cancelled."
fi