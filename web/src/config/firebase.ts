// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHxSr5jys7NU5xnuZTXB9EOsB1JrJ_K94",
  authDomain: "elektro-ekspert-apps.firebaseapp.com",
  projectId: "elektro-ekspert-apps",
  storageBucket: "elektro-ekspert-apps.firebasestorage.app",
  messagingSenderId: "494385427557",
  appId: "1:494385427557:web:27ee4a7bd96966c0e5028c",
  measurementId: "G-NS7WV19N5L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1');

// Connect to emulators if in development
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  const functionsHost = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST || '127.0.0.1';
  const functionsPort = parseInt(process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT || '5001', 10);

  try {
    connectFunctionsEmulator(functions, functionsHost, functionsPort);
    console.log('🔥 Connected to Firebase Functions emulator:', `${functionsHost}:${functionsPort}`);
  } catch (error) {
    console.warn('Failed to connect to Functions emulator:', error);
  }
}

// Initialize Analytics (only in browser environment)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
