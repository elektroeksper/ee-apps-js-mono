/**
 * User Profile Hook
 * Provides hooks for managing user profile data using Next.js API routes
 */

import { userService } from '@/services/user.service'
import { IAppUser, IBusiness } from '@/shared-generated'
import { useCallback, useEffect, useState } from 'react'

export interface UseUserProfileState {
  user: IAppUser | null
  loading: boolean
  error: string | null
}

export interface UseUserProfileActions {
  fetchUser: (userId: string) => Promise<boolean>
  updateUser: (userId: string, data: Partial<IAppUser>) => Promise<boolean>
  clearError: () => void
  refetch: () => Promise<boolean>
}

export interface UseUserProfileReturn
  extends UseUserProfileState,
    UseUserProfileActions {}

/**
 * Hook for managing a specific user's profile
 */
export function useUserProfile(userId?: string): UseUserProfileReturn {
  const [user, setUser] = useState<IAppUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const fetchUser = useCallback(async (id: string): Promise<boolean> => {
    if (!id) {
      setError('User ID is required')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const result = await userService.getById(id)

      if (result.success && result.data) {
        setUser(result.data)
        return true
      } else {
        setError(result.error || 'Failed to fetch user')
        setUser(null)
        return false
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUser = useCallback(
    async (id: string, data: Partial<IAppUser>): Promise<boolean> => {
      if (!id) {
        setError('User ID is required')
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const result = await userService.update(id, data)

        if (result.success && result.data) {
          setUser(result.data)
          return true
        } else {
          setError(result.error || 'Failed to update user')
          return false
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const refetch = useCallback(async (): Promise<boolean> => {
    if (!userId) return false
    return fetchUser(userId)
  }, [userId, fetchUser])

  // Auto-fetch user on mount if userId is provided
  useEffect(() => {
    if (userId) {
      fetchUser(userId)
    }
  }, [userId, fetchUser])

  return {
    user,
    loading,
    error,
    fetchUser,
    updateUser,
    clearError,
    refetch,
  }
}

/**
 * Hook for checking if a user exists
 */
export function useUserExists() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkExists = useCallback(async (userId: string): Promise<boolean> => {
    if (!userId) {
      setError('User ID is required')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const exists = await userService.checkExists(userId)
      return exists
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    checkExists,
    loading,
    error,
    clearError: () => setError(null),
  }
}

/**
 * Hook for business operations - delegates to business service
 * Note: Business rejection management operates on business documents, not user.businessInfo
 */
export function useBusinessOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearRejection = useCallback(
    async (businessId: string): Promise<IBusiness | null> => {
      if (!businessId) {
        setError('Business ID is required')
        return null
      }

      setLoading(true)
      setError(null)

      try {
        // Import business service to avoid circular dependencies
        const { businessService } = await import('@/services/business.service')
        const result = await businessService.clearBusinessRejection(businessId)

        if (result.success && result.data) {
          return result.data
        } else {
          setError(result.error || 'Failed to clear business rejection')
          return null
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    clearRejection,
    loading,
    error,
    clearError: () => setError(null),
  }
}
