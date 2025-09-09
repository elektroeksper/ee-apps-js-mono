'use client'

/**
 * Login Form Component
 * Handles user authentication with email/password and Google OAuth
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa'

import { Button, Checkbox, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { getAuthErrorMessage } from '@/shared-generated'

interface LoginFormProps {
  accountType?: 'individual' | 'business'
  onSuccess?: () => void
  onRegisterClick?: () => void
  onForgotPasswordClick?: () => void
}

export function LoginForm({
  accountType = 'individual',
  onSuccess,
  onRegisterClick,
  onForgotPasswordClick,
}: LoginFormProps) {
  const { login, loginWithGoogle, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearErrors()
      const result = await login(data)

      if (result.success) {
        onSuccess?.()
      } else {
        // Get localized error message
        const errorMessage = getAuthErrorMessage(result.error || '', 'tr')

        // Handle specific error cases for better UX
        if (result.error?.includes('user-not-found')) {
          setError('email', {
            message: getAuthErrorMessage('auth/user-not-found', 'tr'),
          })
        } else if (
          result.error?.includes('wrong-password') ||
          result.error?.includes('invalid-credential')
        ) {
          setError('password', {
            message: getAuthErrorMessage('auth/wrong-password', 'tr'),
          })
        } else {
          setError('root', { message: errorMessage })
        }
      }
    } catch (error: any) {
      setError('root', {
        message: getAuthErrorMessage(
          error.code || error.message || 'default',
          'tr'
        ),
      })
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true)
      clearErrors()

      const result = await loginWithGoogle()

      if (result.success) {
        onSuccess?.()
      } else {
        setError('root', {
          message: getAuthErrorMessage(result.error || 'default', 'tr'),
        })
      }
    } catch (error: any) {
      setError('root', {
        message: getAuthErrorMessage(
          error.code || error.message || 'default',
          'tr'
        ),
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const isFormLoading = isSubmitting || isLoading

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Tekrar Hoş Geldiniz
          </h2>
          <p className="text-gray-600 mt-2">Hesabınıza giriş yapın</p>
        </div>

        {/* Google Login Button - Only for Individual accounts */}
        {accountType === 'individual' && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isFormLoading || isGoogleLoading}
              className="mb-6 w-full"
            >
              {!isGoogleLoading && <FaGoogle className="text-red-500 mr-2" />}
              {isGoogleLoading ? 'Giriş yapılıyor...' : 'Google ile Devam Et'}
            </Button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Veya e-posta ile devam et
                </span>
              </div>
            </div>
          </>
        )}

        {/* Login Form */}
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
            {...register('email')}
          />

          {/* Password Field */}
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Şifre"
            placeholder="Şifrenizi girin"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            }
            error={errors.password?.message}
            disabled={isFormLoading}
            {...register('password')}
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <Checkbox
              label="Beni hatırla"
              disabled={isFormLoading}
              {...register('rememberMe')}
            />

            <button
              type="button"
              onClick={onForgotPasswordClick}
              className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              disabled={isFormLoading}
            >
              Şifrenizi mi unuttunuz?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isFormLoading || isSubmitting}
            className="mt-6 w-full"
          >
            {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Hesabınız yok mu?{' '}
            <button
              type="button"
              onClick={onRegisterClick}
              className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
              disabled={isFormLoading}
            >
              Kayıt ol
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
