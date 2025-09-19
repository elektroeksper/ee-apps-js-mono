/**
 * Client-Only Firebase Configuration
 * This file ensures Firebase is ONLY initialized in browser environment
 * and completely prevents any Firebase operations during build/SSR
 */

import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Strict client-only guard
const isClientSide = typeof window !== 'undefined' && typeof document !== 'undefined';

// Build-time detection
const isBuildTime = !isClientSide && (
  process.env.NEXT_PHASE === 'phase-export' ||
  process.env.NODE_ENV === 'test' ||
  process.env.NEXT_STATIC === 'true'
);

// Firebase configuration
const getFirebaseConfig = () => {
  if (!isClientSide) {
    throw new Error('Firebase config should only be accessed on client side');
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
  };

  // Validate required fields
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      console.error(`Missing Firebase config: ${key}`);
    }
  });

  return config;
};

// Singleton instances
let app: any = null;
let _auth: any = null;
let _db: any = null;
let _functions: any = null;
let _analytics: any = null;

// Client-only Firebase app
export const getFirebaseApp = () => {
  if (!isClientSide) {
    throw new Error('Firebase app should only be accessed on client side');
  }

  if (!app) {
    app = initializeApp(getFirebaseConfig());
  }
  return app;
};

// Client-only Firebase services
export const getFirebaseAuth = () => {
  if (!isClientSide) {
    throw new Error('Firebase auth should only be accessed on client side');
  }

  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
};

export const getFirebaseFirestore = () => {
  if (!isClientSide) {
    throw new Error('Firebase firestore should only be accessed on client side');
  }

  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
};

export const getFirebaseFunctions = () => {
  if (!isClientSide) {
    throw new Error('Firebase functions should only be accessed on client side');
  }

  if (!_functions) {
    _functions = getFunctions(getFirebaseApp(), process.env.NEXT_PUBLIC_FIREBASE_REGION || 'europe-west1');
  }
  return _functions;
};

export const getFirebaseAnalytics = () => {
  if (!isClientSide) {
    throw new Error('Firebase analytics should only be accessed on client side');
  }

  if (!_analytics) {
    _analytics = getAnalytics(getFirebaseApp());
  }
  return _analytics;
};

// Safe accessors that won't break during build
export const auth = isClientSide ? getFirebaseAuth() : null;
export const db = isClientSide ? getFirebaseFirestore() : null;
export const functions = isClientSide ? getFirebaseFunctions() : null;
export const analytics = isClientSide ? getFirebaseAnalytics() : null;

// Export utility functions
export { isBuildTime, isClientSide };

export default getFirebaseApp;