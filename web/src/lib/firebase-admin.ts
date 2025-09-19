/**
 * Firebase Admin SDK Configuration
 * Server-side Firebase operations for Next.js API routes
 * Solves Next.js 15 build-time Firebase client SDK issues
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK only on server-side
let app: admin.app.App;

if (!admin.apps.length) {
  // Initialize with service account key or default credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Use service account key (for production)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    // Use default credentials (for development with gcloud auth or deployed environments)
    app = admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
} else {
  app = admin.apps[0]!;
}

// Export Firebase Admin services
export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);
export const adminStorage = admin.storage(app);
// Note: Functions are not needed for admin operations

// Utility function to verify Firebase ID tokens or session cookies
export async function verifyIdToken(tokenOrSessionCookie: string) {
  try {
    // First try to verify as session cookie
    try {
      const decodedToken = await adminAuth.verifySessionCookie(tokenOrSessionCookie);
      return { success: true, user: decodedToken };
    } catch (sessionError) {
      // If session cookie verification fails, try as ID token
      const decodedToken = await adminAuth.verifyIdToken(tokenOrSessionCookie);
      return { success: true, user: decodedToken };
    }
  } catch (error) {
    console.error('Error verifying token/session cookie:', error);
    return { success: false, error: 'Invalid token or session' };
  }
}

// Utility function to check admin claims
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const user = await adminAuth.getUser(uid);
    return user.customClaims?.admin === true;
  } catch (error) {
    console.error('Error checking admin claims:', error);
    return false;
  }
}

export default app;