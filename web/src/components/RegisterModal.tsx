'use client'

import { useAuth } from '@/contexts/AuthContext'
import {
  individualRegisterSchema,
  type IndividualRegisterFormData,
} from '@/lib/validations/auth'
import {
  AccountType,
  getAuthErrorMessage,
  IRegisterData,
} from '@/shared-generated'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from './ui/Button'
import { Checkbox } from './ui/Checkbox'
import { Input } from './ui/Input'
import { LoadingSpinner } from './ui/LoadingSpinner'
import Modal from './ui/Modal'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin?: () => void
  defaultAccountType?: 'individual' | 'business'
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  defaultAccountType = 'individual',
}) => {
  const [accountType, setAccountType] = useState<'individual' | 'business'>(
    defaultAccountType
  )

  const handleClose = () => {
    onClose()
    setAccountType(defaultAccountType)
  }

  const handleSwitchToLogin = () => {
    onClose()
    if (onSwitchToLogin) {
      onSwitchToLogin()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth={accountType === 'business' ? 'lg' : 'md'}
    >
      <div className="space-y-4">
        {/* Account Type Selector */}
        <div className="flex justify-center space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setAccountType('individual')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              accountType === 'individual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Bireysel Hesap
          </button>
          <button
            onClick={() => setAccountType('business')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              accountType === 'business'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            İşletme Hesabı
          </button>
        </div>

        {/* Form Content - Reduced max height for better fit */}
        <div className="max-h-[60vh] overflow-y-auto">
          {accountType === 'individual' ? (
            <IndividualRegisterFormModal
              onClose={handleClose}
              onSwitchToLogin={handleSwitchToLogin}
            />
          ) : (
            <BusinessRegisterFormModal
              onClose={handleClose}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}

// Simplified Individual Register Form for Modal
const IndividualRegisterFormModal: React.FC<{
  onClose: () => void
  onSwitchToLogin: () => void
}> = ({ onClose, onSwitchToLogin }) => {
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
    setError,
    reset,
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
      const registrationData: IRegisterData = {
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
        onClose()
        reset()
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
      const result = await loginWithGoogle()
      if (result.success) {
        onClose()
        reset()
        router.push('/setup')
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

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Bireysel Hesap Oluştur
        </h2>
        <p className="text-sm text-gray-600">Platformumuza katılın</p>
      </div>

      {/* Google Registration Button */}
      <Button
        type="button"
        onClick={handleGoogleRegister}
        disabled={isGoogleLoading || isLoading}
        variant="outline"
        className="w-full flex items-center justify-center space-x-2"
      >
        {isGoogleLoading ? (
          <LoadingSpinner size="small" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span className="px-2 bg-white text-gray-500">Veya e-posta ile</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Display general errors */}
        {(error || errors.root) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2">
            <p className="text-sm text-red-600">
              {error || errors.root?.message}
            </p>
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ad"
            {...register('firstName')}
            error={errors.firstName?.message}
            placeholder="Adınız"
          />
          <Input
            label="Soyad"
            {...register('lastName')}
            error={errors.lastName?.message}
            placeholder="Soyadınız"
          />
        </div>

        {/* Email */}
        <Input
          label="E-posta"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="E-posta adresiniz"
        />

        {/* Phone Number */}
        <Input
          label="Telefon"
          type="tel"
          {...register('phoneNumber')}
          error={errors.phoneNumber?.message}
          placeholder="Telefon numaranız"
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
                  className="w-4 h-4"
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
                  className="w-4 h-4"
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
                  className="w-4 h-4"
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
                  className="w-4 h-4"
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
          <label className="text-xs text-gray-600">
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Hizmet Şartları
            </Link>{' '}
            ve{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Gizlilik Politikası
            </Link>
            'nı kabul ediyorum
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-xs text-red-600">{errors.acceptTerms.message}</p>
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
              <span>Oluşturuluyor...</span>
            </div>
          ) : (
            'Hesap Oluştur'
          )}
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Zaten hesabınız var mı?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Giriş yap
          </button>
        </p>
      </div>
    </div>
  )
}

// Simplified Business Register Form for Modal
const BusinessRegisterFormModal: React.FC<{
  onClose: () => void
  onSwitchToLogin: () => void
}> = ({ onClose, onSwitchToLogin }) => {
  const router = useRouter()

  const handleGoToFullForm = () => {
    onClose()
    router.push('/register?type=business')
  }

  return (
    <div className="space-y-6 text-center py-4">
      <div>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0v-2a2 2 0 012-2h2m0 0V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h2"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          İşletme Hesabı Oluştur
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          İşletme hesabı oluşturmak için detaylı bilgilere ihtiyacımız var.
          Lütfen tam formu doldurmak için ayrı sayfaya geçin.
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={handleGoToFullForm} className="w-full">
          İşletme Kayıt Formuna Git
        </Button>

        <Button variant="outline" onClick={onSwitchToLogin} className="w-full">
          Zaten hesabım var, giriş yap
        </Button>
      </div>

      <div className="text-xs text-gray-500 border-t pt-3">
        <p className="mb-2">İşletme hesabı özellikleri:</p>
        <ul className="space-y-1 text-left max-w-sm mx-auto">
          <li>• Ürün ve hizmet yönetimi</li>
          <li>• Müşteri takibi</li>
          <li>• Gelişmiş analitik</li>
          <li>• Özel destek</li>
        </ul>
      </div>
    </div>
  )
}

export default RegisterModal
