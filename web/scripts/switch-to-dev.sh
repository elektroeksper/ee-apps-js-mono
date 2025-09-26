#!/bin/bash

# Switch to development environment configuration
echo "🔄 Switching to development environment..."

# Copy dev environment file to .env.local
cp .env.dev .env.local

echo "✅ Switched to development environment (ee-dev-apps)"
echo "📋 Configuration:"
echo "   - Project: ee-dev-apps"
echo "   - API Keys: Development environment"
echo "   - Functions: europe-west1-ee-dev-apps.cloudfunctions.net"
echo ""
echo "💡 You can now run 'npm run dev' to start the development server"