'use client'

import { auth } from '@/config/firebase'
import { getAuthErrorMessage } from '@/shared-generated'
import { applyActionCode } from 'firebase/auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface EmailVerificationHandlerProps {
  oobCode: string
  currentUser: any
  onSuccess?: () => void
}

const EmailVerificationHandler = ({
  oobCode,
  currentUser,
  onSuccess,
}: EmailVerificationHandlerProps) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  )
  const [error, setError] = useState('')

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        setStatus('verifying')
        await applyActionCode(auth, oobCode)

        // After successful email verification, we need to update the user document in Firestore
        // Get the current Firebase user after verification
        const user = auth.currentUser
        if (user) {
          // Force refresh the user to get updated emailVerified status
          await user.reload()

          // Update the Firestore user document
          if (user.emailVerified) {
            try {
              const { doc, updateDoc } = await import('firebase/firestore')
              const { db } = await import('@/config/firebase')

              await updateDoc(doc(db, 'users', user.uid), {
                isEmailVerified: true,
                updatedAt: new Date(),
              })
              console.log(
                '✅ Updated user document with email verification status'
              )
            } catch (updateError) {
              console.error('⚠️ Failed to update user document:', updateError)
              // Don't fail the whole process if Firestore update fails
            }
          }
        }

        setStatus('success')
        onSuccess?.()
      } catch (err: any) {
        setStatus('error')
        const errorMessage = getAuthErrorMessage(err.code || err, 'tr')
        setError(errorMessage)
      }
    }

    if (oobCode) {
      handleEmailVerification()
    } else {
      setStatus('error')
      setError('Geçersiz doğrulama kodu.')
    }
  }, [oobCode, onSuccess])

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="flex flex-col items-center">
            <LoadingSpinner />
            <p className="mt-4 text-lg text-gray-700">
              E-postanız doğrulanıyor...
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              E-posta Başarıyla Doğrulandı!
            </h1>
            <p className="text-gray-700 mb-6">
              Hesabınız artık aktif. Giriş yaparak panelinize erişebilirsiniz.
            </p>
            <Link
              href="/login"
              className="inline-block bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
            >
              Giriş Yap
            </Link>
          </div>
        )

      case 'error':
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
              E-posta Doğrulama Başarısız
            </h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <div className="space-y-3">
              <Link
                href="/verify-email"
                className="block bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
              >
                Tekrar Dene
              </Link>
              <Link
                href="/login"
                className="block text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Giriş Sayfasına Dön
              </Link>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return <>{renderContent()}</>
}

export default EmailVerificationHandler
