/**
 * Business Invitation Accept Page
 * Handles invitation token from URL and displays acceptance UI
 */

'use client'

import { InvitationAcceptance } from '@/components/business/InvitationManager'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function () {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fireUser, isLoading } = useAuth()

  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const inviteToken = searchParams?.get('token')

    if (!inviteToken) {
      setError('Invalid invitation link. No token provided.')
      return
    }

    setToken(inviteToken)
  }, [searchParams])

  const handleInvitationResult = (success: boolean, message?: string) => {
    if (success) {
      // Redirect to dashboard or business page after successful acceptance
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login requirement if not authenticated
  if (!fireUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sign in required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You need to sign in to accept this business invitation.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={() =>
                router.push(
                  `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
                )
              }
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </button>

            <button
              onClick={() =>
                router.push(
                  `/register?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
                )
              }
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show error if no token
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Invitation
            </h2>

            <p className="text-gray-600 mb-6">{error}</p>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show invitation acceptance UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <InvitationAcceptance
          token={token!}
          onResult={handleInvitationResult}
        />
      </div>
    </div>
  )
}
