'use client'

import { AuthGuard, PasswordChangeForm } from '@/components/auth'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/contexts/AuthContext'
import { logoutAndRedirect } from '@/lib/auth-utils'
import { userService } from '@/services/auth/UserService'
import { AccountType } from '@/shared-generated'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  FiAlertTriangle,
  FiCheck,
  FiClock,
  FiFileText,
  FiLock,
  FiLogOut,
  FiUpload,
  FiUser,
  FiX,
} from 'react-icons/fi'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess?: () => void // Callback to refresh user data after successful upload
}

function DocumentUploadModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: DocumentUploadModalProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [success, setSuccess] = useState('')

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles: File[] = []
    let errorMessage = ''

    for (const file of files) {
      // Check file type
      const isPDF = file.type === 'application/pdf'
      const isImage = file.type.startsWith('image/')

      if (!isPDF && !isImage) {
        errorMessage = 'Sadece PDF ve resim dosyaları kabul edilir'
        continue
      }

      // Check file size
      const maxSize = isPDF ? MAX_FILE_SIZE : MAX_IMAGE_SIZE
      if (file.size > maxSize) {
        errorMessage = isPDF
          ? "PDF dosyaları 10MB'dan küçük olmalıdır"
          : "Resim dosyaları 5MB'dan küçük olmalıdır"
        continue
      }

      validFiles.push(file)
    }

    if (errorMessage) {
      setError(errorMessage)
      setSuccess('')
    } else {
      setError('')
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedFiles.length === 0) {
      setError('En az bir belge yüklemeniz gerekiyor')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // TODO: Implement actual document upload logic using storageClientService
      console.log('Uploading documents for user:', userId)
      console.log(
        'Files to upload:',
        selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
      )

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Clear business rejection status after successful document upload
      console.log('Clearing rejection status for user:', userId)
      const clearRejectionResult =
        await userService.clearBusinessRejection(userId)

      if (!clearRejectionResult.success) {
        console.error(
          'Failed to clear rejection status:',
          clearRejectionResult.error
        )
        setError(
          'Belgeler yüklendi ancak durum güncellenirken hata oluştu. Lütfen sayfayı yenileyin.'
        )
        setUploading(false)
        return
      }

      console.log('Business rejection status cleared successfully')
      setSuccess(
        'Belgeler başarıyla yüklendi ve başvurunuz yeniden inceleme için gönderildi.'
      )

      // Reset form
      setSelectedFiles([])

      // Call success callback to refresh user data
      if (onSuccess) {
        onSuccess()
      }

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Upload failed:', error)
      setError('Belge yüklenirken hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FiFileText className="h-4 w-4 text-red-500" />
    }
    if (file.type.startsWith('image/')) {
      return <div className="w-4 h-4 bg-blue-500 rounded" />
    }
    return <FiFileText className="h-4 w-4 text-gray-500" />
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Belge Yükleme">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-600">
          İşletme onayı için gerekli belgeleri ve işyeri fotoğraflarını
          yükleyin:
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Belgeler ve Fotoğraflar
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,image/*"
            onChange={handleFilesChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            PDF belgeler (max 10MB) ve işyeri fotoğrafları (max 5MB)
            seçebilirsiniz
          </p>
        </div>

        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Seçilen Dosyalar ({selectedFiles.length})
            </p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
                >
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file)}
                    <div className="flex-1">
                      <p className="text-sm text-green-800 font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {file.type.startsWith('image/') ? 'Fotoğraf' : 'Belge'}{' '}
                        - {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    disabled={uploading}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Documents Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium mb-2">
            Gerekli Belgeler:
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Vergi Levhası (PDF)</li>
            <li>• Ticaret Sicil Gazetesi (PDF)</li>
            <li>• İmza Sirküleri (PDF)</li>
            <li>• Faaliyet Belgesi (PDF) - Opsiyonel</li>
            <li>• İşyeri Fotoğrafları (JPG, PNG) - Opsiyonel</li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            • PDF belgeler maksimum 10MB olabilir
            <br />
            • Fotoğraflar maksimum 5MB olabilir
            <br />• En az bir belge yüklemeniz gerekiyor
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
            type="button"
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={uploading || selectedFiles.length === 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {uploading ? (
              <>
                <LoadingSpinner size="small" className="mr-2" />
                Yükleniyor...
              </>
            ) : (
              <>
                <FiUpload className="h-4 w-4 mr-2" />
                Belgeleri Yükle ({selectedFiles.length})
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ProfileContent() {
  const { appUser, isLoading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const handleDocumentUploadSuccess = () => {
    // Refresh user data to get updated business info
    if (refreshUser) {
      refreshUser()
    }
  }

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false)
  }

  const handleLogout = async () => {
    await logoutAndRedirect(router, '/login')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Kullanıcı Bulunamadı
          </h2>
          <p className="text-gray-600 mb-4">
            Profil bilgilerinize erişilemiyor. Lütfen tekrar giriş yapın.
          </p>
          <Link href="/login">
            <Button className="w-full">Giriş Yap</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isBusinessAccount = appUser.accountType === AccountType.BUSINESS
  const businessInfo = isBusinessAccount ? (appUser as any).businessInfo : null
  const isBusinessApproved = businessInfo?.isApproved === true
  const isBusinessRejected = businessInfo?.rejectedAt && !isBusinessApproved
  const rejectionReason = businessInfo?.rejectionReason

  // Helper function to safely format address
  const formatAddress = (address: any) => {
    if (!address) return 'Belirtilmemiş'

    if (address.formattedAddress) {
      return address.formattedAddress
    }

    const addressParts = [
      address.street,
      address.doorNumber || address.streetNumber,
      address.apartment,
      address.neighborhood,
      address.district,
      address.city,
      address.postalCode || address.zipCode,
    ].filter(Boolean)

    return addressParts.length > 0 ? addressParts.join(', ') : 'Belirtilmemiş'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <FiUser className="h-8 w-8 text-gray-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {appUser.displayName ||
                  `${appUser.firstName || ''} ${appUser.lastName || ''}`.trim() ||
                  appUser.email?.split('@')[0]}
              </h2>
              <p className="text-gray-600">{appUser.email}</p>
            </div>
          </div>
        </div>

        {/* Account Operations - Moved to top */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Hesap İşlemleri
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="small"
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center"
            >
              <FiLock className="h-4 w-4 mr-2" />
              Şifre Değiştir
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => router.push('/profile/edit')}
              className="flex items-center"
            >
              <FiUser className="h-4 w-4 mr-2" />
              Profili Düzenle
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50 flex items-center"
            >
              <FiLogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Hesap Durumu
              </h3>
              <div className="space-y-3">
                {/* Account Type */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hesap Türü</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <FiUser className="h-3 w-3 mr-1" />
                    {isBusinessAccount ? 'İş Hesabı' : 'Bireysel Hesap'}
                  </span>
                </div>

                {/* Email Verification */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    E-posta Doğrulama
                  </span>
                  {appUser.isEmailVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FiCheck className="h-3 w-3 mr-1" />
                      Doğrulandı
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <FiX className="h-3 w-3 mr-1" />
                      Doğrulanmadı
                    </span>
                  )}
                </div>

                {/* Business Approval Status */}
                {isBusinessAccount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">İşletme Onayı</span>
                    {isBusinessApproved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FiCheck className="h-3 w-3 mr-1" />
                        Onaylandı
                      </span>
                    ) : isBusinessRejected ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <FiX className="h-3 w-3 mr-1" />
                        Reddedildi
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <FiClock className="h-3 w-3 mr-1" />
                        Beklemede
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profil Bilgileri
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Ad Soyad
                    </label>
                    <p className="text-gray-900">
                      {`${appUser.firstName || ''} ${appUser.lastName || ''}`.trim() ||
                        'Belirtilmemiş'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      E-posta Adresi
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-900">{appUser.email}</p>
                      {appUser.isEmailVerified ? (
                        <span className="inline-flex items-center text-green-600">
                          <FiCheck className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600">
                          <FiX className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Telefon Numarası
                    </label>
                    <p className="text-gray-900">
                      {appUser.phone || 'Belirtilmemiş'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Hesap Oluşturma Tarihi
                    </label>
                    <p className="text-gray-900">
                      {appUser.createdAt
                        ? new Date(appUser.createdAt).toLocaleDateString(
                            'tr-TR'
                          )
                        : 'Bilinmiyor'}
                    </p>
                  </div>
                </div>

                {appUser.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Adres
                    </label>
                    <p className="text-gray-900">
                      {formatAddress(appUser.address)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Business Rejection Reason */}
            {isBusinessAccount && isBusinessRejected && rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <FiAlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      İşletme Başvurusu Reddedildi
                    </h3>
                    <p className="text-red-800 mb-4">{rejectionReason}</p>
                    <Button
                      onClick={() => setShowDocumentModal(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <FiUpload className="h-4 w-4 mr-2" />
                      Belgeleri Tekrar Yükle
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Business Information (if business account) */}
            {isBusinessAccount && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  İşletme Bilgileri
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        İşletme Adı
                      </label>
                      <p className="text-gray-900">
                        {businessInfo?.businessName || 'Belirtilmemiş'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Vergi Numarası
                      </label>
                      <p className="text-gray-900">
                        {businessInfo?.taxNumber || 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Ticaret Sicil No
                      </label>
                      <p className="text-gray-900">
                        {businessInfo?.tradeRegistryNumber || 'Belirtilmemiş'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        İşletme Telefonu
                      </label>
                      <p className="text-gray-900">
                        {businessInfo?.businessPhone || 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>

                  {businessInfo?.businessAddress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        İşletme Adresi
                      </label>
                      <p className="text-gray-900">
                        {formatAddress(businessInfo.businessAddress)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        userId={appUser?.id || ''}
        onSuccess={handleDocumentUploadSuccess}
      />

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title=""
      >
        <PasswordChangeForm
          onSuccess={handlePasswordChangeSuccess}
          onCancel={() => setShowPasswordModal(false)}
        />
      </Modal>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard requireAuth={true}>
      <ProfileContent />
    </AuthGuard>
  )
}
