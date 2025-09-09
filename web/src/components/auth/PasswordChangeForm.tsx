/**
 * Password Change Form Component
 * Handles changing user's password with current password verification
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa'
import { MdSecurity } from 'react-icons/md'

import { Button, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import {
  passwordChangeSchema,
  type PasswordChangeFormData,
} from '@/lib/validations/auth'
import { authService } from '@/services/auth/AuthService'
import { getAuthErrorMessage } from '@/shared-generated'

interface PasswordChangeFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function PasswordChangeForm({
  onSuccess,
  onCancel,
}: PasswordChangeFormProps) {
  const { isLoading } = useAuth()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPasswordChanged, setIsPasswordChanged] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    reset,
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordChangeFormData) => {
    try {
      clearErrors()
      // Map the form data to the expected interface
      const changePasswordData = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }
      const result = await authService.changePassword(changePasswordData)

      if (result.success) {
        setIsPasswordChanged(true)
        reset()
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      } else {
        // Handle specific error cases using centralized error messages
        const errorCode = result.error || ''

        if (
          errorCode.includes('wrong-password') ||
          errorCode.includes('invalid-credential')
        ) {
          setError('currentPassword', {
            message: getAuthErrorMessage('auth/wrong-password', 'tr'),
          })
        } else if (errorCode.includes('weak-password')) {
          setError('newPassword', {
            message: getAuthErrorMessage('auth/weak-password', 'tr'),
          })
        } else {
          setError('root', {
            message: getAuthErrorMessage(errorCode, 'tr'),
          })
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

  const isFormLoading = isSubmitting || isLoading

  if (isPasswordChanged) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          {/* Success State */}
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <FaCheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Şifre Değiştirildi
            </h2>

            <p className="text-gray-600 mb-6">
              Şifreniz başarıyla güncellendi. Kısa süre içinde
              yönlendirileceksiniz.
            </p>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">
                  <strong>Güvenlik ipucu:</strong> Giriş yaptığınız diğer
                  cihazlarda da şifrenizi güncellemeyi unutmayın.
                </p>
              </div>

              <Button variant="outline" onClick={onSuccess} className="w-full">
                Devam Et
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
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <MdSecurity className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Şifreyi Değiştir</h2>
          <p className="text-gray-600 mt-2">
            Hesap güvenliğiniz için şifrenizi güncelleyin
          </p>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Root Error */}
          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </div>
          )}

          {/* Current Password Field */}
          <Input
            type={showCurrentPassword ? 'text' : 'password'}
            label="Mevcut Şifre"
            placeholder="Mevcut şifrenizi girin"
            rightElement={
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            }
            error={errors.currentPassword?.message}
            disabled={isFormLoading}
            autoFocus
            {...register('currentPassword')}
          />

          {/* New Password Field */}
          <Input
            type={showNewPassword ? 'text' : 'password'}
            label="Yeni Şifre"
            placeholder="Yeni şifrenizi girin"
            rightElement={
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            }
            error={errors.newPassword?.message}
            disabled={isFormLoading}
            {...register('newPassword')}
          />

          {/* Confirm New Password Field */}
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            label="Yeni Şifre Tekrar"
            placeholder="Yeni şifrenizi tekrar girin"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            }
            error={errors.confirmPassword?.message}
            disabled={isFormLoading}
            {...register('confirmPassword')}
          />

          {/* Password Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Şifre Gereksinimleri:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• En az 8 karakter uzunluğunda</li>
              <li>• En az bir büyük harf</li>
              <li>• En az bir küçük harf</li>
              <li>• En az bir rakam</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isFormLoading}
              className="flex-1"
            >
              İptal
            </Button>

            <Button
              type="submit"
              disabled={isFormLoading || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </Button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600">
            <strong>Güvenlik Notu:</strong> Şifrenizi değiştirdikten sonra diğer
            cihazlarda tekrar giriş yapmanız gerekebilir.
          </p>
        </div>
      </div>
    </div>
  )
}
