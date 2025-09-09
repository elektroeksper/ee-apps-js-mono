'use client'

/**
 * Authentication Guard Component
 * Direct consumption of AuthContext for cleaner architecture
 */

import { LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { AccountType, AuthRole } from '@/shared-generated'
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
  const { appUser, isLoading, error, isAdmin, isProfileComplete } = useAuth()

  // Ensure we only run on client side
  useEffect(() => {
    setMounted(true)
  }, [])

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
      router.pathname !== '/setup'
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
  if (isLoading) return <>{children}</>
  if (appUser) {
    if (typeof window !== 'undefined') router.replace(redirectTo)
    return null
  }
  return <>{children}</>
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
    router.pathname !== '/verify-email'
  ) {
    if (typeof window !== 'undefined') router.replace('/verify-email')
    return null
  }
  return <>{children}</>
}
