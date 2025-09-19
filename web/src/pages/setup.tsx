/**
 * Setup Page - Profile completion for new users
 * Shows appropriate setup form based on account type
 */

import { AuthGuard } from '@/components/auth/AuthGuard'
import BusinessSetup from '@/components/setup/BusinessSetup'
import IndividualSetup from '@/components/setup/IndividualSetup'
import { useAuth } from '@/contexts/AuthContext'
import { AccountType } from '@/shared-generated'

export default function SetupPage() {
  const { appUser, isLoading } = useAuth()

  // Show loading while checking user
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Determine which setup component to show based on account type
  const isBusinessUser = appUser?.accountType === AccountType.BUSINESS

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        {isBusinessUser ? <BusinessSetup /> : <IndividualSetup />}
      </div>
    </AuthGuard>
  )
}
