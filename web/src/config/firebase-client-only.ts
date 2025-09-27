/**
 * Client-Only Firebase Configuration
 * This file ensures Firebase is ONLY initialized in browser environment
 * and completely prevents any Firebase operations during build/SSR
 */

import { getAnalytics } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

// Strict client-only guard
const isClientSide =
  typeof window !== 'undefined' && typeof document !== 'undefined'

// Build-time detection
const isBuildTime =
  !isClientSide &&
  (process.env.NEXT_PHASE === 'phase-export' ||
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_STATIC === 'true')

// Firebase configuration
const getFirebaseConfig = () => {
  if (!isClientSide) {
    throw new Error('Firebase config should only be accessed on client side')
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
  }

  // Validate required fields
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      console.error(`Missing Firebase config: ${key}`)
    }
  })

  return config
}

// Singleton instances
let app: any = null
let _auth: any = null
let _db: any = null
let _functions: any = null
let _analytics: any = null
let _storage: any = null

// Emulator connection state tracking
let emulatorsConnected = false

// Helper function to connect to emulators
const connectToEmulators = () => {
  if (emulatorsConnected || !isClientSide || !app) return

  const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true'

  if (!useEmulator) return

  console.log('🔧 Connecting to Firebase emulators...')

  try {
    // Connect Auth emulator - create fresh instance
    if (!_auth) {
      _auth = getAuth(app)
      const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'
      connectAuthEmulator(_auth, `http://${authHost}`, { disableWarnings: true })
      console.log(`✅ Auth emulator connected to ${authHost}`)
    }

    // Connect Firestore emulator - create fresh instance
    if (!_db) {
      _db = getFirestore(app, 'native-db')
      connectFirestoreEmulator(_db, '127.0.0.1', 8080)
      console.log('✅ Firestore emulator connected to 127.0.0.1:8080')
    }

    // Connect Functions emulator - create fresh instance
    if (!_functions) {
      _functions = getFunctions(app, process.env.NEXT_PUBLIC_FIREBASE_REGION || 'europe-west1')
      connectFunctionsEmulator(_functions, '127.0.0.1', 5001)
      console.log('✅ Functions emulator connected to 127.0.0.1:5001')
    }

    // Connect Storage emulator - create fresh instance
    if (!_storage) {
      _storage = getStorage(app)
      connectStorageEmulator(_storage, '127.0.0.1', 9199)
      console.log('✅ Storage emulator connected to 127.0.0.1:9199')
    }

    emulatorsConnected = true
    console.log('✅ All Firebase emulators connected successfully')
  } catch (error) {
    console.warn('⚠️ Error connecting to emulators:', error)
  }
}

// Client-only Firebase app
export const getFirebaseApp = () => {
  if (!isClientSide) {
    throw new Error('Firebase app should only be accessed on client side')
  }

  if (!app) {
    app = initializeApp(getFirebaseConfig())
    // Connect to emulators after app initialization
    connectToEmulators()
  }
  return app
}

// Client-only Firebase services
export const getFirebaseAuth = () => {
  if (!isClientSide) {
    throw new Error('Firebase auth should only be accessed on client side')
  }

  if (!_auth) {
    // Ensure app is initialized and emulators connected first
    getFirebaseApp()
    if (!_auth) {
      _auth = getAuth(app)
    }
  }
  return _auth
}

export const getFirebaseFirestore = () => {
  if (!isClientSide) {
    throw new Error('Firebase firestore should only be accessed on client side')
  }

  if (!_db) {
    // Ensure app is initialized and emulators connected first
    getFirebaseApp()
    if (!_db) {
      _db = getFirestore(app, 'native-db')
    }
  }
  return _db
}

export const getFirebaseFunctions = () => {
  if (!isClientSide) {
    throw new Error('Firebase functions should only be accessed on client side')
  }

  if (!_functions) {
    // Ensure app is initialized and emulators connected first
    getFirebaseApp()
    if (!_functions) {
      _functions = getFunctions(app, process.env.NEXT_PUBLIC_FIREBASE_REGION || 'europe-west1')
    }
  }
  return _functions
}

export const getFirebaseStorage = () => {
  if (!isClientSide) {
    throw new Error('Firebase storage should only be accessed on client side')
  }

  if (!_storage) {
    // Ensure app is initialized and emulators connected first
    getFirebaseApp()
    if (!_storage) {
      _storage = getStorage(app)
    }
  }
  return _storage
}

export const getFirebaseAnalytics = () => {
  if (!isClientSide) {
    throw new Error('Firebase analytics should only be accessed on client side')
  }

  if (!_analytics) {
    _analytics = getAnalytics(getFirebaseApp())
  }
  return _analytics
}

// Safe accessors that won't break during build
export const auth = isClientSide ? getFirebaseAuth() : null
export const db = isClientSide ? getFirebaseFirestore() : null
export const functions = isClientSide ? getFirebaseFunctions() : null
export const storage = isClientSide ? getFirebaseStorage() : null
export const analytics = isClientSide ? getFirebaseAnalytics() : null

// Export utility functions
export { isBuildTime, isClientSide }

export default getFirebaseApp
