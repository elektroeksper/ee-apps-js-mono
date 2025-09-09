#!/bin/bash

# Test script to verify deployment setup
echo "🧪 Testing deployment setup..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to project root directory
cd "$SCRIPT_DIR"

echo ""
echo "1️⃣ Testing shared types build..."
pnpm build:shared:web
if [ $? -eq 0 ]; then
    echo "✅ Shared types build: PASSED"
else
    echo "❌ Shared types build: FAILED"
    exit 1
fi

echo ""
echo "2️⃣ Verifying shared types in web directory..."
if [ -d "web/src/shared-generated" ]; then
    echo "✅ Shared types directory exists: PASSED"
    
    if [ -f "web/src/shared-generated/index.js" ] && [ -f "web/src/shared-generated/shared.d.ts" ]; then
        echo "✅ Shared types files exist: PASSED"
    else
        echo "❌ Shared types files missing: FAILED"
        exit 1
    fi
else
    echo "❌ Shared types directory missing: FAILED"
    exit 1
fi

echo ""
echo "3️⃣ Testing firebase.json apphosting configuration..."
if grep -q '"apphosting"' firebase.json; then
    echo "✅ App Hosting configuration found: PASSED"
    
    if grep -q '"rootDir": "web"' firebase.json; then
        echo "✅ Root directory correctly set to 'web': PASSED"
    else
        echo "❌ Root directory not set correctly: FAILED"
        exit 1
    fi
    
    if grep -q '"predeploy"' firebase.json; then
        echo "✅ Predeploy step configured: PASSED"
    else
        echo "❌ Predeploy step missing: FAILED"
        exit 1
    fi
else
    echo "❌ App Hosting configuration missing: FAILED"
    exit 1
fi

echo ""
echo "4️⃣ Testing deployment script..."
if [ -f "deploy-apphosting.sh" ] && [ -x "deploy-apphosting.sh" ]; then
    echo "✅ Deployment script exists and is executable: PASSED"
else
    echo "❌ Deployment script issues: FAILED"
    exit 1
fi

echo ""
echo "🎉 All deployment setup tests PASSED!"
echo "📋 Setup Summary:"
echo "   ✅ Shared types: Ready"
echo "   ✅ Firebase config: Correct"
echo "   ✅ Deployment script: Ready"
echo "   ✅ Web directory: Only web/ will be uploaded"
echo ""
echo "🚀 Ready to deploy with: ./deploy-apphosting.sh test"
