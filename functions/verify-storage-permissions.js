#!/usr/bin/env node

/**
 * Verify Storage Permissions Script
 * This script tests if the Firebase Admin service account has proper permissions
 * for the storage bucket in both dev and prod environments.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

// Test storage permissions for a given environment
async function testStoragePermissions(environment) {
  console.log(`\n🧪 Testing storage permissions for ${environment.toUpperCase()} environment...`);
  
  try {
    // Determine project and service account based on environment
    const projectConfig = environment === 'dev' 
      ? {
          projectId: 'ee-dev-apps',
          storageBucket: 'ee-dev-apps.firebasestorage.app',
          serviceAccountFile: './admin-service-account-dev.json'
        }
      : {
          projectId: 'ee-prod-apps', 
          storageBucket: 'ee-prod-apps.firebasestorage.app',
          serviceAccountFile: './admin-service-account-prod.json'
        };

    console.log(`📝 Project: ${projectConfig.projectId}`);
    console.log(`🪣 Storage Bucket: ${projectConfig.storageBucket}`);
    console.log(`🔐 Service Account File: ${projectConfig.serviceAccountFile}`);

    // Check if service account file exists
    const fs = require('fs');
    if (!fs.existsSync(projectConfig.serviceAccountFile)) {
      console.error(`❌ Service account file not found: ${projectConfig.serviceAccountFile}`);
      return false;
    }

    // Initialize Firebase Admin
    const serviceAccount = require(projectConfig.serviceAccountFile);
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectConfig.projectId,
      storageBucket: projectConfig.storageBucket
    }, `test-${environment}`);

    const storage = getStorage(app);
    const bucket = storage.bucket();

    console.log(`✅ Firebase Admin initialized with service account: ${serviceAccount.client_email}`);

    // Test 1: Check if bucket exists and is accessible
    console.log('\n📋 Test 1: Checking bucket access...');
    try {
      const [exists] = await bucket.exists();
      if (exists) {
        console.log('✅ Bucket exists and is accessible');
      } else {
        console.log('❌ Bucket does not exist or is not accessible');
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking bucket access:', error.message);
      return false;
    }

    // Test 2: List files (requires storage.objects.list permission)
    console.log('\n📋 Test 2: Testing file listing permissions...');
    try {
      const [files] = await bucket.getFiles({ maxResults: 1 });
      console.log(`✅ File listing successful (found ${files.length} files in first page)`);
    } catch (error) {
      console.error('❌ Error listing files:', error.message);
      if (error.message.includes('storage.objects.list')) {
        console.error('💡 Service account needs storage.objects.list permission');
      }
      return false;
    }

    // Test 3: Create a test file (requires storage.objects.create permission)
    console.log('\n📋 Test 3: Testing file creation permissions...');
    const testFileName = `test-permissions-${Date.now()}.txt`;
    const testFilePath = `permission-test/${testFileName}`;
    
    try {
      const file = bucket.file(testFilePath);
      await file.save('This is a test file to verify storage permissions.', {
        metadata: {
          contentType: 'text/plain',
          metadata: {
            createdBy: 'verify-storage-permissions-script',
            createdAt: new Date().toISOString()
          }
        }
      });
      console.log(`✅ File creation successful: ${testFilePath}`);

      // Test 4: Delete the test file (requires storage.objects.delete permission)
      console.log('\n📋 Test 4: Testing file deletion permissions...');
      try {
        await file.delete();
        console.log('✅ File deletion successful');
      } catch (deleteError) {
        console.error('❌ Error deleting test file:', deleteError.message);
        if (deleteError.message.includes('storage.objects.delete')) {
          console.error('💡 Service account needs storage.objects.delete permission');
        }
        return false;
      }

    } catch (error) {
      console.error('❌ Error creating test file:', error.message);
      if (error.message.includes('storage.objects.create')) {
        console.error('💡 Service account needs storage.objects.create permission');
      }
      return false;
    }

    console.log(`\n🎉 All storage permission tests passed for ${environment.toUpperCase()} environment!`);
    return true;

  } catch (error) {
    console.error(`❌ Unexpected error testing ${environment} environment:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Firebase Storage Permissions Verification');
  console.log('==============================================');

  const environment = process.argv[2];
  
  if (environment && ['dev', 'prod'].includes(environment)) {
    // Test specific environment
    const success = await testStoragePermissions(environment);
    process.exit(success ? 0 : 1);
  } else if (!environment) {
    // Test both environments
    console.log('Testing both development and production environments...');
    
    const devSuccess = await testStoragePermissions('dev');
    const prodSuccess = await testStoragePermissions('prod');
    
    console.log('\n📊 Summary:');
    console.log(`   DEV Environment: ${devSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   PROD Environment: ${prodSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (devSuccess && prodSuccess) {
      console.log('\n🎉 All environments have proper storage permissions!');
      process.exit(0);
    } else {
      console.log('\n❌ Some environments have permission issues. Please review the output above.');
      process.exit(1);
    }
  } else {
    console.error('❌ Invalid environment. Use "dev" or "prod", or omit for both.');
    console.error('Usage: node verify-storage-permissions.js [dev|prod]');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});