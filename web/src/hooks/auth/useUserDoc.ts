'use client'

import { AccountType, IAppUser } from '@/shared'
import { useCallback, useEffect, useState } from 'react'
import { useFirebaseAuth } from './useFirebaseAuth'

interface UseUserDocState {
  appUser: IAppUser | null
  isUserLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  update: (data: Partial<IAppUser>) => Promise<IAppUser | null>
  clearError: () => void
}

export function useUserDoc(uid: string | null): UseUserDocState {
  const [appUser, setAppUser] = useState<IAppUser | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fireUser } = useFirebaseAuth()

  const load = useCallback(async () => {
    if (!uid) {
      setAppUser(null)
      return
    }

    setIsUserLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/user/${uid}`, {
        credentials: 'include',
      })

      if (response.status === 404) {
        // User document doesn't exist, let's create it
        if (fireUser && fireUser.uid === uid) {
          console.log('🔧 Creating new user document for:', uid)

          const userProfile: Partial<IAppUser> = {
            id: fireUser.uid,
            firstName: '',
            lastName: '',
            displayName: fireUser.displayName || '',
            email: fireUser.email || '',
            photoURL: fireUser.photoURL || '',
            accountType: AccountType.INDIVIDUAL,
            isEmailVerified: fireUser.emailVerified,
            isPhoneVerified: false,
            preferences: {
              theme: 'system',
              language: 'en',
              notifications: {
                email: true,
                push: true,
                sms: false,
                marketing: false,
                orderUpdates: true,
                securityAlerts: true,
              },
              privacy: {
                profileVisibility: 'private',
                showEmail: false,
                showPhone: false,
                allowAnalytics: true,
              },
            },
            isActive: true,
            lastLoginAt: new Date(),
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          const createResponse = await fetch(`/api/user/${uid}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(userProfile),
          })

          if (createResponse.ok) {
            const createResult = await createResponse.json()
            if (createResult.success && createResult.data) {
              console.log(
                '✅ User document created successfully:',
                createResult.data.id
              )
              setAppUser(createResult.data)
              return
            }
          } else {
            const errorText = await createResponse.text()
            console.error('❌ Failed to create user document:', {
              status: createResponse.status,
              statusText: createResponse.statusText,
              error: errorText,
            })
            throw new Error(
              `Failed to create user document: ${createResponse.status} ${errorText}`
            )
          }
        } else {
          setAppUser(null)
          return
        }
      } else if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAppUser(result.data)
        } else {
          setAppUser(null)
        }
      } else {
        // Check for user mismatch error
        if (response.status === 403) {
          try {
            const errorResult = await response.json()
            if (
              errorResult.code === 'USER_MISMATCH' &&
              errorResult.shouldLogout
            ) {
              console.log('🔄 User mismatch detected, forcing logout...')
              // Force logout by calling logout API
              await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
              })
              // Reload the page to clear any cached state
              window.location.reload()
              return
            }
          } catch (parseError) {
            // If we can't parse the error, continue with default error handling
          }
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`)
      }
    } catch (e) {
      console.error('🚨 Error in useUserDoc load:', e)
      setError(e instanceof Error ? e.message : 'Failed to load user data')
      setAppUser(null)
    } finally {
      setIsUserLoading(false)
    }
  }, [uid, fireUser])

  const update = useCallback(
    async (data: Partial<IAppUser>): Promise<IAppUser | null> => {
      if (!uid) {
        setError('No user ID provided')
        return null
      }

      setIsUserLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/user/${uid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          // Check for user mismatch error in update function too
          if (response.status === 403) {
            try {
              const errorResult = await response.json()
              if (
                errorResult.code === 'USER_MISMATCH' &&
                errorResult.shouldLogout
              ) {
                console.log(
                  '🔄 User mismatch detected during update, forcing logout...'
                )
                // Force logout by calling logout API
                await fetch('/api/auth/logout', {
                  method: 'POST',
                  credentials: 'include',
                })
                // Reload the page to clear any cached state
                window.location.reload()
                return null
              }
            } catch (parseError) {
              // If we can't parse the error, continue with default error handling
            }
          }
          throw new Error(`Failed to update user: ${response.statusText}`)
        }

        const result = await response.json()
        if (result.success && result.data) {
          setAppUser(result.data)
          return result.data
        } else {
          throw new Error('Failed to update user')
        }
      } catch (e) {
        console.error('�� Error in useUserDoc update:', e)
        setError(e instanceof Error ? e.message : 'Failed to update user data')
        return null
      } finally {
        setIsUserLoading(false)
      }
    },
    [uid]
  )

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    appUser,
    isUserLoading,
    error,
    refresh,
    update,
    clearError,
  }
}
