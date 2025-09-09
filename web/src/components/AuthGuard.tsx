/**
 * Auth Guard Components - Public exports
 * Re-exports from auth folder with additional public route components
 */

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import React from 'react'

// Re-export everything from auth folder
export * from './auth'
export { AuthGuard as default } from './auth'

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function PublicRoute({
  children,
  redirectTo = '/home',
}: PublicRouteProps) {
  const router = useRouter()
  const { appUser, isLoading } = useAuth()

  // If still loading, show the content (we'll check auth state when loaded)
  if (isLoading) {
    return <>{children}</>
  }

  // If user is authenticated, redirect to specified route
  if (appUser) {
    if (typeof window !== 'undefined') {
      router.replace(redirectTo)
    }
    return null
  }

  // If not authenticated, show the public content
  return <>{children}</>
}

interface ProtectedRouteProps {
  children: React.ReactNode
  requireEmailVerification?: boolean
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requireEmailVerification = false,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter()
  const { appUser, isLoading } = useAuth()

  // If still loading, show loading state
  if (isLoading) {
    return <>{children}</> // Let the content handle loading state
  }

  // If not authenticated, redirect to login
  if (!appUser) {
    if (typeof window !== 'undefined') {
      router.replace(
        `${redirectTo}?redirect=${encodeURIComponent(router.asPath)}`
      )
    }
    return null
  }

  // If email verification is required and user email is not verified
  if (requireEmailVerification && appUser && !appUser.isEmailVerified) {
    // Don't redirect if already on verify-email page
    if (router.pathname !== '/verify-email') {
      if (typeof window !== 'undefined') {
        router.replace('/verify-email')
      }
      return null
    }
  }

  // If all checks pass, show the protected content
  return <>{children}</>
}
