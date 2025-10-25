import categoryService from '@services/category.service'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

export const initMainCategories = onCall(async request => {
  // Check if the request comes from an authenticated admin user
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated')
  }

  // Check if user has admin privileges
  if (!request.auth.token.admin) {
    throw new HttpsError('permission-denied', 'User must have admin privileges')
  }

  try {
    return await categoryService.initialize()
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw new HttpsError(
      'internal',
      `Failed to initialize categories: ${errorMessage}`
    )
  }
})
