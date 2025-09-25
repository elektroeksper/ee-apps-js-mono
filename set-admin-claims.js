#!/usr/bin/env node

// Script to set admin claims for a user
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin
const serviceAccount = require('./functions/admin-service-account.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'ee-prod-apps'
});

const auth = getAuth(app);

async function setAdminClaims() {
  const emailToUpdate = 'gltknky@gmail.com'; // Change this to your email

  console.log(`Setting admin claims for: ${emailToUpdate}`);

  try {
    // Get user by email
    const user = await auth.getUserByEmail(emailToUpdate);
    console.log(`\nUser found:`);
    console.log(`- UID: ${user.uid}`);
    console.log(`- Email: ${user.email}`);

    // Get current claims
    const currentClaims = user.customClaims || {};
    console.log(`\nCurrent Claims:`, JSON.stringify(currentClaims, null, 2));

    // Set admin claim
    const newClaims = { ...currentClaims, admin: true };
    await auth.setCustomUserClaims(user.uid, newClaims);

    console.log(`\n✅ Successfully set admin claims!`);
    console.log(`New Claims:`, JSON.stringify(newClaims, null, 2));

    // Verify the update
    const updatedUser = await auth.getUser(user.uid);
    const verifyingClaims = updatedUser.customClaims || {};
    const isAdmin = verifyingClaims.admin === true;

    console.log(`\n🔍 Verification:`);
    console.log(`Admin Status: ${isAdmin ? '✅ IS ADMIN' : '❌ NOT ADMIN'}`);

    if (isAdmin) {
      console.log(`\n🎉 User ${emailToUpdate} now has admin privileges!`);
      console.log(`\n📝 Note: The user will need to refresh their auth token to see the changes.`);
      console.log(`   - Log out and log back in, or`);
      console.log(`   - Wait for the token to refresh automatically (up to 1 hour)`);
    }

  } catch (error) {
    console.error(`❌ Error setting admin claims for ${emailToUpdate}:`, error.message);
  }

  process.exit(0);
}

setAdminClaims();
