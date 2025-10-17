/**
 * Business Approval Guard
 * Checks if business users have been approved by admin
 * Redirects to pending approval page if business account is not approved
 */

import { useAuth } from '@/contexts/AuthContext'
import { AccountType, BusinessVerificationStatus } from '@/shared'
import type { IAppUser } from '@/shared/types/user-types'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'

// Utility function to check if user is a business user
const isBusinessUser = (user: IAppUser): boolean => {
  return user.accountType === AccountType.BUSINESS
}

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
  const [checkingBusiness, setCheckingBusiness] = useState(false)
  const [businessVerificationStatus, setBusinessVerificationStatus] =
    useState<BusinessVerificationStatus | null>(null)

  useEffect(() => {
    if (isLoading || !appUser) return

    // Only check approval for business users
    if (isBusinessUser(appUser) && requireApproval) {
      const businessId = appUser.businessInfo?.businessId

      if (!businessId) {
        console.log(
          'BusinessApprovalGuard: No business ID found, redirecting to setup'
        )
        router.replace('/setup')
        return
      }

      // Fetch business verification status
      const fetchBusinessVerificationStatus = async () => {
        setCheckingBusiness(true)
        try {
          const response = await fetch(`/api/business/${businessId}`, {
            method: 'GET',
            credentials: 'include',
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              const business = result.data
              const verificationStatus = business.verification?.status
              setBusinessVerificationStatus(verificationStatus)

              console.log(
                'BusinessApprovalGuard: Business verification status:',
                {
                  businessId,
                  verificationStatus,
                  hasDocuments: business.documents?.length > 0,
                }
              )

              // Handle redirects based on verification status
              if (verificationStatus === BusinessVerificationStatus.REJECTED) {
                console.log(
                  'BusinessApprovalGuard: Business rejected, redirecting to setup'
                )
                router.replace('/setup')
                return
              } else if (
                !verificationStatus ||
                verificationStatus === BusinessVerificationStatus.UNVERIFIED
              ) {
                console.log(
                  'BusinessApprovalGuard: Business unverified, redirecting to setup'
                )
                router.replace('/setup')
                return
              } else if (
                verificationStatus === BusinessVerificationStatus.PENDING
              ) {
                console.log(
                  'BusinessApprovalGuard: Business pending approval, redirecting to setup'
                )
                router.replace('/setup')
                return
              }
              // If VERIFIED, continue to render children
            } else {
              console.log(
                'BusinessApprovalGuard: Failed to get business data, redirecting to setup'
              )
              router.replace('/setup')
            }
          } else {
            console.log(
              'BusinessApprovalGuard: Business API call failed, redirecting to setup'
            )
            router.replace('/setup')
          }
        } catch (error) {
          console.error(
            'BusinessApprovalGuard: Error fetching business verification status:',
            error
          )
          router.replace('/setup')
        } finally {
          setCheckingBusiness(false)
        }
      }

      fetchBusinessVerificationStatus()
    }
  }, [appUser, isLoading, router, requireApproval])

  // Show loading while checking
  if (isLoading || checkingBusiness) {
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

  // For business users, only render children if verification status is VERIFIED
  if (isBusinessUser(appUser) && requireApproval) {
    if (businessVerificationStatus === BusinessVerificationStatus.VERIFIED) {
      return <>{children}</>
    }
    // If not verified, return null (redirect will happen in useEffect)
    return null
  }

  // All checks passed, render children
  return <>{children}</>
}

export default BusinessApprovalGuard
