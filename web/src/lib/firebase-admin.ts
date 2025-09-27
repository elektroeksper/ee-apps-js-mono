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
    // Use environment-specific service account file (for development)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ee-prod-apps'
    const serviceAccountFile = projectId === 'ee-dev-apps'
      ? './src/lib/admin-service-account-dev.json'
      : './src/lib/admin-service-account-prod.json'

    try {
      const serviceAccount = require(serviceAccountFile)
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      })
      console.log(`✅ Firebase Admin initialized with service account file for ${projectId}`)
    } catch (fileError) {
      console.error(`❌ Service account file not found (${serviceAccountFile}):`, fileError)
      // Fallback to default credentials
      app = admin.initializeApp({
        projectId: projectId,
      })
      console.log('⚠️ Firebase Admin initialized with default credentials')
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
} // Utility function to check admin claims
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const user = await adminAuth.getUser(uid)
    return user.customClaims?.admin === true
  } catch (error) {
    console.error('Error checking admin claims:', error)
    return false
  }
}

export default app
