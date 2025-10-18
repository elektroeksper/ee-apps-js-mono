/**
 * Inspect business user data - READ ONLY
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Read service account
const serviceAccount = JSON.parse(
  readFileSync('./functions/admin-service-account-dev.json', 'utf8')
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// IMPORTANT: Specify the database ID because ee-dev-apps uses 'native-db', not '(default)'
const db = admin.firestore();
db.settings({
  databaseId: 'native-db'
});

async function inspectBusinessData(email) {
  console.log(`\n🔍 INSPECTING business data for: ${email}`);
  console.log('='.repeat(70));

  try {
    // Find user
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      console.log('\n❌ No user found with email:', email);
      console.log('\n📋 Listing first 10 users in database:');
      const allUsers = await usersRef.limit(10).get();
      if (allUsers.empty) {
        console.log('  No users found in database!');
      } else {
        allUsers.forEach(doc => {
          const data = doc.data();
          console.log(`  - ${data.email} (${data.accountType}) - ID: ${doc.id}`);
        });
      }
      return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    console.log('\n👤 USER DOCUMENT');
    console.log('─'.repeat(70));
    console.log('User ID:', userDoc.id);
    console.log('Email:', userData.email);
    console.log('Name:', userData.firstName, userData.lastName);
    console.log('Display Name:', userData.displayName || 'NOT SET');
    console.log('Phone:', userData.phoneNumber || 'NOT SET');
    console.log('Account Type:', userData.accountType);
    console.log('Is Admin:', userData.isAdmin || false);
    console.log('Email Verified:', userData.isEmailVerified || false);

    if (userData.address) {
      console.log('\nUser Address:', JSON.stringify(userData.address, null, 2));
    }

    console.log('\n📊 BUSINESS INFO (from user doc)');
    console.log('─'.repeat(70));
    if (!userData.businessInfo) {
      console.log('❌ No businessInfo in user document!');
      return;
    }

    console.log(JSON.stringify(userData.businessInfo, null, 2));

    const businessId = userData.businessInfo.businessId;
    if (!businessId) {
      console.log('\n❌ No businessId in businessInfo!');
      return;
    }

    console.log('\n🏢 BUSINESS DOCUMENT');
    console.log('─'.repeat(70));
    console.log('Business ID:', businessId);

    // Get business document
    const businessDoc = await db.collection('businesses').doc(businessId).get();

    if (!businessDoc.exists) {
      console.log('❌ Business document NOT FOUND in database!');
      console.log('\n📋 Listing first 10 businesses:');
      const allBusinesses = await db.collection('businesses').limit(10).get();
      if (allBusinesses.empty) {
        console.log('  No businesses found in database!');
      } else {
        allBusinesses.forEach(doc => {
          const data = doc.data();
          console.log(`  - ${data.businessName} - ID: ${doc.id}`);
        });
      }
      return;
    }

    const businessData = businessDoc.data();

    console.log('\n📝 BASIC INFO');
    console.log('  Business Name:', businessData.businessName || '❌ NOT SET');
    console.log('  Tax Number:', businessData.taxNumber || '❌ NOT SET');
    console.log('  Tax Office:', businessData.taxOffice || '❌ NOT SET');
    console.log('  Tax Number Type:', businessData.taxNumberType || '❌ NOT SET');
    console.log('  Identity Number:', businessData.identityNumber || '❌ NOT SET');

    console.log('\n📞 CONTACT INFO');
    console.log('  Phone:', businessData.phone || '❌ NOT SET');
    console.log('  Email:', businessData.email || '❌ NOT SET');
    console.log('  Website:', businessData.website || '❌ NOT SET');

    console.log('\n📍 ADDRESS(ES)');
    if (businessData.addresses && businessData.addresses.length > 0) {
      businessData.addresses.forEach((addr, idx) => {
        console.log(`  Address ${idx + 1}:`);
        console.log('    Formatted:', addr.formattedAddress || 'NO FORMATTED ADDRESS');
        console.log('    City:', addr.city || 'NOT SET');
        console.log('    District:', addr.district || 'NOT SET');
        console.log('    Street:', addr.street || 'NOT SET');
        console.log('    Door:', addr.doorNumber || 'NOT SET');
        console.log('    Type:', addr.type || 'NOT SET');
      });
    } else {
      console.log('  ❌ NO ADDRESSES SET');
    }

    console.log('\n📄 OTHER INFO');
    console.log('  Description:', businessData.description || '❌ NOT SET');
    console.log('  Company Size:', businessData.companySize || '❌ NOT SET');
    console.log('  Main Category ID:', businessData.mainCategoryId || '❌ NOT SET');
    console.log('  Sub Category IDs:', businessData.subCategoryIds || '❌ NOT SET');

    console.log('\n✅ VERIFICATION STATUS');
    if (businessData.verification) {
      console.log('  Status:', businessData.verification.status || 'NOT SET');
      console.log('  History Entries:', businessData.verification.history?.length || 0);
      if (businessData.verification.history && businessData.verification.history.length > 0) {
        console.log('  Latest history:');
        const latest = businessData.verification.history[businessData.verification.history.length - 1];
        console.log('   ', JSON.stringify(latest, null, 4));
      }
    } else {
      console.log('  ❌ NO VERIFICATION OBJECT');
    }

    console.log('\n📑 DOCUMENTS');
    if (businessData.documents && businessData.documents.length > 0) {
      console.log(`  ${businessData.documents.length} document(s) uploaded`);
      businessData.documents.forEach((doc, idx) => {
        console.log(`  Document ${idx + 1}:`);
        console.log('    Type:', doc.type);
        console.log('    Status:', doc.status);
        console.log('    URL:', doc.url);
      });
    } else {
      console.log('  ❌ NO DOCUMENTS');
    }

    console.log('\n👥 USERS IN BUSINESS');
    if (businessData.users && Object.keys(businessData.users).length > 0) {
      Object.entries(businessData.users).forEach(([userId, userInfo]) => {
        console.log(`  - ${userInfo.email} (${userInfo.role})`);
        console.log(`    Name: ${userInfo.displayName}`);
        console.log(`    Active: ${userInfo.isActive}`);
      });
    } else {
      console.log('  ❌ NO USERS IN BUSINESS');
    }

    console.log('\n⚙️  METADATA');
    console.log('  Owner ID:', businessData.ownerId || '❌ NOT SET');
    console.log('  Is Active:', businessData.isActive !== undefined ? businessData.isActive : '❌ NOT SET');
    console.log('  Created At:', businessData.createdAt?.toDate?.() || businessData.createdAt || '❌ NOT SET');
    console.log('  Updated At:', businessData.updatedAt?.toDate?.() || businessData.updatedAt || '❌ NOT SET');

    console.log('\n' + '='.repeat(70));
    console.log('✅ INSPECTION COMPLETE');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

// Run
const email = process.argv[2] || 'gltknky@gmail.com';
inspectBusinessData(email);
