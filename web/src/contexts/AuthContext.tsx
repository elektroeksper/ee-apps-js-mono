'use client'

/**
 * AuthContext - Simple State Container
 * Gets state from user hooks, provides it to components
 */

import {
  useAuthActions,
  useFirebaseAuth,
  useRoles,
  useUserDoc,
} from '@/hooks/auth'
// import { useBusiness } from '@/hooks/useBusiness' // Disabled for Firebase Admin SDK migration
import type { IAuthContextType } from '@/shared'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react'

// Create context
const AuthContext = createContext<IAuthContextType | undefined>(undefined)

// Props for AuthProvider
interface AuthProviderProps {
  children: ReactNode
}

// AuthProvider - consumes useUser and provides state to children
export function AuthProvider({ children }: AuthProviderProps) {
  console.log('🔥 AuthProvider: Getting state from useUser hook')

  // Acquire state from modular auth hooks
  const {
    fireUser,
    claims,
    isAuthLoading,
    error: authError,
    refreshClaims,
  } = useFirebaseAuth()

  // Debug logging for AuthProvider
  console.log('🔥 AuthProvider Debug:', {
    hasFireUser: !!fireUser,
    fireUserEmail: fireUser?.email,
    hasClaims: !!claims,
    claimsKeys: claims ? Object.keys(claims) : [],
    isAuthLoading,
    authError,
    timestamp: new Date().toISOString(),
  })

  const {
    appUser,
    isUserLoading,
    error: userError,
    refresh: refreshUser,
    update: updateUser,
    clearError: clearUserError,
  } = useUserDoc(fireUser?.uid || null)

  // Get business data if user is authenticated
  // Temporarily disabled for Firebase Admin SDK migration
  const business = null
  const businessRole = null
  const businessPermissions: string[] = []
  const isBusinessLoading = false
  const businessError = null
  const refreshBusiness = async () => {}
  const leaveBusiness = async () => ({ success: true })
  const acceptInvitation = async () => ({ success: true })
  const hasPermission = () => false
  const canEditBusiness = false
  const canInviteUsers = false
  const canManageUsers = false
  const canViewOrders = false
  const canManageOrders = false

  /* ORIGINAL - Disabled for Firebase Admin SDK migration
  const {
    business,
    businessRole,
    businessPermissions,
    isLoading: isBusinessLoading,
    error: businessError,
    refresh: refreshBusiness,
    leaveBusiness,
    acceptInvitation,
    hasPermission,
    canEditBusiness,
    canInviteUsers,
    canManageUsers,
    canViewOrders,
    canManageOrders,
  } = useBusiness(fireUser?.uid || null)
  */

  const actions = useAuthActions()
  const { roles, isAdmin, hasRole, hasAnyRole } = useRoles(claims, appUser)

  const clearError = useCallback(() => {
    clearUserError()
    // Note: business errors are handled by the business hook
    // authError is transient; no direct clear right now
  }, [clearUserError])

  // Compute hasDocuments from documents array
  const hasDocuments = useMemo(() => {
    if (!appUser || appUser.accountType !== 'business') return false
    const businessProfile = appUser as any // Type assertion for business profile

    // Check for documents field (interface structure)
    const result =
      businessProfile.documents && businessProfile.documents.length > 0

    console.log('🔍 hasDocuments DEBUG:', {
      userId: appUser.id,
      accountType: appUser.accountType,
      documentsField: businessProfile.documents,
      documentsLength: businessProfile.documents?.length,
      hasDocuments: result,
      allKeys: Object.keys(businessProfile),
      fullAppUser: businessProfile,
    })

    return result
  }, [appUser])

  // Compute profile completion status for all user types
  const isProfileComplete = useMemo(() => {
    if (!appUser) return false

    // Basic required fields for all users
    const hasBasicInfo = !!(
      appUser.firstName &&
      appUser.lastName &&
      appUser.email &&
      appUser.isEmailVerified
    )

    if (!hasBasicInfo) return false

    // For business users, check business-specific requirements
    if (appUser.accountType === 'business') {
      const businessProfile = appUser as any
      const businessInfo = businessProfile.businessInfo || {}

      // Business profile is complete if:
      // 1. Has basic info AND
      // 2. Has company name
      // Note: Document verification is handled by AuthGuard
      const result = !!businessInfo.businessName

      console.log('🔍 isProfileComplete DEBUG:', {
        userId: appUser.id,
        firstName: appUser.firstName,
        lastName: appUser.lastName,
        isEmailVerified: appUser.isEmailVerified,
        hasBasicInfo,
        businessName: businessInfo.businessName,
        businessInfo,
        isProfileComplete: result,
      })

      return result
    }

    // For regular users, basic info is sufficient
    return true
  }, [appUser, hasDocuments])

  const aggregated: IAuthContextType = useMemo(
    () => ({
      // core identities
      fireUser,
      appUser,

      // business information
      business,
      businessRole: businessRole || undefined,
      businessPermissions,

      // business permission helpers
      hasBusinessPermission: hasPermission,
      canEditBusiness,
      canInviteUsers,
      canManageUsers,
      canViewOrders,
      canManageOrders,

      // loading flags
      isLoading: isAuthLoading || isUserLoading || isBusinessLoading,
      isAuthLoading,
      isUserLoading,
      isBusinessLoading,

      // roles
      isAdmin,
      userRoles: roles,
      hasRole,
      hasAnyRole,

      // business document computed properties
      hasDocuments,
      isProfileComplete,

      // errors
      error: authError || userError || businessError,
      clearError,

      // user profile ops
      updateUser,
      refreshUser,
      refreshAuthToken: refreshClaims,

      // business operations
      refreshBusiness: () => Promise.resolve(refreshBusiness()),
      leaveBusiness,
      acceptBusinessInvitation: acceptInvitation,

      // auth actions
      register: actions.register,
      login: actions.login,
      logout: actions.logout,
      loginWithGoogle: actions.loginWithGoogle,
      sendEmailVerification: actions.sendEmailVerification,
    }),
    [
      fireUser,
      appUser,
      business,
      businessRole,
      businessPermissions,
      hasPermission,
      canEditBusiness,
      canInviteUsers,
      canManageUsers,
      canViewOrders,
      canManageOrders,
      isAuthLoading,
      isUserLoading,
      isBusinessLoading,
      isAdmin,
      roles,
      hasRole,
      hasAnyRole,
      hasDocuments,
      isProfileComplete,
      authError,
      userError,
      businessError,
      clearError,
      updateUser,
      refreshUser,
      refreshClaims,
      refreshBusiness,
      leaveBusiness,
      acceptInvitation,
      actions,
    ]
  )

  return (
    <AuthContext.Provider value={aggregated}>{children}</AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth(): IAuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
