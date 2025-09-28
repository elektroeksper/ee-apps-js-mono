import * as admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

// Determine project configuration based on environment
const getProjectConfig = () => {
  // Check for explicit project environment variable
  // Default to production project unless explicitly set to dev
  const projectEnv = process.env.PROJECT_ENV || 'prod'

  if (projectEnv === 'dev') {
    return {
      projectId: 'ee-dev-apps',
      storageBucket: 'ee-dev-apps.firebasestorage.app',
      serviceAccountFile: 'admin-service-account-dev.json'
    }
  } else {
    return {
      projectId: 'ee-prod-apps',
      storageBucket: 'ee-prod-apps.firebasestorage.app',
      serviceAccountFile: 'admin-service-account-prod.json'
    }
  }
}

// Lazy initialization function
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    const config = getProjectConfig()

    try {
      // Try to use environment-specific service account file
      const serviceAccountPath = join(__dirname, '../../', config.serviceAccountFile)
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.projectId,
        storageBucket: config.storageBucket,
      })
      console.log(`🔥 Firebase Admin initialized for project: ${config.projectId} using ${config.serviceAccountFile}`)
    } catch (error) {
      console.log(`⚠️ Could not load service account file, using default credentials for ${config.projectId}`, error)
      // Fallback to Application Default Credentials
      // Production (Cloud Functions) automatically injects a service account.
      // Local/CI: export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
      admin.initializeApp(config)
      console.log(`🔥 Firebase Admin initialized for project: ${config.projectId} using default credentials`)
    }
  }
}

// Export lazy-initialized services for use in other files
export const getAuth = () => {
  initializeFirebaseAdmin()
  return admin.auth()
}

export const getStorage = () => {
  initializeFirebaseAdmin()
  return admin.storage()
}

export const getMessaging = () => {
  initializeFirebaseAdmin()
  return admin.messaging()
}

// Configure Firestore to use the native-db database
export const getFirestore = () => {
  initializeFirebaseAdmin()
  const db = admin.firestore()
  db.settings({ databaseId: 'native-db' })
  return db
}

// Legacy exports for backward compatibility
export const auth = getAuth()
export const storage = getStorage()
export const messaging = getMessaging()
export const db = getFirestore()

// Helper function to create standardized operation results
export const createResult = <T>(
  success: boolean,
  data?: T,
  error = '',
  code = 200,
  details?: string
): any => {
  return {
    success,
    data,
    error: success ? undefined : error,
    code,
    details: success ? undefined : details,
  }
}
