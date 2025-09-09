#!/bin/bash

# Firebase Functions Config Setup Script
# Run this to set up email configuration using Firebase Functions config

echo "🔧 Setting up Firebase Functions email configuration..."

# Set email configuration
firebase functions:config:set \
  email.provider="smtp" \
  email.default_from="noreply@elektroexpert.com" \
  email.smtp.host="smtp.gmail.com" \
  email.smtp.port="587" \
  email.smtp.secure="false" \
  email.smtp.user="gltknky@gmail.com" \
  email.smtp.pass="xrpa tnnv lmuv yhbn "

echo "✅ Email configuration set!"
echo ""
echo "📋 To view current config:"
echo "firebase functions:config:get"
echo ""
echo "📋 To deploy functions:"
echo "firebase deploy --only functions"
