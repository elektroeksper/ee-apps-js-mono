import * as admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

// Determine project configuration based on environment
const getProjectConfig = () => {
  // Check for explicit project environment variable
  const projectEnv = process.env.FIREBASE_PROJECT_ENV || 'prod'

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

// Initialize Firebase Admin SDK
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

// Export the initialized services for use in other files
export const auth = admin.auth()
export const storage = admin.storage()
export const messaging = admin.messaging()

// Configure Firestore to use the native-db database
export const db = admin.firestore()
db.settings({ databaseId: 'native-db' })

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
