/**
 * Profile Completion Guard
 * Automatically redirects users with incomplete profiles to appropriate pages
 */

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

interface ProfileCompletionGuardProps {
  children: React.ReactNode
  requireComplete?: boolean
  redirectIncomplete?: string
  redirectUnverified?: string
}

export function ProfileCompletionGuard({
  children,
  requireComplete = false,
  redirectIncomplete = '/setup',
  redirectUnverified = '/verify-email',
}: ProfileCompletionGuardProps) {
  const { appUser, isLoading, isProfileComplete } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !appUser) return

    console.log('🛡️ ProfileCompletionGuard DEBUG:', {
      userId: appUser.id,
      accountType: appUser.accountType,
      isEmailVerified: appUser.isEmailVerified,
      isProfileComplete,
      requireComplete,
      redirectIncomplete,
      willRedirect: requireComplete && !isProfileComplete,
    })

    // Check email verification first
    if (!appUser.isEmailVerified) {
      console.log('🛡️ Redirecting to email verification')
      router.replace(redirectUnverified)
      return
    }

    // Then check profile completion if required
    if (requireComplete && !isProfileComplete) {
      console.log('🛡️ Redirecting to setup due to incomplete profile')
      router.replace(redirectIncomplete)
      return
    }
  }, [
    appUser,
    isLoading,
    router,
    requireComplete,
    redirectIncomplete,
    redirectUnverified,
    isProfileComplete,
  ])

  // Don't render children while loading or redirecting
  if (isLoading) {
    return null
  }

  if (!appUser) {
    return null
  }

  // If email verification is required but not completed
  if (!appUser.isEmailVerified) {
    return null
  }

  // If profile completion is required but not completed
  if (requireComplete && !isProfileComplete) {
    return null
  }

  return <>{children}</>
}

export default ProfileCompletionGuard
