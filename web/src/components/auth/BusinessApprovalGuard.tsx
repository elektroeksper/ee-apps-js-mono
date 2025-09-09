/**
 * Business Approval Guard
 * Checks if business users have been approved by admin
 * Redirects to pending approval page if business account is not approved
 */

import { useAuth } from '@/contexts/AuthContext'
import { isBusinessUser } from '@/types/user'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface BusinessApprovalGuardProps {
  children: React.ReactNode
  requireApproval?: boolean
}

const BusinessApprovalGuard: React.FC<BusinessApprovalGuardProps> = ({
  children,
  requireApproval = true,
}) => {
  const { appUser, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !appUser) return

    // Only check approval for business users
    if (isBusinessUser(appUser) && requireApproval) {
      const extendedUser = appUser as any
      const isApproved = extendedUser?.businessInfo?.isApproved

      // If business user is not approved, redirect to pending approval page
      if (!isApproved) {
        router.replace('/pending-approval')
        return
      }
    }
  }, [appUser, isLoading, router, requireApproval])

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <p className="text-gray-600">Kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  // If no user, let other guards handle it
  if (!appUser) {
    return <>{children}</>
  }

  // For business users, check approval status
  if (isBusinessUser(appUser) && requireApproval) {
    const extendedUser = appUser as any
    const isApproved = extendedUser?.businessInfo?.isApproved

    // If not approved, return nothing (will redirect above)
    if (!isApproved) {
      return null
    }
  }

  // All checks passed, render children
  return <>{children}</>
}

export default BusinessApprovalGuard
