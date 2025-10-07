'use client'

/**
 * Authentication Guard Component
 * Direct consumption of AuthContext for cleaner architecture
 */

import { LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import {
  AccountType,
  AuthRole,
  BusinessVerificationStatus,
} from '@/shared-generated'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  requireEmailVerification?: boolean
  requireProfileComplete?: boolean
  allowedAccountTypes?: AccountType[]
  allowedRoles?: AuthRole[]
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireEmailVerification = false,
  requireProfileComplete = false,
  allowedAccountTypes,
  allowedRoles,
  redirectTo,
  fallback,
}: AuthGuardProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Direct consumption of AuthContext - Firebase listener is in AuthProvider
  const {
    appUser,
    isLoading,
    error,
    isAdmin,
    isProfileComplete,
    refreshAuthToken,
  } = useAuth()

  // Ensure we only run on client side
  useEffect(() => {
    setMounted(true)

    // Force refresh of auth token to ensure claims are loaded
    if (requireAdmin) {
      console.log('🔄 AuthGuard: Forcing auth token refresh for admin check...')
      refreshAuthToken?.()
    }
  }, [requireAdmin, refreshAuthToken])

  const loading = isLoading

  // Enhanced debug logs for troubleshooting admin route issues
  console.log('🛡️ AuthGuard Debug:', {
    mounted,
    loading,
    requireAuth,
    requireAdmin,
    hasAppUser: !!appUser,
    appUserEmail: appUser?.email,
    isAdmin,
    error,
    isProfileComplete,
    pathname: router.pathname,
    timestamp: new Date().toISOString(),
  })

  // (Optional) debug logs can be toggled via env flag if needed
  // console.debug('AuthGuard:', { mounted, user: appUser?.email, loading, isAdmin, requireAdmin })

  // Handle redirects - simplified without token refresh
  useEffect(() => {
    if (mounted && !loading && requireAuth && !appUser) {
      console.log('🚨 AuthGuard Redirect:', {
        reason: 'No authenticated user',
        redirectTo: redirectTo || '/login',
        pathname: router.pathname,
      })
      router.replace(redirectTo || '/login')
    }
  }, [mounted, loading, requireAuth, appUser, router, redirectTo])

  // Handle profile completion redirect
  useEffect(() => {
    if (
      mounted &&
      !loading &&
      appUser &&
      !isProfileComplete &&
      router.pathname !== '/setup' &&
      router.pathname !== '/verification'
    ) {
      console.log('🚨 AuthGuard Profile Redirect:', {
        reason: 'Profile incomplete',
        redirectTo: '/setup',
        pathname: router.pathname,
        isProfileComplete,
      })
      router.replace('/setup')
    }
  }, [mounted, loading, appUser, isProfileComplete, router])

  // Handle business user redirects when profile is complete but they need approval handling
  useEffect(() => {
    if (
      mounted &&
      !loading &&
      appUser &&
      isProfileComplete &&
      appUser.accountType === 'business' &&
      requireProfileComplete &&
      router.pathname !== '/home' &&
      router.pathname !== '/verification' &&
      router.pathname !== '/setup'
    ) {
      // Check business verification status by fetching business data
      const checkBusinessVerificationStatus = async () => {
        const businessId = appUser?.businessInfo?.businessId
        if (!businessId) {
          console.log('🚨 AuthGuard Business Redirect:', {
            reason: 'No business ID - redirect to setup',
            redirectTo: '/setup',
            pathname: router.pathname,
          })
          router.replace('/setup')
          return
        }

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
              const hasDocuments =
                business.documents && business.documents.length > 0

              console.log('🔍 Business Verification Check:', {
                businessId,
                verificationStatus,
                hasDocuments,
                documentsCount: business.documents?.length || 0,
                pathname: router.pathname,
              })

              // Redirect based on verification status and documents
              if (verificationStatus === BusinessVerificationStatus.REJECTED) {
                console.log('🚨 AuthGuard Business Redirect:', {
                  reason: 'Business rejected - redirect to setup',
                  redirectTo: '/setup',
                  pathname: router.pathname,
                })
                router.replace('/setup')
              } else if (
                verificationStatus === BusinessVerificationStatus.VERIFIED
              ) {
                console.log('🚨 AuthGuard Business Redirect:', {
                  reason: 'Business verified - redirect to home',
                  redirectTo: '/home',
                  pathname: router.pathname,
                })
                router.replace('/home')
              } else if (
                verificationStatus === BusinessVerificationStatus.PENDING
              ) {
                console.log('🚨 AuthGuard Business Redirect:', {
                  reason:
                    'Business pending approval - redirect to verification',
                  redirectTo: '/verification',
                  pathname: router.pathname,
                })
                router.replace('/verification')
              } else {
                // No documents or unverified status - redirect to setup
                console.log('🚨 AuthGuard Business Redirect:', {
                  reason:
                    'Business has no documents or unverified - redirect to setup',
                  redirectTo: '/setup',
                  pathname: router.pathname,
                  verificationStatus,
                  hasDocuments,
                })
                router.replace('/setup')
              }
            } else {
              // Failed to get business data - redirect to setup
              console.log('🚨 AuthGuard Business Redirect:', {
                reason: 'Failed to fetch business data - redirect to setup',
                redirectTo: '/setup',
                pathname: router.pathname,
              })
              router.replace('/setup')
            }
          } else {
            // API call failed - redirect to setup
            console.log('🚨 AuthGuard Business Redirect:', {
              reason: 'Business API call failed - redirect to setup',
              redirectTo: '/setup',
              pathname: router.pathname,
            })
            router.replace('/setup')
          }
        } catch (error) {
          console.error('Error checking business verification status:', error)
          // On error, redirect to setup
          console.log('🚨 AuthGuard Business Redirect:', {
            reason: 'Error checking business status - redirect to setup',
            redirectTo: '/setup',
            pathname: router.pathname,
            error: error,
          })
          router.replace('/setup')
        }
      }

      checkBusinessVerificationStatus()
    }
  }, [
    mounted,
    loading,
    appUser,
    isProfileComplete,
    router,
    requireProfileComplete,
  ])

  // Show loading spinner while checking authentication or during hydration
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="large" />
          <p className="text-sm text-gray-500">
            Kullanıcı verileri yükleniyor...
          </p>
        </div>
      </div>
    )
  }

  // Show error if any
  if (error) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">
              Kimlik Doğrulama Hatası
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      )
    )
  }

  // Check authentication requirement
  if (requireAuth && !appUser) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">
              Kimlik Doğrulama Gerekli
            </h2>
            <p className="text-gray-500">
              Bu sayfaya erişmek için lütfen giriş yapın.
            </p>
          </div>
        </div>
      )
    )
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    console.log('🚨 AuthGuard Admin Check Failed:', {
      requireAdmin,
      isAdmin,
      appUserEmail: appUser?.email,
      pathname: router.pathname,
    })
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">
              Erişim Reddedildi
            </h2>
            <p className="text-gray-600">
              Bu sayfaya erişmek için yönetici yetkilerine sahip değilsiniz.
            </p>
          </div>
        </div>
      )
    )
  }

  // Check email verification requirement
  if (requireEmailVerification && appUser && !appUser.isEmailVerified) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-yellow-600 mb-2">
              E-posta Doğrulaması Gerekli
            </h2>
            <p className="text-gray-600">
              Bu sayfaya erişmek için lütfen e-posta adresinizi doğrulayın.
            </p>
          </div>
        </div>
      )
    )
  }

  // Check profile completion requirement
  if (requireProfileComplete && !isProfileComplete) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-blue-600 mb-2">
              Profilinizi Tamamlayın
            </h2>
            <p className="text-gray-600">
              Bu sayfaya erişmek için lütfen profil kurulumunuzu tamamlayın.
            </p>
          </div>
        </div>
      )
    )
  }

  // Check account type restrictions
  if (allowedAccountTypes && appUser && allowedAccountTypes.length > 0) {
    const userAccountType = appUser.accountType
    if (!allowedAccountTypes.includes(userAccountType)) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600 mb-2">
                Hesap Türü Kısıtlaması
              </h2>
              <p className="text-gray-600">
                Bu sayfa hesap türünüz için kullanılamaz.
              </p>
            </div>
          </div>
        )
      )
    }
  }

  // Check role restrictions
  if (allowedRoles && allowedRoles.length > 0) {
    // Implementation would depend on how roles are stored
    // For now, skip this check
    // Future: implement role filtering if needed
  }

  // All checks passed, render children
  return <>{children}</>
}

// Lightweight helpers for simple routing cases (formerly in wrapper component)
export function PublicRoute({
  children,
  redirectTo = '/home',
}: {
  children: React.ReactNode
  redirectTo?: string
}) {
  const router = useRouter()
  const { appUser, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only redirect if we're sure the user is authenticated and mounted
  useEffect(() => {
    if (mounted && !isLoading && appUser) {
      console.log(
        '🔄 PublicRoute: Redirecting authenticated user to:',
        redirectTo
      )
      // Use replace to avoid adding to history
      router.replace(redirectTo)
    }
  }, [mounted, isLoading, appUser, redirectTo, router])

  // Show children while loading or if not authenticated
  if (!mounted || isLoading || !appUser) {
    return <>{children}</>
  }

  // User is authenticated, don't render children (redirect in progress)
  return null
}

export function ProtectedRoute({
  children,
  requireEmailVerification = false,
  redirectTo = '/login',
}: {
  children: React.ReactNode
  requireEmailVerification?: boolean
  redirectTo?: string
}) {
  const router = useRouter()
  const { appUser, isLoading } = useAuth()
  if (isLoading) return <>{children}</>
  if (!appUser) {
    if (typeof window !== 'undefined')
      router.replace(
        `${redirectTo}?redirect=${encodeURIComponent(router.asPath)}`
      )
    return null
  }
  if (
    requireEmailVerification &&
    appUser &&
    !appUser.isEmailVerified &&
    router.pathname !== '/auth/verify-email'
  ) {
    const isBusinessUser =
      appUser.accountType === AccountType.BUSINESS || appUser.businessInfo
    const verifyEmailUrl = isBusinessUser
      ? '/auth/verify-email?type=business'
      : '/auth/verify-email'
    if (typeof window !== 'undefined') router.replace(verifyEmailUrl)
    return null
  }
  return <>{children}</>
}
