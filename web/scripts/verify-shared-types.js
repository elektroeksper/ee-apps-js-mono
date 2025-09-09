#!/usr/bin/env node

/**
 * Verify shared types exist for web package deployment
 * This script ensures shared types were properly copied before deployment
 */

const fs = require('fs');
const path = require('path');

const SHARED_GENERATED_DIR = path.join(__dirname, '../src/shared-generated');

function main() {
  console.log('🔍 Verifying shared types are present...');
  
  if (!fs.existsSync(SHARED_GENERATED_DIR)) {
    console.error('❌ Shared types not found!');
    console.error('   Run "pnpm build:shared:web" from the root directory first.');
    process.exit(1);
  }
  
  const requiredFiles = ['index.d.ts', 'shared.d.ts'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(SHARED_GENERATED_DIR, file))) {
      console.error(`❌ Required file missing: ${file}`);
      process.exit(1);
    }
  }
  
  console.log('✅ Shared types verified successfully!');
}

if (require.main === module) {
  main();
}
