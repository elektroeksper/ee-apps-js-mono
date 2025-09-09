/**
 * Password Reset Form Component
 * Handles password reset email requests
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MdArrowBack, MdCheckCircle } from 'react-icons/md'

import { Button, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import {
  passwordResetSchema,
  type PasswordResetFormData,
} from '@/lib/validations/auth'
import { authService } from '@/services/auth/AuthService'
import { getAuthErrorMessage } from '@/shared-generated'

interface PasswordResetFormProps {
  onSuccess?: () => void
  onBackToLogin?: () => void
}

export function PasswordResetForm({
  onSuccess,
  onBackToLogin,
}: PasswordResetFormProps) {
  const { isLoading } = useAuth() // only using global loading if needed
  // use singleton authService
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [sentToEmail, setSentToEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: PasswordResetFormData) => {
    try {
      clearErrors()
      const result = await authService.resetPassword(data.email)
      if (!result.success) {
        throw new Error(
          result.error || 'Şifre sıfırlama e-postası gönderilemedi'
        )
      }
      setIsEmailSent(true)
      setSentToEmail(data.email)
      onSuccess?.()
    } catch (error: any) {
      const errorCode = error?.code || error?.message || ''

      if (errorCode.includes('user-not-found')) {
        setError('email', {
          message: getAuthErrorMessage('auth/user-not-found', 'tr'),
        })
      } else {
        setError('root', {
          message: getAuthErrorMessage(errorCode, 'tr'),
        })
      }
    }
  }

  const handleResendEmail = async () => {
    if (!sentToEmail) return
    try {
      await authService.resetPassword(sentToEmail)
    } catch (e) {
      // swallow; user can try again later
    }
  }

  const isFormLoading = isSubmitting || isLoading

  if (isEmailSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          {/* Success State */}
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <MdCheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              E-postanızı Kontrol Edin
            </h2>
            <p className="text-gray-600 mb-6">
              Şifre sıfırlama bağlantısını{' '}
              <span className="font-medium text-gray-900">{sentToEmail}</span>{' '}
              adresine gönderdik
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Sonraki adımlar:</strong>
                  <br />
                  1. E-posta gelen kutunuzu kontrol edin (spam klasörünü de
                  kontrol edin)
                  <br />
                  2. E-postadaki bağlantıya tıklayın
                  <br />
                  3. Yeni bir şifre oluşturun
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={isFormLoading}
                className="w-full"
              >
                E-postayı Tekrar Gönder
              </Button>
              <Button
                variant="ghost"
                onClick={onBackToLogin}
                className="w-full"
              >
                <MdArrowBack className="mr-2" />
                Giriş Sayfasına Dön
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Şifre Sıfırla</h2>
          <p className="text-gray-600 mt-2">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
          </p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Root Error */}
          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </div>
          )}

          {/* Email Field */}
          <Input
            type="email"
            label="E-posta Adresi"
            placeholder="E-posta adresinizi girin"
            error={errors.email?.message}
            disabled={isFormLoading}
            autoFocus
            {...register('email')}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isFormLoading || isSubmitting}
            className="mt-6 w-full"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-6">
          <Button
            variant="ghost"
            onClick={onBackToLogin}
            disabled={isFormLoading}
            className="w-full"
          >
            <MdArrowBack className="mr-2" />
            Giriş Sayfasına Dön
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Sorun mu yaşıyorsunuz?{' '}
            <a
              href="/support"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Destek ekibimizle
            </a>{' '}
            iletişime geçin
          </p>
        </div>
      </div>
    </div>
  )
}
