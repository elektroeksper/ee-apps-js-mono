/**
 * Pending Approval Page
 * Displayed to business users while their account is awaiting admin approval
 * Redirects to complete-documents if user was rejected
 */

import { AuthGuard } from '@/components/auth'
import { PendingApproval } from '@/components/business'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { AccountType } from '@/shared-generated'
import type { IAppUser } from '@/shared-generated/types/user-types'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

function PendingApprovalContent() {
  const { appUser, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !appUser) return

    // Only for business users
    if (appUser.accountType === AccountType.BUSINESS) {
      const extendedUser = appUser as IAppUser

      // TODO: Add business status checks when available
      // For now, stay on pending approval page
    }
  }, [appUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return <PendingApproval />
}

export default function PendingApprovalPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireEmailVerification={true}
      requireProfileComplete={true}
    >
      <PendingApprovalContent />
    </AuthGuard>
  )
}
