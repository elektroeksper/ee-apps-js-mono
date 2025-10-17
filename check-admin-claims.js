#!/usr/bin/env node

// Script to check admin claims for one or more users
// Usage: 
//   node check-admin-claims.js                                  (uses default email)
//   node check-admin-claims.js email1@example.com               (single email)
//   node check-admin-claims.js email1@example.com email2@example.com  (multiple emails)

import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./functions/admin-service-account-dev.json', 'utf-8')
)

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'ee-dev-apps',
})

const auth = getAuth(app)

// Default email if no arguments provided
const DEFAULT_EMAIL = 'elektroeksper@gmail.com'

// Get emails from command line arguments or use default
const args = process.argv.slice(2)
const emailsToCheck = args.length > 0 ? args : [DEFAULT_EMAIL]

console.log(`\n${'='.repeat(60)}`)
console.log(`CHECK ADMIN CLAIMS`)
console.log(`${'='.repeat(60)}`)
console.log(`Checking ${emailsToCheck.length} email(s)...\n`)

async function checkAdminClaimsForEmail(email) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Checking admin claims for: ${email}`)
  console.log(`${'─'.repeat(60)}`)

  try {
    // Get user by email
    const user = await auth.getUserByEmail(email)
    console.log(`\n✅ User found:`)
    console.log(`   UID: ${user.uid}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Email Verified: ${user.emailVerified}`)
    console.log(`   Disabled: ${user.disabled}`)

    // Get current claims
    const customClaims = user.customClaims || {}
    console.log(`\n📋 Custom Claims:`, JSON.stringify(customClaims, null, 2))

    // Check admin status
    const isAdmin = customClaims.admin === true

    console.log(`\n🔍 Admin Status:`)
    if (isAdmin) {
      console.log(`   ✅ IS ADMIN`)
    } else {
      console.log(`   ❌ NOT ADMIN`)
    }

    return { email, success: true, isAdmin, claims: customClaims }
  } catch (error) {
    console.error(`\n❌ Error checking claims for ${email}:`, error.message)
    return { email, success: false, error: error.message }
  }
}

async function processAllEmails() {
  const results = []

  for (const email of emailsToCheck) {
    const result = await checkAdminClaimsForEmail(email)
    results.push(result)
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`SUMMARY`)
  console.log(`${'='.repeat(60)}`)

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const admins = successful.filter(r => r.isAdmin)
  const nonAdmins = successful.filter(r => !r.isAdmin)

  console.log(`\n✅ Checked: ${successful.length}`)

  if (admins.length > 0) {
    console.log(`\n👑 ADMINS (${admins.length}):`)
    admins.forEach(r => console.log(`   - ${r.email}`))
  }

  if (nonAdmins.length > 0) {
    console.log(`\n👤 NON-ADMINS (${nonAdmins.length}):`)
    nonAdmins.forEach(r => console.log(`   - ${r.email}`))
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`)
    failed.forEach(r => console.log(`   - ${r.email}: ${r.error}`))
  }

  console.log(`\n${'='.repeat(60)}\n`)

  process.exit(failed.length > 0 ? 1 : 0)
}

processAllEmails()
