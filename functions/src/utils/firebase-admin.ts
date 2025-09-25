import * as admin from 'firebase-admin';

// Initialize using standard Application Default Credentials.
// Production (Cloud Functions) automatically injects a service account.
// Local/CI: export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'ee-prod-apps',
    storageBucket: 'ee-prod-apps.firebasestorage.app'
  });
}

// Export the initialized services for use in other files
export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();

// Configure Firestore to use the native-db database
export const db = admin.firestore();
db.settings({ databaseId: 'native-db' });

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
  };
};
