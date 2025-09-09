'use client'

import { useAuth } from '@/contexts/AuthContext'
import React, { useState } from 'react'
import { Button } from './ui/Button'

interface EmailVerificationBannerProps {
  onDismiss?: () => void
  showDismiss?: boolean
}

export const EmailVerificationBanner: React.FC<
  EmailVerificationBannerProps
> = ({ onDismiss, showDismiss = true }) => {
  const { appUser, sendEmailVerification } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleResendEmail = async () => {
    if (!appUser) return

    try {
      setIsResending(true)
      setResendError(null)

      // Send verification email
      await sendEmailVerification()

      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000) // Hide success message after 5 seconds
    } catch (error: any) {
      setResendError(
        error.message || 'Failed to send verification email. Please try again.'
      )
    } finally {
      setIsResending(false)
    }
  }

  if (!appUser || appUser.isEmailVerified) {
    return null
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Email Verification Required
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            Please verify your email address ({appUser.email}) to continue.
            Check your inbox for the verification email.
          </p>

          {resendError && (
            <p className="mt-2 text-sm text-red-600">{resendError}</p>
          )}

          {resendSuccess && (
            <p className="mt-2 text-sm text-green-600">
              Verification email sent successfully! Check your inbox.
            </p>
          )}

          <div className="mt-3 flex space-x-3">
            <Button
              variant="outline"
              size="small"
              onClick={handleResendEmail}
              disabled={isResending}
            >
              {isResending ? 'Gönderiliyor...' : 'Tekrar Gönder'}
            </Button>{' '}
            <Button
              type="button"
              onClick={() => window.location.reload()}
              variant="outline"
              size="small"
            >
              I've Verified
            </Button>
          </div>
        </div>

        {showDismiss && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailVerificationBanner
