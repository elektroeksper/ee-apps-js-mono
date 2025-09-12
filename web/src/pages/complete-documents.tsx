/**
 * Complete Documents Page
 * Displayed to business users whose account was rejected and need to re-submit documents
 */

import { AuthGuard } from '@/components/auth'
import { CompleteDocuments } from '@/components/business'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import {
  IExtendedAppUser,
  isBusinessApproved,
  isBusinessRejected,
} from '@/types/user'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

function CompleteDocumentsContent() {
  const { appUser, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !appUser) return

    // Only for business users
    if (appUser.accountType === 'business') {
      const extendedUser = appUser as IExtendedAppUser

      // If approved, redirect to home
      if (isBusinessApproved(extendedUser)) {
        console.log('Business user approved, redirecting to home')
        router.replace('/home')
        return
      }

      // If not rejected, redirect to pending approval
      if (!isBusinessRejected(extendedUser)) {
        console.log(
          'Business user not rejected, redirecting to pending-approval'
        )
        router.replace('/pending-approval')
        return
      }
    }
  }, [appUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return <CompleteDocuments />
}

export default function CompleteDocumentsPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireEmailVerification={true}
      requireProfileComplete={true}
    >
      <CompleteDocumentsContent />
    </AuthGuard>
  )
}
