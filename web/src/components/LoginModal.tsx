'use client'

import { useAuth } from '@/contexts/AuthContext'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { getAuthErrorMessage } from '@/shared-generated'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { LoadingSpinner } from './ui/LoadingSpinner'
import Modal from './ui/Modal'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister?: () => void
  accountType?: 'individual' | 'business'
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  accountType = 'individual',
}) => {
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth()
  const router = useRouter()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      const result = await login({ email: data.email, password: data.password })
      if (result.success) {
        onClose()
        reset()
        router.push('/home')
      } else {
        setError('root', {
          type: 'manual',
          message: getAuthErrorMessage(result.error || 'default', 'tr'),
        })
      }
    } catch (err: any) {
      setError('root', {
        type: 'manual',
        message: getAuthErrorMessage(
          err.code || err.message || 'default',
          'tr'
        ),
      })
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true)
      clearError()
      const result = await loginWithGoogle()
      if (result.success) {
        onClose()
        reset()
        router.push('/home')
      } else {
        setError('root', {
          type: 'manual',
          message: getAuthErrorMessage(result.error || 'default', 'tr'),
        })
      }
    } catch (err: any) {
      setError('root', {
        type: 'manual',
        message: getAuthErrorMessage(
          err.code || err.message || 'default',
          'tr'
        ),
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleSwitchToRegister = () => {
    onClose()
    if (onSwitchToRegister) {
      onSwitchToRegister()
    }
  }

  const handleClose = () => {
    onClose()
    reset()
    clearError()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Giriş Yap"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Display general errors */}
        {(error || errors.root) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">
              {error || errors.root?.message}
            </p>
          </div>
        )}

        {/* Google Sign In Button */}
        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          variant="outline"
          className="w-full flex items-center justify-center space-x-2"
        >
          {isGoogleLoading ? (
            <LoadingSpinner size="small" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>Google ile Devam Et</span>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Veya e-posta ile devam et
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="E-posta Adresi"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="E-posta adresinizi girin"
            autoComplete="email"
          />

          <Input
            label="Şifre"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            error={errors.password?.message}
            placeholder="Şifrenizi girin"
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                )}
              </button>
            }
          />

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={handleClose}
              >
                Şifremi unuttum
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full"
          >
            {isSubmitting || isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="small" />
                <span>Giriş yapılıyor...</span>
              </div>
            ) : (
              'Giriş Yap'
            )}
          </Button>
        </form>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Hesabınız yok mu?{' '}
            {onSwitchToRegister ? (
              <button
                onClick={handleSwitchToRegister}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Kayıt ol
              </button>
            ) : (
              <Link
                href={`/register?type=${accountType}`}
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={handleClose}
              >
                Kayıt ol
              </Link>
            )}
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default LoginModal
