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
      <div className="min-h-screen flex items-center justify-center bg-gradient-auth relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Determine which setup component to show based on account type
  const isBusinessUser = appUser?.accountType === AccountType.BUSINESS

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-auth relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10">
          {isBusinessUser ? <BusinessSetup /> : <IndividualSetup />}
        </div>
      </div>
    </AuthGuard>
  )
}
