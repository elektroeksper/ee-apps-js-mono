#!/usr/bin/env node

/**
 * Local Email Test Script
 * This script tests the email configuration without Firebase Functions
 * Run with: node test-email.js
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Simple .env parser (since we don't have dotenv installed)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

async function testEmailConfig() {
  console.log('🧪 Starting Email Configuration Test...\n');

  // Load environment variables
  const env = loadEnv();

  // Display configuration
  console.log('📋 Current Configuration:');
  console.log(`   EMAIL_PROVIDER: ${env.EMAIL_PROVIDER || 'NOT SET'}`);
  console.log(`   SMTP_HOST: ${env.SMTP_HOST || 'NOT SET'}`);
  console.log(`   SMTP_PORT: ${env.SMTP_PORT || 'NOT SET'}`);
  console.log(`   SMTP_USER: ${env.SMTP_USER || 'NOT SET'}`);
  console.log(`   SMTP_PASS: ${env.SMTP_PASS ? `${env.SMTP_PASS.substring(0, 4)}****` : 'NOT SET'}`);
  console.log(`   SMTP_PASS Length: ${env.SMTP_PASS?.length || 0} characters`);
  console.log(`   DEFAULT_FROM_EMAIL: ${env.DEFAULT_FROM_EMAIL || 'NOT SET'}`);
  console.log('');

  // Check for placeholder values
  if (env.SMTP_PASS === 'REPLACE_WITH_NEW_APP_PASSWORD') {
    console.error('❌ SMTP_PASS is still set to placeholder value!');
    console.log('📋 Please update SMTP_PASS in .env file with your Gmail App Password');
    process.exit(1);
  }

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.error('❌ Missing required SMTP credentials!');
    process.exit(1);
  }

  // Check password format
  if (env.SMTP_PASS && env.SMTP_PASS.includes(' ')) {
    console.warn('⚠️  WARNING: SMTP_PASS contains spaces - this might cause issues');
    console.log('   Gmail app passwords should not contain spaces');
    console.log('   If Gmail gave you: "abcd efgh ijkl mnop"');
    console.log('   You should use: "abcdefghijklmnop"');
    console.log('');
  }

  // Test SMTP connection
  console.log('🔌 Testing SMTP Connection...');

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT),
    secure: env.SMTP_SECURE === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    debug: true, // Enable debug output
    logger: true, // Enable logging
  }); try {
    console.log('   Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection: SUCCESS!\n');

    // Test sending actual email
    console.log('📧 Testing Email Send...');
    const testEmail = {
      from: env.DEFAULT_FROM_EMAIL || env.SMTP_USER,
      to: env.SMTP_USER, // Send to yourself for testing
      subject: '🧪 Test Email - Configuration Working!',
      html: `
        <h2>🎉 Email Configuration Test Successful!</h2>
        <p>Your email configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ${env.DEFAULT_FROM_EMAIL || env.SMTP_USER}</p>
        <p><strong>To:</strong> ${env.SMTP_USER}</p>
        <hr>
        <p><em>This email was sent from your local test script.</em></p>
      `,
      text: `
Email Configuration Test Successful!

Your email configuration is working correctly.
Timestamp: ${new Date().toISOString()}
From: ${env.DEFAULT_FROM_EMAIL || env.SMTP_USER}
To: ${env.SMTP_USER}

This email was sent from your local test script.
      `,
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Email Send: SUCCESS!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);
    console.log('\n🎉 All tests passed! Your email configuration is working correctly.');

  } catch (error) {
    console.error('❌ Email Test Failed:');
    console.error(`   Error: ${error.message}`);

    if (error.code === 'EAUTH') {
      console.log('\n📋 Authentication Error - Possible Solutions:');
      console.log('1. Check if 2-Factor Authentication is enabled on your Gmail account');
      console.log('2. Create a new Gmail App Password:');
      console.log('   - Go to: https://myaccount.google.com/apppasswords');
      console.log('   - Select "Mail" as the app type');
      console.log('   - Copy the password without spaces');
      console.log('3. Make sure you\'re using the App Password, not your regular password');
      console.log('4. Try creating App Password with "Other (custom)" and name it "Firebase SMTP"');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n📋 Connection Error - Possible Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify SMTP settings (host, port)');
      console.log('3. Try port 465 with secure: true');
    } else {
      console.log(`\n📋 Error Code: ${error.code}`);
      console.log('   Check the error details above for more information');
    }

    process.exit(1);
  }
}

// Run the test
testEmailConfig().catch(console.error);
