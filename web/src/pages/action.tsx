'use client'

import {
  EmailVerificationHandler,
  PasswordResetHandler,
} from '@/components/auth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { UserService } from '@/services/auth/UserService'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const ActionHandler = () => {
  const router = useRouter()
  const { appUser, isLoading: loading } = useAuth()
  const { mode, oobCode } = router.query
  const [error, setError] = useState('')

  const onEmailVerificationSuccess = async () => {
    // If user is logged in, check if they need to complete setup
    if (appUser) {
      const userService = new UserService()
      const exists = await userService.checkExists(appUser.id)
      if (exists) {
        router.replace('/setup')
      }
    }
    // If user is not logged in, they will see the success message with a link to login
  }

  useEffect(() => {
    if (!router.isReady) return

    // Validate mode parameter
    if (!['verifyEmail', 'resetPassword'].includes(mode as string)) {
      setError('Desteklenmeyen işlem.')
      return
    }

    // Validate oobCode parameter
    if (typeof oobCode !== 'string' || !oobCode) {
      setError('Geçersiz doğrulama kodu.')
      return
    }

    // Email verification doesn't require user to be logged in
    // The verification code itself is sufficient
  }, [mode, oobCode, router.isReady])

  const renderContent = () => {
    // Show error if validation failed
    if (error) {
      return (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            İşlem Başarısız
          </h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-block bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
          >
            Giriş Sayfasına Dön
          </Link>
        </div>
      )
    }

    // Handle email verification
    if (mode === 'verifyEmail' && typeof oobCode === 'string') {
      return (
        <EmailVerificationHandler
          oobCode={oobCode}
          currentUser={appUser as any}
          onSuccess={onEmailVerificationSuccess}
        />
      )
    }

    // Handle password reset
    if (mode === 'resetPassword' && typeof oobCode === 'string') {
      return <PasswordResetHandler oobCode={oobCode} />
    }

    return null
  }

  // Show loading for email verification (needs user context)
  if (!router.isReady || (loading && mode === 'resetPassword')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg text-gray-700">Lütfen bekleyin...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        {renderContent()}
      </div>
    </div>
  )
}

export default ActionHandler
