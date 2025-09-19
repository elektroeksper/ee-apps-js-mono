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

    // Only for business users - simple document and phone verification check
    if (appUser.accountType === AccountType.BUSINESS) {
      const extendedUser = appUser as IAppUser

      // Check if user has business info and documents
      const hasBusinessInfo = extendedUser.businessInfo?.businessId
      const businessId = extendedUser.businessInfo?.businessId

      if (!hasBusinessInfo) {
        console.log('🔄 No business info found, staying on pending-approval')
        return
      }

      // Fetch business data to check document status and phone
      const checkBusinessStatus = async () => {
        try {
          const response = await fetch(`/api/business/${businessId}`, {
            method: 'GET',
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
      requireEmailVerification={false}
      requireProfileComplete={false}
    >
      <PendingApprovalContent />
    </AuthGuard>
  )
}
