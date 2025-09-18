import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Build-time guard - prevents all Firebase operations during Next.js build
const isBuildTime = typeof window === 'undefined' && (
  process.env.NEXT_PHASE === 'phase-export' ||
  process.env.NODE_ENV === 'test' ||
  process.env.NEXT_STATIC === 'true'
);

// Create mock proxy for build time
const createMockProxy = () => new Proxy({} as any, {
  get() {
    return () => Promise.resolve(null);
  }
});

let app: any = null;
let _auth: any = null;
let _db: any = null;
let _functions: any = null;
let _analytics: any = null;

// Firebase configuration
const getFirebaseConfig = () => {
  const requiredEnvVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  return {
    apiKey: requiredEnvVars.apiKey!,
    authDomain: requiredEnvVars.authDomain!,
    projectId: requiredEnvVars.projectId!,
    storageBucket: requiredEnvVars.storageBucket!,
    messagingSenderId: requiredEnvVars.messagingSenderId!,
    appId: requiredEnvVars.appId!,
    measurementId: requiredEnvVars.measurementId!,
  };
};

export const getFirebaseApp = () => {
  if (isBuildTime) {
    return createMockProxy();
  }
  if (!app) {
    app = initializeApp(getFirebaseConfig());
  }
  return app;
};

export const auth = new Proxy({} as any, {
  get(target, prop) {
    if (isBuildTime || typeof window === 'undefined') {
      return undefined;
    }
    if (!_auth) {
      _auth = getAuth(getFirebaseApp());
    }
    return _auth[prop];
  }
});

export const db = new Proxy({} as any, {
  get(target, prop) {
    if (isBuildTime || typeof window === 'undefined') {
      return undefined;
    }
    if (!_db) {
      _db = getFirestore(getFirebaseApp());
    }
    return _db[prop];
  }
});

export const functions = new Proxy({} as any, {
  get(target, prop) {
    if (isBuildTime || typeof window === 'undefined') {
      return undefined;
    }
    if (!_functions) {
      _functions = getFunctions(getFirebaseApp(), process.env.NEXT_PUBLIC_FIREBASE_REGION || 'europe-west1');
    }
    return _functions[prop];
  }
});

export const analytics = new Proxy({} as any, {
  get(target, prop) {
    if (isBuildTime || typeof window === 'undefined') {
      return undefined;
    }
    if (!_analytics) {
      _analytics = getAnalytics(getFirebaseApp());
    }
    return _analytics[prop];
  }
});

export default getFirebaseApp;
