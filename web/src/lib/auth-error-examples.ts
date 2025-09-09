/**
 * Example usage of centralized auth error messages
 * This file demonstrates how to use the auth error message system
 */

import { getFirebaseErrorMessage } from "@/shared-generated"

// Example 1: Basic usage in a try-catch block
export async function handleAuthOperation() {
  try {
    // Example: Firebase auth operation would go here
    // await signInWithEmailAndPassword(auth, email, password)
    return { success: true }
  } catch (error: any) {
    // Get localized error message
    const message = getFirebaseErrorMessage(error.code, 'tr')
    console.error('Auth error:', message)

    // Or with fallback
    const messageWithFallback = getFirebaseErrorMessage(
      error.code,
      'tr'
    )
    return { success: false, error: messageWithFallback }
  }
}

// Example 2: Usage in React component error handling
export function useAuthErrorHandler() {
  const handleError = (error: any, setError: Function) => {
    const errorCode = error?.code || error?.message || ''

    // For specific field errors
    if (errorCode.includes('user-not-found')) {
      setError('email', {
        message: getFirebaseErrorMessage('auth/user-not-found', 'tr')
      })
    } else if (errorCode.includes('wrong-password')) {
      setError('password', {
        message: getFirebaseErrorMessage('auth/wrong-password', 'tr')
      })
    } else {
      // For general errors
      setError('root', {
        message: getFirebaseErrorMessage(errorCode, 'tr')
      })
    }
  }

  return { handleError }
}

// Example 3: Usage in service response
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
}

export function createErrorResponse(error: any): ServiceResponse<never> {
  return {
    success: false,
    error: getFirebaseErrorMessage(error.code || error.message || 'default', 'tr'),
    errorCode: error.code
  }
}

// Example 4: Batch error handling
export function processAuthErrors(errors: any[]): string[] {
  return errors.map(error =>
    getFirebaseErrorMessage(error.code || error.message || 'default', 'tr')
  )
}
