#!/usr/bin/env node

// Script to check current admin claims for users
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin
const serviceAccount = require('./admin-service-account.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'elektro-ekspert-apps'
});

const auth = getAuth(app);

async function checkAdminClaims() {
  const emailToCheck = 'gltknky@gmail.com';

  console.log(`Checking current claims for: ${emailToCheck}`);

  try {
    // Get user by email
    const user = await auth.getUserByEmail(emailToCheck);
    console.log(`\nUser found:`);
    console.log(`- UID: ${user.uid}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Email Verified: ${user.emailVerified}`);
    console.log(`- Disabled: ${user.disabled}`);

    // Get current claims
    const claims = user.customClaims || {};
    console.log(`\nCurrent Custom Claims:`, JSON.stringify(claims, null, 2));

    // Check specific admin claim
    const isAdmin = claims.admin === true;
    console.log(`\nAdmin Status: ${isAdmin ? '✅ IS ADMIN' : '❌ NOT ADMIN'}`);

    if (claims.roles) {
      console.log(`Roles: ${JSON.stringify(claims.roles)}`);
    }

  } catch (error) {
    console.error(`❌ Error checking claims for ${emailToCheck}:`, error.message);
  }

  process.exit(0);
}

checkAdminClaims();
