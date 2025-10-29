/**
 * Firebase Admin SDK Configuration
 * Server-side Firebase operations for Next.js API routes
 * Solves Next.js 15 build-time Firebase client SDK issues
 */

import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK only on server-side
let app: admin.app.App

if (!admin.apps.length) {
  // Check if we should use emulators (for local development)
  const useEmulators = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true'

  if (useEmulators) {
    // Use emulators for local development - use actual project ID, not demo-project
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ee-dev-apps'
    console.log(`🧪 Initializing Firebase Admin with emulators for project: ${projectId}`)

    // Set emulator hosts before initializing
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199'

    app = admin.initializeApp({
      projectId: projectId,
      storageBucket: `${projectId}.appspot.com`,
    })

  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Use service account key from environment (for production)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  } else {
    // Use environment-specific service account file
    // Environment mapping:
    //   - ee-dev-apps project  → admin-service-account-dev.json (for dev and test environments)
    //   - ee-prod-apps project → admin-service-account-prod.json (for live environment)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ee-prod-apps'
    const path = require('path')
    const fs = require('fs')

    // Determine environment based on project ID
    const isDev = projectId === 'ee-dev-apps'
    const env = isDev ? 'dev' : 'prod'

    // Service account files can be in different locations:
    // 1. Local development: ../functions/ (from project root)
    // 2. Deployed App Hosting: ./functions/ (copied during deployment)
    const possiblePaths = [
      path.join(process.cwd(), '..', 'functions', `admin-service-account-${env}.json`), // Local dev (from web/)
      path.join(process.cwd(), 'functions', `admin-service-account-${env}.json`),       // Deployed (in web/functions/)
    ]

    let serviceAccountFile = ''
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        serviceAccountFile = testPath
        break
      }
    }

    try {
      console.log(`🔍 Environment: ${env} (${projectId})`)
      console.log(`🔍 Attempting to load service account from: ${serviceAccountFile}`)
      console.log(`🔍 Current working directory: ${process.cwd()}`)

      // Check if file exists
      if (!fs.existsSync(serviceAccountFile)) {
        throw new Error(`Service account file does not exist: ${serviceAccountFile}`)
      }

      // Read and parse the service account file
      const serviceAccountContent = fs.readFileSync(serviceAccountFile, 'utf8')
      const serviceAccount = JSON.parse(serviceAccountContent)

      // Verify it has the required fields
      if (!serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Service account file is missing required fields (client_email or private_key)')
      }

      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
      })
      console.log(`✅ Firebase Admin initialized with ${env} service account for ${projectId}`)
      console.log(`✅ Using service account: ${serviceAccount.client_email}`)
      console.log(`✅ Storage bucket: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`}`)
    } catch (fileError) {
      console.error(`❌ Failed to load service account file:`, fileError)
      console.error(`❌ Working directory: ${process.cwd()}`)
      console.error(`❌ Attempted path: ${serviceAccountFile}`)

      // Try to use FIREBASE_SERVICE_ACCOUNT_KEY environment variable as backup
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          console.log('🔄 Trying FIREBASE_SERVICE_ACCOUNT_KEY environment variable...')
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: projectId,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
          })
          console.log(`✅ Firebase Admin initialized with environment service account`)
          console.log(`✅ Using service account: ${serviceAccount.client_email}`)
        } catch (envError) {
          console.error('❌ Failed to use FIREBASE_SERVICE_ACCOUNT_KEY:', envError)
          throw new Error(`Cannot initialize Firebase Admin: ${fileError instanceof Error ? fileError.message : 'Unknown error'}. Service account file not found and FIREBASE_SERVICE_ACCOUNT_KEY not valid.`)
        }
      } else {
        // Don't fall back to ADC for storage operations
        throw new Error(`Cannot initialize Firebase Admin: ${fileError instanceof Error ? fileError.message : 'Unknown error'}. Service account file not found and FIREBASE_SERVICE_ACCOUNT_KEY not set.`)
      }
    }
  }
} else {
  app = admin.apps[0]!
}

// Export Firebase Admin services
export const adminAuth = admin.auth(app)
export const adminStorage = admin.storage(app)

// Get reference to the native-db database using databaseId
export const adminDb = admin.firestore(app)

// Configure the database ID for native-db (only if not already initialized)
try {
  adminDb.settings({ databaseId: 'native-db' })
  console.log('✅ Firebase Admin Firestore configured for native-db')
} catch (error) {
  // Settings already configured, ignore
  console.log('ℹ️ Firebase Admin Firestore settings already configured')
}
// Note: Functions are not needed for admin operations

// Utility function to verify Firebase ID tokens
export async function verifyIdToken(token: string) {
  try {
    console.log('🔍 Verifying token...')

    // Check if it's a session cookie or ID token based on the token format/issuer
    try {
      // First try as session cookie
      const decodedToken = await adminAuth.verifySessionCookie(token)
      console.log(
        '✅ Session cookie verified successfully for user:',
        decodedToken.email
      )
      console.log(
        '🔍 Session cookie claims:',
        decodedToken.admin,
        decodedToken.role
      )
      return { success: true, user: decodedToken }
    } catch (sessionError) {
      console.log('ℹ️ Not a session cookie, trying as ID token...')

      // If session cookie fails, try as ID token
      const decodedToken = await adminAuth.verifyIdToken(token)
      console.log(
        '✅ ID token verified successfully for user:',
        decodedToken.email
      )
      console.log('🔍 ID token claims:', decodedToken.admin, decodedToken.role)
      return { success: true, user: decodedToken }
    }
  } catch (error) {
    console.error(
      '❌ Error verifying token (both session and ID token failed):',
      error
    )
    return { success: false, error: 'Invalid token' }
  }
}

/**
 * Utility function to check if a user has admin privileges
 * Checks custom claims from Firebase Auth (source of truth)
 * @param uid - User ID
 * @returns true if user has admin claim, false otherwise
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const user = await adminAuth.getUser(uid)
    return user.customClaims?.admin === true
  } catch (error) {
    console.error('Error checking admin claims:', error)
    return false
  }
}

/**
 * Helper function to check admin status from decoded token and fresh claims
 * This is the recommended pattern for admin checks in API routes
 * @param decodedToken - Decoded Firebase token (from verifyIdToken or verifySessionCookie)
 * @param uid - User ID to fetch fresh claims
 * @returns Object with admin status and details
 */
export async function checkAdminStatus(
  decodedToken: any,
  uid: string
): Promise<{
  isAdmin: boolean
  fromToken: boolean
  fromClaims: boolean
}> {
  try {
    // Check direct property from token (may be at root level)
    const fromToken = (decodedToken as any).admin === true

    // Fetch fresh custom claims from Firebase Auth (source of truth)
    const userRecord = await adminAuth.getUser(uid)
    const userClaims = userRecord.customClaims || {}
    const fromClaims = userClaims.admin === true

    // Admin if either location has the claim
    const isAdmin = fromToken || fromClaims

    return {
      isAdmin,
      fromToken,
      fromClaims,
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    return {
      isAdmin: false,
      fromToken: false,
      fromClaims: false,
    }
  }
}

export default app
