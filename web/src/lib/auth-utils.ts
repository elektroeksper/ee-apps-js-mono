/**
 * Authentication Utilities
 * Helper functions for authentication flow and navigation
 */

import { authService } from '@/services/auth'
import { NextRouter } from 'next/router'

/**
 * Logout user and redirect to login page with proper URL update
 */
export async function logoutAndRedirect(router: NextRouter, redirectTo: string = '/login'): Promise<void> {
  try {
    console.log('🚪 Logging out user and redirecting...')

    // Perform logout
    const result = await authService.logout()

    if (result.success) {
      console.log('✅ Logout successful, redirecting to:', redirectTo)
    } else {
      console.warn('⚠️ Logout had issues but proceeding with redirect:', result.error)
    }

    // Force URL update using replace (doesn't add to history)
    await router.replace(redirectTo)

  } catch (error) {
    console.error('❌ Logout error:', error)
    // Force redirect even if logout fails
    await router.replace(redirectTo)
  }
}

/**
 * Redirect to login with proper URL update
 */
export async function redirectToLogin(router: NextRouter, returnUrl?: string): Promise<void> {
  const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'
  console.log('🔄 Redirecting to login:', loginUrl)
  await router.replace(loginUrl)
}

/**
 * Redirect after successful authentication
 */
export async function redirectAfterAuth(router: NextRouter, defaultUrl: string = '/'): Promise<void> {
  // Check if there's a return URL from query params
  const returnUrl = router.query.returnUrl as string
  const targetUrl = returnUrl || defaultUrl

  console.log('🎯 Redirecting after auth to:', targetUrl)
  await router.replace(targetUrl)
}

/**
 * Clear browser history and redirect (useful for logout)
 */
export function clearHistoryAndRedirect(router: NextRouter, url: string): void {
  // Clear the history stack and navigate to new URL
  window.history.replaceState(null, '', url)
  router.replace(url)
}
