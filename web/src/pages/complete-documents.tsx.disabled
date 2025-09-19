/**
 * Complete Documents Page
 * Displayed to business users whose account was rejected and need to re-submit documents
 */

import { AuthGuard } from '@/components/auth'
import { CompleteDocuments } from '@/components/business'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { AccountType } from '@/shared-generated'
import type { IAppUser } from '@/shared-generated/types/user-types'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

function CompleteDocumentsContent() {
  const { appUser, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !appUser) return

    // Only for business users
    if (appUser.accountType === AccountType.BUSINESS) {
      const extendedUser = appUser as IAppUser

      // TODO: Add business status logic when available
      // For now, stay on complete documents page
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
