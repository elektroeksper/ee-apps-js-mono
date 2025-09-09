#!/bin/bash

# Deploy script with environment variables
# This script sets environment variables for Firebase Functions

echo "🚀 Deploying Firebase Functions with environment variables..."

# Set environment variables for production
firebase functions:config:set \
  email.provider="smtp" \
  email.default_from="noreply@elektroexpert.com" \
  email.smtp.host="smtp.gmail.com" \
  email.smtp.port="587" \
  email.smtp.secure="false" \
  email.smtp.user="gltknky@gmail.com" \
  email.smtp.pass="xrpa tnnv lmuv yhbn "

echo "✅ Environment variables set. Now deploying functions..."

# Deploy functions
firebase deploy --only functions

echo "🎉 Deployment complete!"
