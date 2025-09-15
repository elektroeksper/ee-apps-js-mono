// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
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

export { getAnalytics, getAuth, getFirestore, getFunctions, getStorage };

export default app;
