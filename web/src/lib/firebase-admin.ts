/**
 * Firebase Admin SDK Configuration
 * Server-side Firebase operations for Next.js API routes
 * Solves Next.js 15 build-time Firebase client SDK issues
 */

import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK only on server-side
let app: admin.app.App

if (!admin.apps.length) {
  // Initialize with service account key or default credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Use service account key from environment (for production)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  } else {
    // Use service account file directly (for development)
    try {
      const serviceAccount = require('./admin-service-account.json')
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId:
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ee-prod-apps',
      })
      console.log('✅ Firebase Admin initialized with service account file')
    } catch (fileError) {
      console.error('❌ Service account file not found:', fileError)
      // Fallback to default credentials
      app = admin.initializeApp({
        projectId:
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ee-prod-apps',
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
