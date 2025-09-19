/**
 * Pending Approval Component
 * Displayed to business users while their account is awaiting admin approval
 */

import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { AccountType, IBusiness } from '@/shared-generated'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiClock, FiMail } from 'react-icons/fi'

const PendingApproval: React.FC = () => {
  const { appUser, logout } = useAuth()
  const [businessData, setBusinessData] = useState<IBusiness | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch business data to show verification status
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!appUser?.businessInfo?.businessId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/business/${appUser.businessInfo.businessId}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        )

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setBusinessData(result.data)
          }
        }
      } catch (error) {
        console.error('Error fetching business data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (appUser && appUser.accountType === AccountType.BUSINESS) {
      fetchBusinessData()
    } else {
      setLoading(false)
    }
  }, [appUser])

  const handleLogout = async () => {
    await logout()
  }

  // Check verification status
  const hasDocuments =
    businessData?.documents && businessData.documents.length > 0
  const hasBusinessPhone =
    businessData?.phone && businessData.phone.trim() !== ''
  const documentsCount = businessData?.documents?.length || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">
              Doğrulama durumu kontrol ediliyor...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <FiClock className="h-8 w-8 text-yellow-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Hesabınız Onay Sürecinde
          </h1>

          {/* Message */}
          <div className="text-gray-600 mb-8 space-y-4">
            <p>
              Merhaba <strong>{appUser?.firstName}</strong>,
            </p>
            <p>
              İşletme hesabınız başarıyla oluşturuldu! Bilgileriniz ve
              belgeleriniz yönetici ekibimiz tarafından incelenmektedir.
            </p>
            <p className="text-sm">
              Onay süreci genellikle 1-2 iş günü sürmektedir. İnceleme
              tamamlandığında bir e-posta bildirimi alacaksınız.
            </p>
          </div>

          {/* Status Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                  <FiCheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-green-600 font-medium">
                  Hesap Oluşturuldu
                </span>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>

              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100">
                  <FiClock className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-yellow-600 font-medium">İnceleme</span>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>

              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-gray-400 font-medium">Onay</span>
              </div>
            </div>
          </div>

          {/* Information Box - Show Verification Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              Doğrulama Durumu:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">Yüklenen Belgeler:</span>
                <div className="flex items-center space-x-2">
                  {hasDocuments ? (
                    <FiCheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <FiAlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={
                      hasDocuments
                        ? 'text-green-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {hasDocuments
                      ? `${documentsCount} belge yüklendi`
                      : 'Belge yüklenmedi'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-800">İşletme Telefonu:</span>
                <div className="flex items-center space-x-2">
                  {hasBusinessPhone ? (
                    <FiCheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <FiAlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                  <span
                    className={
                      hasBusinessPhone
                        ? 'text-green-600 font-medium'
                        : 'text-orange-600 font-medium'
                    }
                  >
                    {hasBusinessPhone ? 'Doğrulandı' : 'Opsiyonel'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/home"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Ana Sayfaya Git
            </Link>

            <Link
              href="/setup"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Kurulum Sayfasına Git
            </Link>

            <Button variant="outline" onClick={handleLogout} className="w-full">
              Çıkış Yap
            </Button>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Sorularınız için:{' '}
              <a
                href="mailto:destek@elektroexpert.com"
                className="text-blue-600 hover:text-blue-800"
              >
                destek@elektroexpert.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingApproval
