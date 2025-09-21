'use client'

import {
  BusinessVerificationStatus,
  IBusiness,
  IDocument,
} from '@/shared-generated'
import { useState } from 'react'
import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiPhone,
  FiX,
} from 'react-icons/fi'
import { HiOfficeBuilding } from 'react-icons/hi'

interface BusinessStatusModalProps {
  business: IBusiness
  isOpen: boolean
  onClose: () => void
  onApprove: (businessId: string) => Promise<void>
  onReject: (business: IBusiness) => void
  isLoading: boolean
}

export default function BusinessStatusModal({
  business,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: BusinessStatusModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'history'>(
    'info'
  )

  if (!isOpen || !business) return null

  const getStatusBadge = (status: BusinessVerificationStatus) => {
    switch (status) {
      case BusinessVerificationStatus.VERIFIED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <FiCheck className="h-4 w-4 mr-1" />
            Onaylandı
          </span>
        )
      case BusinessVerificationStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <FiX className="h-4 w-4 mr-1" />
            Reddedildi
          </span>
        )
      case BusinessVerificationStatus.PENDING:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="h-4 w-4 mr-1" />
            Onay Bekliyor
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Doğrulanmamış
          </span>
        )
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'Bilinmiyor'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canPerformActions =
    business.verification.status === BusinessVerificationStatus.PENDING

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HiOfficeBuilding className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {business.businessName}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusBadge(business.verification.status)}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                {
                  key: 'info',
                  label: 'İşletme Bilgileri',
                  icon: HiOfficeBuilding,
                },
                { key: 'documents', label: 'Belgeler', icon: FiFileText },
                { key: 'history', label: 'Geçmiş', icon: FiCalendar },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Temel Bilgiler
                    </h4>

                    {business.taxNumber && (
                      <div className="flex items-center space-x-3">
                        <FiFileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">
                            Vergi Numarası
                          </p>
                          <p className="font-medium">{business.taxNumber}</p>
                        </div>
                      </div>
                    )}

                    {business.taxOffice && (
                      <div className="flex items-center space-x-3">
                        <HiOfficeBuilding className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Vergi Dairesi</p>
                          <p className="font-medium">{business.taxOffice}</p>
                        </div>
                      </div>
                    )}

                    {business.phone && (
                      <div className="flex items-center space-x-3">
                        <FiPhone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Telefon</p>
                          <p className="font-medium">{business.phone}</p>
                        </div>
                      </div>
                    )}

                    {business.email && (
                      <div className="flex items-center space-x-3">
                        <FiMail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">E-posta</p>
                          <p className="font-medium">{business.email}</p>
                        </div>
                      </div>
                    )}

                    {business.website && (
                      <div className="flex items-center space-x-3">
                        <FiGlobe className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Website</p>
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {business.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {business.addresses && business.addresses.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">
                        Adres Bilgileri
                      </h4>
                      {business.addresses.map((address, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <FiMapPin className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500">
                              Adres {index + 1}
                            </p>
                            <p className="font-medium">
                              {address.street} {address.doorNumber || ''}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.district}, {address.city}{' '}
                              {address.postalCode || address.zipCode}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {business.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Açıklama</h4>
                    <p className="text-gray-600">{business.description}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Yüklenen Belgeler</h4>

                {business.documents && business.documents.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {business.documents.map((doc: IDocument, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FiFileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {doc.name || 'Belge'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {doc.type} •{' '}
                                {Math.round((doc.metadata?.size || 0) / 1024)}{' '}
                                KB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(doc.url, '_blank')}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Görüntüle"
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const a = document.createElement('a')
                                a.href = doc.url
                                a.download = doc.name || 'document'
                                a.click()
                              }}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="İndir"
                            >
                              <FiDownload className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiFileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz belge yüklenmemiş</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Doğrulama Geçmişi</h4>

                {business.verification.history &&
                business.verification.history.length > 0 ? (
                  <div className="space-y-3">
                    {business.verification.history.map((entry, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {entry.approvedAt ? (
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <FiCheck className="h-4 w-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <FiX className="h-4 w-4 text-red-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {entry.approvedAt ? 'Onaylandı' : 'Reddedildi'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(entry.approvedAt || entry.rejectedAt)}
                            </p>
                            {entry.approvedBy && (
                              <p className="text-sm text-gray-600">
                                Onaylayan: {entry.approvedBy}
                              </p>
                            )}
                            {entry.rejectedBy && (
                              <p className="text-sm text-gray-600">
                                Reddeden: {entry.rejectedBy}
                              </p>
                            )}
                            {entry.rejectionReason && (
                              <p className="text-sm text-red-600 mt-1">
                                Ret Sebebi: {entry.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiCalendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz doğrulama geçmişi yok</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {canPerformActions && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => onReject(business)}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 bg-white hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiX className="h-4 w-4 mr-2" />
                Reddet
              </button>
              <button
                onClick={() => onApprove(business.id!)}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <FiCheck className="h-4 w-4 mr-2" />
                )}
                Onayla
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
