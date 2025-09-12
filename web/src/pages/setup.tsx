/**
 * Setup Page
 * Routes users to appropriate setup component based on account type
 */

import { AuthGuard } from '@/components/auth/AuthGuard'
import BusinessSetup from '@/components/setup/BusinessSetup'
import IndividualSetup from '@/components/setup/IndividualSetup'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import {
  IExtendedAppUser,
  isBusinessApproved,
  isBusinessRejected,
} from '@/types/user'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

function SetupContent() {
  const { appUser, isLoading, isProfileComplete } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // If no user, this will be handled by AuthGuard
    if (!appUser) return

    // If email is not verified, redirect to email verification
    if (!appUser.isEmailVerified) {
      router.replace('/verify-email')
      return
    }

    // If profile is already complete, redirect appropriately
    if (isProfileComplete) {
      console.log('Profile is complete, redirecting...')

      // For business users with complete profile, check their approval status
      if (appUser.accountType === 'business') {
        const extendedUser = appUser as IExtendedAppUser

        if (isBusinessRejected(extendedUser)) {
          console.log(
            'Business profile rejected, redirecting to complete-documents'
          )
          router.replace('/complete-documents')
        } else if (isBusinessApproved(extendedUser)) {
          console.log('Business profile approved, redirecting to home')
          router.replace('/home')
        } else {
          console.log(
            'Business profile pending approval, redirecting to pending-approval'
          )
          router.replace('/pending-approval')
        }
      } else {
        console.log('Individual profile complete, redirecting to home')
        router.replace('/home')
      }
      return
    }
  }, [appUser, isLoading, router, isProfileComplete])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // If no user or account type, show error
  if (!appUser || !appUser.accountType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Hesap Tipi Bulunamadı
          </h2>
          <p className="text-gray-600 mb-6">
            Lütfen önce hesap tipinizi seçin.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Kayıt Sayfasına Git
          </button>
        </div>
      </div>
    )
  }

  // Render appropriate setup component based on account type
  if (appUser.accountType === 'business') {
    return <BusinessSetup />
  } else {
    return <IndividualSetup />
  }
}

export default function SetupPage() {
  return (
    <AuthGuard requireAuth={true}>
      <SetupContent />
    </AuthGuard>
  )
}
