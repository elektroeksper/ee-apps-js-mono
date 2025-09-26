/**
 * Firebase Auth Configuration - Client-Side Only
 * Handles authentication operations that should remain client-side
 * This file is safe from Next.js 15 build issues
 */

import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Build-time safety check
const isClientSide = typeof window !== 'undefined'

// Firebase config (safe to use client-side)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase app (client-side only)
let app: any = null

const getFirebaseApp = () => {
  if (!isClientSide) {
    return null
  }

  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApp()
    }
  }
  return app
}

// Initialize Firebase Auth (client-side only)
export const auth = isClientSide ? getAuth(getFirebaseApp()!) : null

// Connect to Auth Emulator in development (disabled for testing)
// Uncomment below if you want to use Firebase emulators
/*
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    // Emulator already connected
  }
}
*/

export default getFirebaseApp
