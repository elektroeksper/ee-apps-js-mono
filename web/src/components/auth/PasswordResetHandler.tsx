'use client'

import { auth } from '@/config/firebase'
import {
  passwordResetCompletionSchema,
  type PasswordResetCompletionFormData,
} from '@/lib/validations/auth'
import { getAuthErrorMessage } from '@/shared-generated'
import { zodResolver } from '@hookform/resolvers/zod'
import { confirmPasswordReset } from 'firebase/auth'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface PasswordResetHandlerProps {
  oobCode: string
}

const PasswordResetHandler = ({ oobCode }: PasswordResetHandlerProps) => {
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<PasswordResetCompletionFormData>({
    resolver: zodResolver(passwordResetCompletionSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordResetCompletionFormData) => {
    try {
      await confirmPasswordReset(auth, oobCode, data.password)
      setStatus('success')
      setError('')
    } catch (err: any) {
      setStatus('error')
      const errorMessage = getAuthErrorMessage(err.code || err, 'tr')
      setError(errorMessage)
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'form':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
              <svg
                className="h-8 w-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-indigo-600 mb-4">
              Şifre Sıfırlama
            </h1>
            <p className="text-gray-700 mb-6">
              Lütfen yeni şifrenizi belirleyin.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Yeni Şifre"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                placeholder="Yeni şifrenizi girin"
                autoComplete="new-password"
              />

              <Input
                label="Şifre Tekrar"
                type="password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                placeholder="Şifrenizi tekrar girin"
                autoComplete="new-password"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="small" />
                    <span>İşleniyor...</span>
                  </div>
                ) : (
                  'Şifremi Sıfırla'
                )}
              </Button>
            </form>
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
              Şifre Başarıyla Sıfırlandı!
            </h1>
            <p className="text-gray-700 mb-6">
              Şifreniz başarıyla güncellenmiştir. Yeni şifrenizle giriş
              yapabilirsiniz.
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
              Şifre Sıfırlama Başarısız
            </h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setStatus('form')
                  setError('')
                }}
                className="block w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
              >
                Tekrar Dene
              </button>
              <Link
                href="/forgot-password"
                className="block text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Yeni Sıfırlama Bağlantısı İste
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

export default PasswordResetHandler
