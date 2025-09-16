// Main export file for shared package
export * from './configs';
export * from './enums';
export * from './types';

// Consolidated types export for convenience
export * from './types/all-types';

// Firebase error handling utilities
export {
  getAuthErrorMessage, getFirebaseErrorMessage, getFirestoreErrorMessage, getStorageErrorMessage
} from './configs/firebase-error-messages';

