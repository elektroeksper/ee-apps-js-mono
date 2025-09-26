'use client'

import { IAppUser } from '@/shared-generated'
import { useMemo } from 'react'

interface RoleState {
  roles: string[]
  isAdmin: boolean
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
}

export function useRoles(
  claims: Record<string, any> | null,
  appUser: IAppUser | null
): RoleState {
  return useMemo(() => {
    const claimRolesRaw = claims?.roles
    let claimRoles: string[] = []
    if (Array.isArray(claimRolesRaw)) claimRoles = claimRolesRaw as string[]
    else if (typeof claimRolesRaw === 'string') claimRoles = [claimRolesRaw]

    // Get business role from user document businessInfo
    const docRoles: string[] = []
    if (appUser?.businessInfo?.role) {
      docRoles.push(appUser.businessInfo.role)
    }

    // Merge roles from claims and user document business role; then remove any 'admin' role string (case-insensitive)
    const mergedAll = Array.from(new Set([...claimRoles, ...docRoles]))
    const merged = mergedAll.filter(r => r.toLowerCase() !== 'admin')
    const mergedLower = merged.map(r => r.toLowerCase())

    // Admin detection: ONLY custom claim explicitly set to true
    const isAdmin = claims?.admin === true

    const hasRole = (role: string) => {
      const target = role.toLowerCase()
      return isAdmin || mergedLower.includes(target)
    }
    const hasAnyRole = (roles: string[]) => {
      return isAdmin || roles.some(r => mergedLower.includes(r.toLowerCase()))
    }

    if (process.env.NODE_ENV !== 'production') {
      // Enhanced debug logging for troubleshooting
      console.log('🔑 useRoles Debug:', {
        claimsAdmin: claims?.admin,
        claimRoles: claimRolesRaw,
        businessRole: appUser?.businessInfo?.role,
        docRoles,
        merged,
        isAdmin,
        timestamp: new Date().toISOString(),
      })
    }

    return { roles: merged, isAdmin, hasRole, hasAnyRole }
  }, [claims, appUser])
}
