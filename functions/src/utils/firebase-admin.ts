import * as admin from 'firebase-admin'

// Determine project configuration based on environment
const getProjectConfig = () => {
  // Check for explicit project environment variable first
  let projectEnv = process.env.PROJECT_ENV

  // If not set, try to detect from Firebase project ID environment
  if (!projectEnv) {
    const firebaseProjectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT
    if (firebaseProjectId === 'ee-dev-apps') {
      projectEnv = 'dev'
    } else {
      projectEnv = 'prod'
    }
  }

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
  if (admin.apps.length === 0) {
    const config = getProjectConfig()

    // Use Application Default Credentials in Cloud Functions
    // This is the recommended approach for Firebase Functions
    admin.initializeApp({
      projectId: config.projectId,
      storageBucket: config.storageBucket,
    })
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
let _firestoreInstance: admin.firestore.Firestore | null = null
export const getFirestore = () => {
  if (!_firestoreInstance) {
    initializeFirebaseAdmin()
    _firestoreInstance = admin.firestore()
    _firestoreInstance.settings({ databaseId: 'native-db' })
  }
  return _firestoreInstance
}

// Lazy initialization - these will only be created when first accessed
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
) => {
  return {
    success,
    data,
    error: success ? undefined : error,
    code,
    details: success ? undefined : details,
  }
}
