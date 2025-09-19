/**
 * Setup Page - Profile completion for new users
 * Redirects to appropriate setup based on account type
 */

import { AuthGuard } from '@/components/auth/AuthGuard'
import IndividualSetup from '@/components/setup/IndividualSetup'
import { useAuth } from '@/contexts/AuthContext'
import { AccountType } from '@/shared-generated'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function SetupPage() {
  const { appUser, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is loaded and account type is business, redirect to business setup
    if (!isLoading && appUser?.accountType === AccountType.BUSINESS) {
      // For now, redirect to home since business setup is disabled
      router.replace('/home')
    }
  }, [appUser, isLoading, router])

  // Show loading while checking user
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Individual Setup Component */}
        <IndividualSetup />
      </div>
    </AuthGuard>
  )
}
