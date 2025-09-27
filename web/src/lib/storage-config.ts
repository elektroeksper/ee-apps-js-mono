/**
 * Storage Configuration Utility
 * Provides environment-aware storage bucket configuration
 */

/**
 * Get the appropriate Firebase Storage bucket name based on environment
 */
export function getStorageBucketName(): string {
  // Check if we're using emulators (for local development)
  const useEmulators = process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATOR === 'true'

  if (useEmulators) {
    return 'demo-project.appspot.com'
  }

  // First, try to get from environment variable
  if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  }

  // Fallback based on project ID
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (projectId === 'ee-dev-apps') {
    return 'ee-dev-apps.firebasestorage.app'
  } else if (projectId === 'ee-prod-apps') {
    return 'ee-prod-apps.firebasestorage.app'
  }

  // Final fallback - assume production if nothing else is set
  console.warn('No storage bucket configured, falling back to production bucket')
  return 'ee-prod-apps.firebasestorage.app'
}/**
 * Get current environment name
 */
export function getCurrentEnvironment(): 'dev' | 'prod' | 'unknown' {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (projectId === 'ee-dev-apps') {
    return 'dev'
  } else if (projectId === 'ee-prod-apps') {
    return 'prod'
  }

  return 'unknown'
}

/**
 * Check if we're in development environment
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'dev'
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'prod'
}