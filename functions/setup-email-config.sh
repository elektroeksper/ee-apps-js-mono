#!/bin/bash

# Firebase Functions Environment Variables Setup Script
# Run this to set up email configuration using modern .env approach

echo "🔧 Setting up Firebase Functions email configuration..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Email Configuration for Firebase Functions
# Modern approach using environment variables instead of functions.config()

# Email Provider Settings
EMAIL_PROVIDER=smtp
DEFAULT_FROM_EMAIL=info@elektroexper.com

# SMTP Configuration for Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=elektroeksper@gmail.com
SMTP_PASS=dchz xmxl ofwy nafg

# Alternative Email Providers (if needed)
# SENDGRID_API_KEY=your_sendgrid_api_key_here
# GMAIL_CLIENT_ID=your_gmail_client_id_here
# GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
# GMAIL_REFRESH_TOKEN=your_gmail_refresh_token_here
# GMAIL_ACCESS_TOKEN=your_gmail_access_token_here
EOF
    echo "✅ .env file created!"
else
    echo "✅ .env file already exists!"
fi

echo ""
echo "📋 Configuration completed using modern environment variables approach"
echo "🔥 Your functions are now future-proof for post-March 2026 Firebase changes"
echo ""
echo "📋 To view current environment variables:"
echo "cat .env"
echo ""
echo "📋 To deploy functions:"
echo "firebase deploy --only functions"
echo ""
echo "⚠️  Important: Never commit .env file to git (it contains sensitive data)"
echo "💡 The .env file is automatically loaded by Firebase Functions v2"
