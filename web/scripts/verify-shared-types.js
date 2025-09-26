#!/usr/bin/env node

/**
 * Verify shared types exist for web package deployment
 * This script ensures shared types were properly copied before deployment
 */

const fs = require('fs')
const path = require('path')

const SHARED_GENERATED_DIR = path.join(__dirname, '../src/shared-generated')

function main() {
  console.log('🔍 Verifying shared types are present...')

  if (!fs.existsSync(SHARED_GENERATED_DIR)) {
    console.error('❌ Shared types not found!')
    console.error(
      '   Run "node scripts/build-shared-types.js web" from the root directory first.'
    )
    process.exit(1)
  }

  // Check for essential directories and files
  const requiredItems = [
    'index.d.ts',
    'enums/index.d.ts',
    'types/index.d.ts',
    'configs/index.d.ts',
  ]

  for (const item of requiredItems) {
    const itemPath = path.join(SHARED_GENERATED_DIR, item)
    if (!fs.existsSync(itemPath)) {
      console.error(`❌ Required file missing: ${item}`)
      console.error(
        '   Run "node scripts/build-shared-types.js web" from the root directory first.'
      )
      process.exit(1)
    }
  }

  console.log('✅ Shared types verified successfully!')
}

if (require.main === module) {
  main()
}
