/**
 * Debug and Fix Business User Data
 * This script helps debug and complete business information for a user
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./functions/admin-service-account-dev.json', 'utf8')
);

// Initialize Firebase Admin for remote database (ee-dev-apps)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

console.log('🔧 Connecting to remote Firebase project: ee-dev-apps\n');

async function debugBusinessUser(email) {
  console.log(`\n🔍 Debugging business user: ${email}\n`);

  try {
    // 1. Find user by email - try different approaches
    console.log('Step 1: Finding user...');

    // First, let's list all collections to see what's available
    try {
      const collections = await db.listCollections();
      console.log('📂 Available collections:', collections.map(c => c.id).join(', '));
    } catch (err) {
      console.log('⚠️  Could not list collections:', err.message);
    }

    // Try to get all users to see if any exist
    try {
      const allUsers = await db.collection('users').limit(5).get();
      console.log(`📊 Found ${allUsers.size} users in total (showing max 5)`);
      if (!allUsers.empty) {
        allUsers.forEach(doc => {
          const data = doc.data();
          console.log(`  - User ID: ${doc.id}, Email: ${data.email}, Name: ${data.firstName} ${data.lastName}`);
        });
      }
    } catch (err) {
      console.log('⚠️  Could not list users:', err.message);
    }

    const usersSnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('❌ User not found!');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    console.log('✅ User found:', userDoc.id);
    console.log('User data:', JSON.stringify(userData, null, 2));

    // 2. Check business info
    console.log('\n Step 2: Checking business info...');
    if (!userData.businessInfo) {
      console.error('❌ User has no businessInfo field!');
      return;
    }

    const businessId = userData.businessInfo.businessId;
    console.log('✅ Business ID:', businessId);
    console.log('Business info:', JSON.stringify(userData.businessInfo, null, 2));

    // 3. Fetch business document
    console.log('\nStep 3: Fetching business document...');
    const businessDoc = await db.collection('businesses').doc(businessId).get();

    if (!businessDoc.exists) {
      console.error('❌ Business document not found!');
      return;
    }

    const businessData = businessDoc.data();
    console.log('✅ Business document found');
    console.log('Business data:', JSON.stringify(businessData, null, 2));

    // 4. Analyze missing fields
    console.log('\n📊 Analysis:');
    console.log('─────────────────────────────────────');

    const requiredFields = [
      'businessName',
      'taxNumber',
      'taxOffice',
      'phone',
      'email',
      'addresses',
      'ownerId',
      'verification',
    ];

    const missingFields = [];
    const emptyFields = [];

    requiredFields.forEach(field => {
      if (!businessData[field]) {
        missingFields.push(field);
      } else if (Array.isArray(businessData[field]) && businessData[field].length === 0) {
        emptyFields.push(field);
      } else if (typeof businessData[field] === 'string' && businessData[field].trim() === '') {
        emptyFields.push(field);
      }
    });

    console.log('\n✅ Present fields:');
    requiredFields
      .filter(f => !missingFields.includes(f) && !emptyFields.includes(f))
      .forEach(field => {
        console.log(`   - ${field}: ${JSON.stringify(businessData[field])}`);
      });

    if (emptyFields.length > 0) {
      console.log('\n⚠️  Empty fields:');
      emptyFields.forEach(field => console.log(`   - ${field}`));
    }

    if (missingFields.length > 0) {
      console.log('\n❌ Missing fields:');
      missingFields.forEach(field => console.log(`   - ${field}`));
    }

    // 5. Suggest fixes
    console.log('\n🔧 Suggested fixes:');
    console.log('─────────────────────────────────────');

    const updates = {};

    if (!businessData.businessName || businessData.businessName.trim() === '') {
      updates.businessName = userData.displayName || `${userData.firstName} ${userData.lastName}`.trim() || 'Test Business';
      console.log(`✓ Set businessName: "${updates.businessName}"`);
    }

    if (!businessData.phone || businessData.phone.trim() === '') {
      updates.phone = userData.phoneNumber || '+905551234567';
      console.log(`✓ Set phone: "${updates.phone}"`);
    }

    if (!businessData.email || businessData.email.trim() === '') {
      updates.email = userData.email;
      console.log(`✓ Set email: "${updates.email}"`);
    }

    if (!businessData.taxNumber || businessData.taxNumber.trim() === '') {
      updates.taxNumber = '1234567890';
      console.log(`✓ Set taxNumber: "${updates.taxNumber}"`);
    }

    if (!businessData.taxOffice || businessData.taxOffice.trim() === '') {
      updates.taxOffice = 'İstanbul Vergi Dairesi';
      console.log(`✓ Set taxOffice: "${updates.taxOffice}"`);
    }

    if (!businessData.addresses || businessData.addresses.length === 0) {
      updates.addresses = [
        {
          city: 'İstanbul',
          district: 'Kadıköy',
          neighborhood: 'Moda',
          street: 'Test Sokak',
          doorNumber: '123',
          formattedAddress: 'Test Sokak No:123, Moda, Kadıköy, İstanbul',
          type: 'business',
        },
      ];
      console.log(`✓ Set addresses with default business address`);
    }

    if (!businessData.ownerId || businessData.ownerId.trim() === '') {
      updates.ownerId = userDoc.id;
      console.log(`✓ Set ownerId: "${updates.ownerId}"`);
    }

    if (!businessData.verification) {
      updates.verification = {
        status: 'unverified',
        history: [],
      };
      console.log(`✓ Set verification status: "unverified"`);
    }

    if (!businessData.isActive) {
      updates.isActive = true;
      console.log(`✓ Set isActive: true`);
    }

    if (!businessData.users || Object.keys(businessData.users).length === 0) {
      updates.users = {
        [userDoc.id]: {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email,
          role: 'owner',
          isActive: true,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      };
      console.log(`✓ Set users map with owner`);
    }

    // 6. Apply fixes
    if (Object.keys(updates).length > 0) {
      console.log('\n🔄 Applying fixes...');

      await db.collection('businesses').doc(businessId).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ Business document updated successfully!');

      // Fetch and display updated data
      const updatedDoc = await db.collection('businesses').doc(businessId).get();
      console.log('\n📋 Updated business data:');
      console.log(JSON.stringify(updatedDoc.data(), null, 2));
    } else {
      console.log('\n✅ No fixes needed - business data is complete!');
    }

    console.log('\n✅ Debug complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run the debug script
const email = process.argv[2] || 'gltknky@gmail.com';
debugBusinessUser(email);
