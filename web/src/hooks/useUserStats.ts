/**
 * useUserStats Hook
 * Provides user statistics functionality for admin dashboard
 */

import { useAuth } from '@/contexts/AuthContext'
import { useCallback, useEffect, useState } from 'react'

interface IUserStats {
  totalUsers: number
  activeUsers: number
  adminCount: number
  businessUsers: number
  individualUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  recentRegistrations: number // Last 7 days
  monthlyGrowth: number // % growth this month
  businessVerificationStats?: {
    pending: number
    verified: number
    rejected: number
    unverified: number
  }
}

interface IUseUserStatsReturn {
  stats: IUserStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearError: () => void
  debugClaims: () => Promise<void>
}

/**
 * Hook to manage user statistics for admin dashboard
 */
export function useUserStats(): IUseUserStatsReturn {
  const [stats, setStats] = useState<IUserStats | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const { fireUser, isAuthLoading, isAdmin } = useAuth()

  // Helper function to clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Fetch user statistics
  const fetchStats = useCallback(async () => {
    // Don't fetch if auth is still loading
    if (isAuthLoading) {
      console.log('🔄 Auth still loading, skipping stats fetch')
      return
    }

    if (!fireUser) {
      setError('User not authenticated')
      return
    }

    // Check if user is admin before making the request
    if (!isAdmin) {
      console.log('⚠️ User is not admin, skipping stats fetch')
      setError('User does not have admin privileges')
      return
    }

    setLoading(true)
    clearError()

    try {
      // Get the ID token from the Firebase user
      // Cast to any to access getIdToken method which exists on Firebase User but not on IFirebaseUser
      const firebaseUser = fireUser as any

      console.log('🔄 Getting fresh token for admin stats...')
      const idToken = await firebaseUser.getIdToken(true) // Force refresh to get latest claims

      console.log('🔄 Making admin stats request...')
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 Admin stats response status:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please login')
        }
        if (response.status === 403) {
          throw new Error('Insufficient permissions - admin access required')
        }
        const errorText = await response.text()
        console.error('❌ Admin stats API error:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        console.log('✅ Admin stats loaded successfully')
        setStats(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch user statistics')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch user statistics'
      console.error('❌ Error fetching user stats:', error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [fireUser, isAuthLoading, isAdmin, clearError])

  // Debug function to check current user claims
  const debugClaims = useCallback(async () => {
    if (!fireUser) {
      console.log('DEBUG - No authenticated user')
      return
    }

    try {
      const firebaseUser = fireUser as any
      const idToken = await firebaseUser.getIdToken(true)

      const response = await fetch('/api/admin/debug-claims', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      console.log('DEBUG - User Claims Response:', result)

      if (result.success) {
        console.log('DEBUG - Claims Data:', result.data)
      } else {
        console.error('DEBUG - Claims Error:', result.error)
      }
    } catch (error) {
      console.error('DEBUG - Error checking claims:', error)
    }
  }, [fireUser])

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  // Auto-fetch on component mount (only if user is authenticated and is admin)
  useEffect(() => {
    if (!isAuthLoading && fireUser && isAdmin) {
      console.log('🔄 Auth ready, user is admin, fetching stats...')
      fetchStats()
    } else {
      console.log('⏳ Waiting for auth:', {
        isAuthLoading,
        hasUser: !!fireUser,
        isAdmin,
      })
    }
  }, [fetchStats, fireUser, isAuthLoading, isAdmin])

  return {
    stats,
    loading,
    error,
    refetch,
    clearError,
    debugClaims,
  }
}

/**
 * Hook to get user statistics with auto-refresh
 */
export function useUserStatsWithRefresh(
  intervalMs: number = 30000
): IUseUserStatsReturn {
  const statsHook = useUserStats()

  useEffect(() => {
    if (intervalMs <= 0) return

    const interval = setInterval(() => {
      statsHook.refetch()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [statsHook.refetch, intervalMs])

  return statsHook
}
