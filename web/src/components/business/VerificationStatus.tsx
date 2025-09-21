/**
 * Verification Status Component
 * Displays business verification status, handles rejection cases, and shows verification history
 */

import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import {
  AccountType,
  BusinessVerificationStatus,
  IBusiness,
} from '@/shared-generated'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiMail,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi'

const VerificationStatus: React.FC = () => {
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
        console.log(
          '🔍 VerificationStatus: Fetching business data for ID:',
          appUser.businessInfo.businessId
        )
        const response = await fetch(
          `/api/business/${appUser.businessInfo.businessId}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        )

        console.log('🔍 VerificationStatus: Response status:', response.status)
        if (response.ok) {
          const result = await response.json()
          console.log('🔍 VerificationStatus: API result:', result)
          if (result.success && result.data) {
            setBusinessData(result.data)
            console.log('🔍 VerificationStatus: Business data set:', {
              documentsCount: result.data.documents?.length || 0,
              verificationStatus: result.data.verification?.status,
            })
          }
        } else {
          console.error(
            '🔍 VerificationStatus: API call failed with status:',
            response.status
          )
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

  // Get verification status and history
  const verificationStatus =
    businessData?.verification?.status || BusinessVerificationStatus.UNVERIFIED
  const verificationHistory = businessData?.verification?.history || []
  const hasDocuments =
    businessData?.documents && businessData.documents.length > 0
  const hasBusinessPhone =
    businessData?.phone && businessData.phone.trim() !== ''
  const documentsCount = businessData?.documents?.length || 0

  // Get latest rejection reason if rejected
  const latestRejection = verificationHistory
    .slice()
    .reverse()
    .find(entry => entry.rejectedAt && entry.rejectionReason)

  // Determine display content based on status
  const getStatusInfo = () => {
    switch (verificationStatus) {
      case BusinessVerificationStatus.VERIFIED:
        return {
          title: 'Hesabınız Onaylandı',
          subtitle: 'İşletme hesabınız başarıyla doğrulandı ve aktif durumda',
          headerGradient: 'from-green-500 to-emerald-500',
          headerIcon: FiCheckCircle,
          timeInfo: 'Hesabınız artık tam erişimle kullanılabilir',
          timeStyle: 'bg-green-100 text-green-800',
        }
      case BusinessVerificationStatus.REJECTED:
        return {
          title: 'Hesabınız Reddedildi',
          subtitle: 'İşletme belgelerinizde eksiklik tespit edildi',
          headerGradient: 'from-red-500 to-rose-500',
          headerIcon: FiX,
          timeInfo: 'Eksiklikleri giderip yeniden başvurabilirsiniz',
          timeStyle: 'bg-red-100 text-red-800',
        }
      case BusinessVerificationStatus.PENDING:
      default:
        return {
          title: 'Hesabınız Onay Sürecinde',
          subtitle:
            'İşletme hesabınız başarıyla oluşturuldu! Bilgileriniz yönetici ekibimiz tarafından incelenmektedir',
          headerGradient: 'from-amber-500 to-orange-500',
          headerIcon: FiClock,
          timeInfo: 'Onay süreci genellikle 1-2 iş günü sürmektedir',
          timeStyle: 'bg-amber-100 text-amber-800',
        }
    }
  }

  const statusInfo = getStatusInfo()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center border border-white/20">
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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header - Dynamic based on status */}
          <div
            className={`bg-gradient-to-r ${statusInfo.headerGradient} px-8 py-12 text-center`}
          >
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <statusInfo.headerIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              {statusInfo.title}
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              {statusInfo.subtitle}
            </p>
          </div>

          <div className="p-8 lg:p-12">
            {/* Welcome Message */}
            <div className="text-center mb-12">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Merhaba{' '}
                  <span className="text-blue-600">{appUser?.firstName}</span>!
                  👋
                </h2>

                {/* Rejection Notice */}
                {verificationStatus === BusinessVerificationStatus.REJECTED &&
                  latestRejection && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <FiAlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <h3 className="font-semibold text-red-800 mb-2">
                            Red Sebebi:
                          </h3>
                          <p className="text-red-700">
                            {latestRejection.rejectionReason}
                          </p>
                          {latestRejection.rejectedAt && (
                            <p className="text-sm text-red-600 mt-2">
                              Red Tarihi:{' '}
                              {new Date(
                                latestRejection.rejectedAt as any
                              ).toLocaleDateString('tr-TR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Status-specific message */}
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  {verificationStatus === BusinessVerificationStatus.VERIFIED
                    ? 'İşletme hesabınız doğrulandı! Artık tüm özelliklerden yararlanabilirsiniz.'
                    : verificationStatus === BusinessVerificationStatus.REJECTED
                      ? 'Lütfen eksiklikleri giderip belgelerinizi yeniden yükleyin.'
                      : 'İşletme hesabınız başarıyla oluşturuldu! Bilgileriniz ve belgeleriniz yönetici ekibimiz tarafından incelenmektedir.'}
                </p>

                <div
                  className={`inline-flex items-center px-4 py-2 ${statusInfo.timeStyle} rounded-full text-sm font-medium`}
                >
                  <statusInfo.headerIcon className="w-4 h-4 mr-2" />
                  {statusInfo.timeInfo}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Progress Steps & History */}
              <div className="space-y-8">
                {/* Status Steps - Dynamic based on current status */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Süreç Durumu
                  </h3>

                  <div className="space-y-6">
                    {/* Step 1 - Always Completed */}
                    <div className="flex items-center">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mr-4">
                        <FiCheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-green-600">
                          Hesap Oluşturuldu
                        </h4>
                        <p className="text-sm text-gray-600">
                          İşletme bilgileriniz kaydedildi
                        </p>
                      </div>
                    </div>

                    <div className="ml-6 w-0.5 h-8 bg-gray-300"></div>

                    {/* Step 2 - Dynamic based on status */}
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center h-12 w-12 rounded-full mr-4 ${
                          verificationStatus ===
                          BusinessVerificationStatus.PENDING
                            ? 'bg-amber-100 animate-pulse'
                            : verificationStatus ===
                                BusinessVerificationStatus.VERIFIED
                              ? 'bg-green-100'
                              : 'bg-red-100'
                        }`}
                      >
                        {verificationStatus ===
                          BusinessVerificationStatus.PENDING && (
                          <FiClock className="h-6 w-6 text-amber-600" />
                        )}
                        {verificationStatus ===
                          BusinessVerificationStatus.VERIFIED && (
                          <FiCheckCircle className="h-6 w-6 text-green-600" />
                        )}
                        {verificationStatus ===
                          BusinessVerificationStatus.REJECTED && (
                          <FiX className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-semibold ${
                            verificationStatus ===
                            BusinessVerificationStatus.PENDING
                              ? 'text-amber-600'
                              : verificationStatus ===
                                  BusinessVerificationStatus.VERIFIED
                                ? 'text-green-600'
                                : 'text-red-600'
                          }`}
                        >
                          {verificationStatus ===
                            BusinessVerificationStatus.PENDING &&
                            'İnceleme Süreci'}
                          {verificationStatus ===
                            BusinessVerificationStatus.VERIFIED && 'Onaylandı'}
                          {verificationStatus ===
                            BusinessVerificationStatus.REJECTED && 'Reddedildi'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {verificationStatus ===
                            BusinessVerificationStatus.PENDING &&
                            'Belgeleriniz kontrol ediliyor'}
                          {verificationStatus ===
                            BusinessVerificationStatus.VERIFIED &&
                            'Belgeleriniz onaylandı'}
                          {verificationStatus ===
                            BusinessVerificationStatus.REJECTED &&
                            'Eksiklikler tespit edildi'}
                        </p>
                      </div>
                    </div>

                    <div className="ml-6 w-0.5 h-8 bg-gray-300"></div>

                    {/* Step 3 - Final status */}
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center h-12 w-12 rounded-full mr-4 ${
                          verificationStatus ===
                          BusinessVerificationStatus.VERIFIED
                            ? 'bg-green-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {verificationStatus ===
                        BusinessVerificationStatus.VERIFIED ? (
                          <FiCheckCircle className="h-6 w-6 text-green-600" />
                        ) : verificationStatus ===
                          BusinessVerificationStatus.REJECTED ? (
                          <FiRefreshCw className="h-6 w-6 text-gray-400" />
                        ) : (
                          <FiMail className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-semibold ${
                            verificationStatus ===
                            BusinessVerificationStatus.VERIFIED
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {verificationStatus ===
                          BusinessVerificationStatus.VERIFIED
                            ? 'Hesap Aktif'
                            : verificationStatus ===
                                BusinessVerificationStatus.REJECTED
                              ? 'Yeniden Başvuru'
                              : 'Onay Bildirimi'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {verificationStatus ===
                          BusinessVerificationStatus.VERIFIED
                            ? 'Tüm özellikler kullanılabilir'
                            : verificationStatus ===
                                BusinessVerificationStatus.REJECTED
                              ? 'Eksiklikleri giderip tekrar deneyin'
                              : 'E-posta bildirimi alacaksınız'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification History */}
                {verificationHistory.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <FiFileText className="w-5 h-5 mr-2 text-purple-600" />
                      Doğrulama Geçmişi
                    </h3>

                    <div className="space-y-4">
                      {verificationHistory
                        .slice()
                        .reverse()
                        .map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200"
                          >
                            <div
                              className={`flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ${
                                entry.approvedAt ? 'bg-green-100' : 'bg-red-100'
                              }`}
                            >
                              {entry.approvedAt ? (
                                <FiCheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <FiX className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4
                                  className={`text-sm font-medium ${
                                    entry.approvedAt
                                      ? 'text-green-800'
                                      : 'text-red-800'
                                  }`}
                                >
                                  {entry.approvedAt
                                    ? 'Onaylandı'
                                    : 'Reddedildi'}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {entry.approvedAt
                                    ? new Date(
                                        entry.approvedAt as any
                                      ).toLocaleDateString('tr-TR')
                                    : entry.rejectedAt
                                      ? new Date(
                                          entry.rejectedAt as any
                                        ).toLocaleDateString('tr-TR')
                                      : 'Tarih bilinmiyor'}
                                </span>
                              </div>
                              {entry.rejectionReason && (
                                <p className="text-sm text-red-700 mt-1">
                                  {entry.rejectionReason}
                                </p>
                              )}
                              {(entry.approvedBy || entry.rejectedBy) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Yönetici:{' '}
                                  {entry.approvedBy || entry.rejectedBy}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Benefits or Next Steps */}
                <div
                  className={`rounded-xl p-6 border ${
                    verificationStatus === BusinessVerificationStatus.VERIFIED
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                      : verificationStatus ===
                          BusinessVerificationStatus.REJECTED
                        ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 flex items-center ${
                      verificationStatus === BusinessVerificationStatus.VERIFIED
                        ? 'text-green-900'
                        : verificationStatus ===
                            BusinessVerificationStatus.REJECTED
                          ? 'text-red-900'
                          : 'text-green-900'
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 mr-2 ${
                        verificationStatus ===
                        BusinessVerificationStatus.VERIFIED
                          ? 'text-green-600'
                          : verificationStatus ===
                              BusinessVerificationStatus.REJECTED
                            ? 'text-red-600'
                            : 'text-green-600'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {verificationStatus === BusinessVerificationStatus.VERIFIED
                      ? 'Mevcut Avantajlarınız'
                      : verificationStatus ===
                          BusinessVerificationStatus.REJECTED
                        ? 'Sonraki Adımlar'
                        : 'Onay Sonrası Avantajlar'}
                  </h3>

                  <ul
                    className={`text-sm space-y-3 ${
                      verificationStatus === BusinessVerificationStatus.VERIFIED
                        ? 'text-green-700'
                        : verificationStatus ===
                            BusinessVerificationStatus.REJECTED
                          ? 'text-red-700'
                          : 'text-green-700'
                    }`}
                  >
                    {verificationStatus ===
                    BusinessVerificationStatus.REJECTED ? (
                      <>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                          <span>Red nedenini dikkatle inceleyin</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                          <span>Eksik belgelerinizi tamamlayın</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                          <span>Kurulum sayfasından yeniden başvurun</span>
                        </li>
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                          <span>Destek ekibimizle iletişime geçin</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start">
                          <span
                            className={`w-2 h-2 rounded-full mr-3 mt-2 flex-shrink-0 ${
                              verificationStatus ===
                              BusinessVerificationStatus.VERIFIED
                                ? 'bg-green-400'
                                : 'bg-green-400'
                            }`}
                          ></span>
                          <span>
                            <strong>Yetkili Bayi Rozeti</strong> -{' '}
                            {verificationStatus ===
                            BusinessVerificationStatus.VERIFIED
                              ? 'Aktif'
                              : 'Profilinizde görünecek'}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span
                            className={`w-2 h-2 rounded-full mr-3 mt-2 flex-shrink-0 ${
                              verificationStatus ===
                              BusinessVerificationStatus.VERIFIED
                                ? 'bg-green-400'
                                : 'bg-green-400'
                            }`}
                          ></span>
                          <span>
                            <strong>Öncelikli Listeleme</strong> -{' '}
                            {verificationStatus ===
                            BusinessVerificationStatus.VERIFIED
                              ? 'Kullanılabilir'
                              : 'Arama sonuçlarında üst sıralarda'}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span
                            className={`w-2 h-2 rounded-full mr-3 mt-2 flex-shrink-0 ${
                              verificationStatus ===
                              BusinessVerificationStatus.VERIFIED
                                ? 'bg-green-400'
                                : 'bg-green-400'
                            }`}
                          ></span>
                          <span>
                            <strong>Müşteri Güveni</strong> -{' '}
                            {verificationStatus ===
                            BusinessVerificationStatus.VERIFIED
                              ? 'Doğrulanmış işletme'
                              : 'Doğrulanmış işletme olarak görünürsünüz'}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span
                            className={`w-2 h-2 rounded-full mr-3 mt-2 flex-shrink-0 ${
                              verificationStatus ===
                              BusinessVerificationStatus.VERIFIED
                                ? 'bg-green-400'
                                : 'bg-green-400'
                            }`}
                          ></span>
                          <span>
                            <strong>Özel Özellikler</strong> -{' '}
                            {verificationStatus ===
                            BusinessVerificationStatus.VERIFIED
                              ? 'Tam erişim'
                              : 'İş araçlarına erişim'}
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Right Column - Status & Actions */}
              <div className="space-y-8">
                {/* Verification Status */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Doğrulama Durumu
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-3 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v8h12V6H4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">
                          Yüklenen Belgeler
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasDocuments ? (
                          <FiCheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <FiAlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span
                          className={`font-semibold ${
                            hasDocuments ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {hasDocuments
                            ? `${documentsCount} belge yüklendi`
                            : 'Belge yüklenmedi'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-3 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span className="font-medium text-gray-900">
                          İşletme Telefonu
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasBusinessPhone ? (
                          <FiCheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <FiAlertCircle className="h-5 w-5 text-orange-600" />
                        )}
                        <span
                          className={`font-semibold ${
                            hasBusinessPhone
                              ? 'text-green-600'
                              : 'text-orange-600'
                          }`}
                        >
                          {hasBusinessPhone ? 'Doğrulandı' : 'Opsiyonel'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Hızlı Erişim
                  </h3>

                  <div className="space-y-3">
                    {verificationStatus !==
                      BusinessVerificationStatus.REJECTED && (
                      <Link
                        href="/home"
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-4.586l.293.293a1 1 0 001.414-1.414l-9-9z" />
                        </svg>
                        Ana Sayfaya Git
                      </Link>
                    )}

                    {verificationStatus ===
                      BusinessVerificationStatus.REJECTED && (
                      <Link
                        href="/setup"
                        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        <FiRefreshCw className="w-5 h-5 mr-2" />
                        Belgeleri Yeniden Yükle
                      </Link>
                    )}

                    <Link
                      href="/setup"
                      className={`w-full inline-flex justify-center items-center px-6 py-3 border text-base font-medium rounded-xl transition-all duration-200 ${
                        verificationStatus ===
                        BusinessVerificationStatus.REJECTED
                          ? 'border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100'
                          : 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {verificationStatus ===
                      BusinessVerificationStatus.REJECTED
                        ? 'Belgeleri Görüntüle'
                        : 'Kurulum Sayfası'}
                    </Link>

                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full text-base py-3 hover:bg-gray-100 transition-all duration-200"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Çıkış Yap
                    </Button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 text-center">
                  <div className="mb-4">
                    <svg
                      className="w-8 h-8 mx-auto text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Destek Ekibimiz
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Sorularınız için 7/24 destek hizmeti sunuyoruz
                  </p>
                  <a
                    href="mailto:destek@elektroexpert.com"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    destek@elektroexpert.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerificationStatus
