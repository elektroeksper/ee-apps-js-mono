/**
 * Email Verification Banner Component
 * Prompts unverified users to verify their email addresses
 */

import { useState } from 'react'
import { MdCheckCircle, MdClose, MdEmail, MdWarning } from 'react-icons/md'

import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

interface EmailVerificationBannerProps {
  className?: string
  onDismiss?: () => void
  dismissible?: boolean
}

export function EmailVerificationBanner({
  className = '',
  onDismiss,
  dismissible = true,
}: EmailVerificationBannerProps) {
  const { appUser, sendEmailVerification, isLoading } = useAuth()
  const [isHidden, setIsHidden] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null)

  // Don't show banner if user is verified, not logged in, or hidden
  if (!appUser || appUser.isEmailVerified || isHidden) {
    return null
  }

  const handleDismiss = () => {
    setIsHidden(true)
    onDismiss?.()
  }

  const handleResendEmail = async () => {
    try {
      setIsSending(true)
      await sendEmailVerification()
      setIsEmailSent(true)
      setLastSentTime(new Date())
    } catch (error) {
      console.error('Failed to send verification email:', error)
    } finally {
      setIsSending(false)
    }
  }

  const canResend = () => {
    if (!lastSentTime) return true

    // Allow resend after 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    return lastSentTime < oneMinuteAgo
  }

  const getTimeUntilCanResend = () => {
    if (!lastSentTime) return 0

    const oneMinuteFromSent = new Date(lastSentTime.getTime() + 60 * 1000)
    const now = new Date()

    return Math.max(
      0,
      Math.ceil((oneMinuteFromSent.getTime() - now.getTime()) / 1000)
    )
  }

  const timeRemaining = getTimeUntilCanResend()

  if (isEmailSent) {
    return (
      <div
        className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <MdCheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">
                Verification email sent!
              </p>
              <p className="text-sm text-green-700">
                Check your inbox and click the verification link to activate
                your account.
              </p>
            </div>
          </div>

          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="text-green-400 hover:text-green-600 focus:outline-none focus:text-green-600"
            >
              <MdClose className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <MdWarning className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              Please verify your email address
            </p>
            <p className="text-sm text-amber-700 mt-1">
              We sent a verification email to{' '}
              <span className="font-medium">{appUser.email}</span>. Click the
              link in the email to verify your account.
            </p>

            <div className="flex items-center space-x-4 mt-3">
              <Button
                variant="outline"
                size="small"
                onClick={handleResendEmail}
                disabled={isLoading || !canResend()}
              >
                {isSending && <MdEmail className="mr-2 h-4 w-4" />}
                {timeRemaining > 0
                  ? `Resend in ${timeRemaining}s`
                  : isSending
                    ? 'Sending...'
                    : 'Resend Email'}
              </Button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-sm text-amber-600 hover:text-amber-800 focus:outline-none focus:underline"
              >
                I've verified my email
              </button>
            </div>
          </div>
        </div>

        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="text-amber-400 hover:text-amber-600 focus:outline-none focus:text-amber-600"
          >
            <MdClose className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
