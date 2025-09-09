'use client'

import { IAppUser } from '@/shared-generated';
import { useMemo } from 'react';

interface RoleState {
  roles: string[];
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export function useRoles(claims: Record<string, any> | null, appUser: IAppUser | null): RoleState {
  return useMemo(() => {
    const claimRolesRaw = claims?.roles
    let claimRoles: string[] = []
    if (Array.isArray(claimRolesRaw)) claimRoles = claimRolesRaw as string[]
    else if (typeof claimRolesRaw === 'string') claimRoles = [claimRolesRaw]

    // Merge roles from user document if present (rolesList preferred, fallback to legacy enum roles)
    const docRoles = (appUser?.rolesList as string[] | undefined) || (appUser?.roles as unknown as string[]) || []
    // Normalize to unique, preserve original casing; then remove any 'admin' role string (case-insensitive)
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
        docRoles,
        merged,
        isAdmin,
        timestamp: new Date().toISOString()
      })
    }

    return { roles: merged, isAdmin, hasRole, hasAnyRole }
  }, [claims, appUser])
}
