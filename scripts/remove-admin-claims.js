#!/usr/bin/env node

// Script to remove admin claims from one or more users
// Usage: 
//   node remove-admin-claims.js                                 (uses default email)
//   node remove-admin-claims.js email1@example.com              (single email)
//   node remove-admin-claims.js email1@example.com email2@example.com  (multiple emails)

import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
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
const db = getFirestore(app)

// Default email if no arguments provided
const DEFAULT_EMAIL = 'gltknky@gmail.com'

// Get emails from command line arguments or use default
const args = process.argv.slice(2)
const emailsToUpdate = args.length > 0 ? args : [DEFAULT_EMAIL]

console.log(`\n${'='.repeat(60)}`)
console.log(`REMOVE ADMIN CLAIMS`)
console.log(`${'='.repeat(60)}`)
console.log(`Processing ${emailsToUpdate.length} email(s)...\n`)

async function removeAdminClaimsForEmail(email) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Removing admin claims for: ${email}`)
  console.log(`${'─'.repeat(60)}`)

  try {
    // Get user by email
    const user = await auth.getUserByEmail(email)
    console.log(`\nUser found:`)
    console.log(`- UID: ${user.uid}`)
    console.log(`- Email: ${user.email}`)

    // Get current claims
    const currentClaims = user.customClaims || {}
    console.log(`\nCurrent Claims:`, JSON.stringify(currentClaims, null, 2))

    // Remove admin claim
    const { admin, ...newClaims } = currentClaims
    await auth.setCustomUserClaims(user.uid, newClaims)

    console.log(`\n✅ Successfully removed admin claims!`)
    console.log(`New Claims:`, JSON.stringify(newClaims, null, 2))

    // Update Firestore user document with isAdmin field (read-only cache)
    try {
      const userRef = db.collection('users').doc(user.uid)
      await userRef.update({
        isAdmin: false,
        updatedAt: new Date().toISOString(),
      })
      console.log(`✅ Updated Firestore user document with isAdmin: false`)
    } catch (firestoreError) {
      console.warn(`⚠️  Could not update Firestore document: ${firestoreError.message}`)
      console.warn(`   (This is okay if the user document doesn't exist yet)`)
    }

    // Verify the update
    const updatedUser = await auth.getUser(user.uid)
    const verifyingClaims = updatedUser.customClaims || {}
    const isAdmin = verifyingClaims.admin === true

    console.log(`\n🔍 Verification:`)
    console.log(`Admin Status: ${isAdmin ? '⚠️ STILL ADMIN' : '✅ NOT ADMIN'}`)

    if (!isAdmin) {
      console.log(`\n🎉 Admin privileges removed from ${email}!`)
    }

    return { email, success: true }
  } catch (error) {
    console.error(`\n❌ Error removing admin claims for ${email}:`, error.message)
    return { email, success: false, error: error.message }
  }
}

async function processAllEmails() {
  const results = []

  for (const email of emailsToUpdate) {
    const result = await removeAdminClaimsForEmail(email)
    results.push(result)
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`SUMMARY`)
  console.log(`${'='.repeat(60)}`)

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`\n✅ Successful: ${successful.length}`)
  successful.forEach(r => console.log(`   - ${r.email}`))

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`)
    failed.forEach(r => console.log(`   - ${r.email}: ${r.error}`))
  }

  console.log(`\n📝 Note: Users will need to refresh their auth token to see the changes.`)
  console.log(`   - Log out and log back in, or`)
  console.log(`   - Wait for the token to refresh automatically (up to 1 hour)`)
  console.log(`\n${'='.repeat(60)}\n`)

  process.exit(failed.length > 0 ? 1 : 0)
}

processAllEmails()
