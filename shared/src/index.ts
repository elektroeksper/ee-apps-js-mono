// Main export file for shared package
export * from './configs';
export * from './enums';
export * from './types';

// Firebase error handling utilities
export {
  getAuthErrorMessage, getFirebaseErrorMessage, getFirestoreErrorMessage, getStorageErrorMessage
} from './configs/firebase-error-messages';

