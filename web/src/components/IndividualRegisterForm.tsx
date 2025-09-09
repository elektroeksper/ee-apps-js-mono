'use client'

import { useAuth } from '@/contexts/AuthContext'
import {
  individualRegisterSchema,
  type IndividualRegisterFormData,
} from '@/lib/validations/auth'
import { AccountType, getAuthErrorMessage } from '@/shared-generated'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from './ui/Button'
import { Checkbox } from './ui/Checkbox'
import { Input } from './ui/Input'
import { LoadingSpinner } from './ui/LoadingSpinner'

export const IndividualRegisterForm: React.FC = () => {
  const {
    register: registerUser,
    loginWithGoogle,
    isLoading,
    error,
    clearError,
  } = useAuth()
  const router = useRouter()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
  } = useForm<IndividualRegisterFormData>({
    resolver: zodResolver(individualRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const onSubmit = async (data: IndividualRegisterFormData) => {
    try {
      clearError()

      // Transform data to match the registration interface
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        accountType: AccountType.INDIVIDUAL,
        phone: data.phoneNumber,
        acceptTerms: data.acceptTerms,
      }

      const result = await registerUser(registrationData)
      if (result.success) {
        // All users need to verify email first, then complete setup
        router.push('/verify-email')
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

  const handleGoogleRegister = async () => {
    try {
      setIsGoogleLoading(true)
      clearError()
      await loginWithGoogle()
      router.push('/setup')
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

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bireysel Hesap Oluştur
        </h1>
        <p className="text-sm text-gray-600">Platformumuza katılın</p>
      </div>

      {/* Google Registration Button */}
      <Button
        type="button"
        onClick={handleGoogleRegister}
        disabled={isGoogleLoading || isLoading}
        variant="outline"
        className="w-full mb-4 flex items-center justify-center space-x-2"
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Display general errors */}
        {(error || errors.root) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">
              {error || errors.root?.message}
            </p>
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ad"
            {...register('firstName')}
            error={errors.firstName?.message}
            placeholder="Adınızı girin"
          />
          <Input
            label="Soyad"
            {...register('lastName')}
            error={errors.lastName?.message}
            placeholder="Soyadınızı girin"
          />
        </div>

        {/* Email */}
        <Input
          label="E-posta Adresi"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="E-posta adresinizi girin"
        />

        {/* Phone Number */}
        <Input
          label="Telefon Numarası"
          type="tel"
          {...register('phoneNumber')}
          error={errors.phoneNumber?.message}
          placeholder="Telefon numaranızı girin"
        />

        {/* Password */}
        <Input
          label="Şifre"
          type={showPassword ? 'text' : 'password'}
          {...register('password')}
          error={errors.password?.message}
          placeholder="Şifre oluşturun"
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

        {/* Confirm Password */}
        <Input
          label="Şifre Tekrar"
          type={showConfirmPassword ? 'text' : 'password'}
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          placeholder="Şifrenizi tekrar girin"
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
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

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-2">
          <Checkbox
            {...register('acceptTerms')}
            error={errors.acceptTerms?.message}
          />
          <label className="text-sm text-gray-600">
            <Link
              href="/terms"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Hizmet Şartları
            </Link>{' '}
            ve{' '}
            <Link
              href="/privacy"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Gizlilik Politikası
            </Link>
            'nı kabul ediyorum
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600 mt-1">
            {errors.acceptTerms.message}
          </p>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full"
        >
          {isSubmitting || isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="small" />
              <span>Hesap Oluşturuluyor...</span>
            </div>
          ) : (
            'Hesap Oluştur'
          )}
        </Button>
      </form>

      {/* Login Link */}
      <p className="mt-6 text-center text-sm text-gray-600">
        Zaten hesabınız var mı?{' '}
        <Link
          href="/login?type=individual"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Giriş yap
        </Link>
      </p>
    </div>
  )
}

export default IndividualRegisterForm
