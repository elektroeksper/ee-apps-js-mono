/**
 * Pending Approval Page
 * Displayed to business users while their account is awaiting admin approval
 * Redirects to complete-documents if user was rejected
 */

import { AuthGuard } from '@/components/auth'
import { VerificationStatus } from '@/components/business'
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

    // Only for business users - simple document and phone verification check
    if (appUser.accountType === AccountType.BUSINESS) {
      const extendedUser = appUser as IAppUser

      // Check if user has business info and documents
      const hasBusinessInfo = extendedUser.businessInfo?.businessId
      const businessId = extendedUser.businessInfo?.businessId

      if (!hasBusinessInfo) {
        console.log('🔄 No business info found, staying on verification')
        return
      }

      // Fetch business data to check document status and phone
      const checkBusinessStatus = async () => {
        try {
          // Get current user's ID token for authentication
          let idToken: string | null = null
          try {
            // Import Firebase auth dynamically to avoid SSR issues
            const { auth } = await import('@/lib/firebase-auth-config')
            if (auth?.currentUser) {
              idToken = await auth.currentUser.getIdToken()
            }
          } catch (error) {
            console.warn('Error getting ID token:', error)
          }

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }

          if (idToken) {
            headers.Authorization = `Bearer ${idToken}`
          }

          const response = await fetch(`/api/business/${businessId}`, {
            method: 'GET',
            headers,
            credentials: 'include',
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              const business = result.data

              // Check if business has documents
              const hasDocuments =
                business.documents && business.documents.length > 0

              // Check if business has phone (if business phone verification is required)
              const hasBusinessPhone =
                business.phone && business.phone.trim() !== ''

              console.log('📋 Business Status Check:', {
                hasDocuments,
                hasBusinessPhone,
                documentsCount: business.documents?.length || 0,
                businessPhone: business.phone,
                businessName: business.businessName,
              })

              // For now, just stay on pending approval - let admin handle approval process
              // No automatic redirects based on status
            }
          }
        } catch (error) {
          console.error('Error checking business status:', error)
          // Stay on pending approval even if there's an error
        }
      }

      checkBusinessStatus()
    }
  }, [appUser, isLoading, router])

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
          <LoadingSpinner size="large" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-auth relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      <div className="relative z-10">
        <VerificationStatus />
      </div>
    </div>
  )
}

export default function PendingApprovalPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireEmailVerification={false}
      requireProfileComplete={false}
    >
      <PendingApprovalContent />
    </AuthGuard>
  )
}
