#!/usr/bin/env node

/**
 * Script to initialize main categories in production
 * This script uses the admin service account to bypass authentication requirements
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with production service account
const serviceAccount = require(path.join(__dirname, 'admin-service-account-prod.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ee-prod-apps',
  storageBucket: 'ee-prod-apps.firebasestorage.app'
});

// Configure Firestore to use the native-db database
const db = admin.firestore();
db.settings({ databaseId: 'native-db' });

// Define the main categories
const BUSINESS_CATEGORIES = [
  {
    id: 'e1f2g3h4i5j6k7l8m9n0',
    order: 1,
    name: 'Bilgisayar',
    slug: 'bilgisayar',
    description: 'Bilgisayar ve aksesuarları',
    isActive: true,
    parentCategoryId: null
  },
  {
    id: 'b1a2c3d4e5f6g7h8i9j0',
    order: 2,
    name: 'Fotoğraf Makinesi & Kamera',
    slug: 'fotoğraf-makinesi-kamera',
    description: 'Fotoğraf makineleri ve kameralar',
    isActive: true,
    parentCategoryId: null
  },
  {
    id: 'k1l2m3n4o5p6q7r8s9t0',
    order: 3,
    name: 'Oyun Konsolu',
    slug: 'oyun-konsolu',
    description: 'Oyun konsolu ürünleri ve servisleri',
    isActive: true,
    parentCategoryId: null
  },
  {
    id: 'u1v2w3x4y5z6a7b8c9d0',
    order: 4,
    name: 'Telefon & Tablet',
    slug: 'telefon-tablet',
    description: 'Telefon ve tablet ürünleri',
    isActive: true,
    parentCategoryId: null
  },
];

async function initializeCategories() {
  console.log('🚀 Starting category initialization for PRODUCTION...');
  console.log(`📊 Project: ee-prod-apps`);
  console.log(`🗄️  Database: native-db`);
  console.log('');

  try {
    // Check if categories already exist
    console.log('🔍 Checking for existing categories...');
    const categoriesSnapshot = await db
      .collection('categories')
      .orderBy('name', 'asc')
      .get();

    if (categoriesSnapshot.docs.length > 0) {
      console.log(`✅ Found ${categoriesSnapshot.docs.length} existing categories:`);
      categoriesSnapshot.docs.forEach(doc => {
        console.log(`   - ${doc.data().name} (${doc.id})`);
      });
      console.log('');
      console.log('✅ Categories already initialized.');
      console.log('');
      return true;
    }

    console.log('✅ No existing categories found. Proceeding with initialization...');
    console.log('');

    // Initialize categories using batch write
    console.log(`📝 Creating ${BUSINESS_CATEGORIES.length} categories...`);
    const batch = db.batch();

    BUSINESS_CATEGORIES.forEach(category => {
      const docRef = db.collection('categories').doc(category.id);
      batch.set(docRef, category);
      console.log(`   ✓ ${category.name} (${category.slug})`);
    });

    await batch.commit();
    console.log('');
    console.log('🎉 Successfully initialized categories!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Total categories created: ${BUSINESS_CATEGORIES.length}`);
    console.log(`   - Database: native-db`);
    console.log(`   - Project: ee-prod-apps`);
    console.log('');
    console.log('✅ Done!');

    return true;

  } catch (error) {
    console.error('');
    console.error('❌ Error initializing categories:');
    console.error(error);
    process.exit(1);
  }
}

// Confirmation prompt for production
console.log('⚠️  WARNING: You are about to initialize categories in PRODUCTION!');
console.log('');
console.log('This will:');
console.log('  - Connect to ee-prod-apps project');
console.log('  - Create categories in the native-db database');
console.log('  - Use the admin service account');
console.log('');

// Simple confirmation using readline
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🔴 Are you sure you want to proceed? (yes/no): ', (answer) => {
  rl.close();

  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    initializeCategories()
      .then((result) => {
        if (result) {
          console.log('✅ Result: true');
        }
        process.exit(0);
      })
      .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
  } else {
    console.log('❌ Operation cancelled.');
    process.exit(0);
  }
});
