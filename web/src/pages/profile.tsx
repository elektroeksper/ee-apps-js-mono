'use client'

import { AuthGuard, PasswordChangeForm } from '@/components/auth'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/contexts/AuthContext'
import { logoutAndRedirect } from '@/lib/auth-utils'
import { businessService } from '@/services/business.service'
import { AccountType } from '@/shared'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
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
  appUser: any // Current user data including businessInfo
  onSuccess?: () => void
}

function DocumentUploadModal({
  isOpen,
  onClose,
  userId,
  appUser,
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

      // Get the user's business ID from their businessInfo
      if (!appUser?.businessInfo?.businessId) {
        console.error('No business ID found in user businessInfo')
        setUploading(false)
        setError('User is not associated with a business')
        return
      }

      const businessId = appUser.businessInfo.businessId
      console.log('Clearing rejection status for business:', businessId)

      // Use business service to clear rejection status on the business document
      const clearRejectionResult =
        await businessService.clearBusinessRejection(businessId)

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
  const [latestBusinessData, setLatestBusinessData] = useState<any>(null)
  const [businessDataLoading, setBusinessDataLoading] = useState(false)

  // Fetch latest business data for accurate verification status
  useEffect(() => {
    const fetchLatestBusinessData = async () => {
      if (!appUser || appUser.accountType !== AccountType.BUSINESS) {
        return
      }

      const businessInfo = (appUser as any).businessInfo
      const businessId = businessInfo?.businessId

      if (!businessId) {
        return
      }

      setBusinessDataLoading(true)
      try {
        // Get current user's ID token for authentication
        let idToken: string | null = null
        try {
          // Import Firebase auth dynamically to avoid SSR issues
          const { getFirebaseAuth } = await import(
            '@/config/firebase-client-only'
          )
          const auth = getFirebaseAuth()
          if (auth?.currentUser) {
            idToken = await auth.currentUser.getIdToken()
            console.log('🔑 Profile: Using Authorization header with ID token')
          } else {
            console.warn('🚨 Profile: No current user in Firebase auth')
          }
        } catch (error) {
          console.warn('🚨 Profile: Error getting ID token:', error)
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (idToken) {
          headers.Authorization = `Bearer ${idToken}`
        }

        const response = await fetch(`/api/business/${businessId}`, {
          method: 'GET',
          headers,
          credentials: 'include',
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setLatestBusinessData(result.data)
            console.log('🔍 Profile: Latest business data fetched:', {
              verificationStatus: result.data.verification?.status,
            })
          }
        } else {
          console.error(
            '🔍 Profile: Failed to fetch business data:',
            response.status
          )
        }
      } catch (error) {
        console.error('Error fetching latest business data:', error)
      } finally {
        setBusinessDataLoading(false)
      }
    }

    if (appUser) {
      fetchLatestBusinessData()
    }
  }, [appUser])

  const handleDocumentUploadSuccess = () => {
    // Refresh user data to get updated business info
    if (refreshUser) {
      refreshUser()
    }

    // Also refresh the latest business data to get current verification status
    const refreshBusinessData = async () => {
      if (!appUser || appUser.accountType !== AccountType.BUSINESS) {
        return
      }

      const businessInfo = (appUser as any).businessInfo
      const businessId = businessInfo?.businessId

      if (!businessId) {
        return
      }

      try {
        const { getFirebaseAuth } = await import(
          '@/config/firebase-client-only'
        )
        const auth = getFirebaseAuth()
        let idToken: string | null = null

        if (auth?.currentUser) {
          idToken = await auth.currentUser.getIdToken()
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (idToken) {
          headers.Authorization = `Bearer ${idToken}`
        }

        const response = await fetch(`/api/business/${businessId}`, {
          method: 'GET',
          headers,
          credentials: 'include',
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setLatestBusinessData(result.data)
            console.log('🔄 Profile: Business data refreshed after upload')
          }
        }
      } catch (error) {
        console.error('Error refreshing business data:', error)
      }
    }

    // Delay to allow the backend to process the status change
    setTimeout(refreshBusinessData, 1000)
  }

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false)
  }

  const handleLogout = async () => {
    await logoutAndRedirect(router, '/login')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-auth relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10">
          <LoadingSpinner size="large" />
        </div>
      </div>
    )
  }

  if (!appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-auth relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8 max-w-md">
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

  // Use latest business data for verification status if available
  // Note: businessInfo from user document doesn't contain verification status
  // Only the actual business document (latestBusinessData) has the verification info
  const verificationStatus = latestBusinessData?.verification?.status
  const verificationHistory = latestBusinessData?.verification?.history || []

  // Determine verification status from the latest business data
  const isBusinessApproved = verificationStatus === 'verified'
  const isBusinessPending = verificationStatus === 'pending'
  const isBusinessRejected = verificationStatus === 'rejected'

  // Get latest rejection reason from verification history
  const latestRejection = verificationHistory
    .slice()
    .reverse()
    .find((entry: any) => entry.rejectedAt && entry.rejectionReason)
  const rejectionReason = latestRejection?.rejectionReason

  // If we don't have fresh business data yet, show loading or unknown state
  const hasVerificationStatus = latestBusinessData && verificationStatus

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
    <div className="min-h-screen bg-gradient-auth relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <FiUser className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                {appUser.isEmailVerified ? (
                  <FiCheck className="h-4 w-4 text-white" />
                ) : (
                  <FiX className="h-4 w-4 text-white" />
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {appUser.displayName ||
                  `${appUser.firstName || ''} ${appUser.lastName || ''}`.trim() ||
                  'Kullanıcı'}
              </h1>
              <p className="text-lg text-gray-600">{appUser.email}</p>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-3 mt-4">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    isBusinessAccount
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md'
                  }`}
                >
                  <FiUser className="h-4 w-4 mr-2" />
                  {isBusinessAccount ? 'İş Hesabı' : 'Bireysel Hesap'}
                </span>

                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    appUser.isEmailVerified
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md'
                      : 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                  }`}
                >
                  {appUser.isEmailVerified ? (
                    <>
                      <FiCheck className="h-4 w-4 mr-2" />
                      E-posta Doğrulandı
                    </>
                  ) : (
                    <>
                      <FiX className="h-4 w-4 mr-2" />
                      E-posta Doğrulanmadı
                    </>
                  )}
                </span>

                {/* Business Status Badge */}
                {isBusinessAccount && (
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      businessDataLoading || !hasVerificationStatus
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md'
                        : isBusinessApproved
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md'
                          : isBusinessRejected
                            ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md'
                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                    }`}
                  >
                    {businessDataLoading ? (
                      <>
                        <FiClock className="h-4 w-4 mr-2 animate-spin" />
                        Kontrol Ediliyor...
                      </>
                    ) : !hasVerificationStatus ? (
                      <>
                        <FiClock className="h-4 w-4 mr-2" />
                        Durum Yükleniyor...
                      </>
                    ) : isBusinessApproved ? (
                      <>
                        <FiCheck className="h-4 w-4 mr-2" />
                        İşletme Onaylandı
                      </>
                    ) : isBusinessRejected ? (
                      <>
                        <FiX className="h-4 w-4 mr-2" />
                        İşletme Reddedildi
                      </>
                    ) : (
                      <>
                        <FiClock className="h-4 w-4 mr-2" />
                        Onay Bekliyor
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div className="text-right">
              <p className="text-sm text-gray-500">Üye Olma Tarihi</p>
              <p className="text-lg font-semibold text-gray-900">
                {appUser.createdAt
                  ? (appUser.createdAt instanceof Date
                      ? appUser.createdAt
                      : appUser.createdAt.toDate?.() ||
                        new Date(appUser.createdAt.seconds * 1000)
                    ).toLocaleDateString('tr-TR')
                  : 'Bilinmiyor'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                  <FiUser className="h-4 w-4 text-white" />
                </div>
                Profil Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ad Soyad
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {`${appUser.firstName || ''} ${appUser.lastName || ''}`.trim() ||
                        'Belirtilmemiş'}
                    </p>
                  </div>
                </div>

                {/* Email Field */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    E-posta Adresi
                  </label>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        appUser.isEmailVerified
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : 'bg-gradient-to-r from-red-500 to-pink-600'
                      }`}
                    >
                      {appUser.isEmailVerified ? (
                        <FiCheck className="h-4 w-4 text-white" />
                      ) : (
                        <FiX className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {appUser.email}
                    </p>
                  </div>
                </div>

                {/* Phone Field */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefon Numarası
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <FiFileText className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {appUser.phoneNumber || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>

                {/* Join Date Field */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-yellow-50 rounded-xl border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hesap Oluşturma Tarihi
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <FiClock className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {appUser.createdAt
                        ? (appUser.createdAt instanceof Date
                            ? appUser.createdAt
                            : appUser.createdAt.toDate?.() ||
                              new Date(appUser.createdAt.seconds * 1000)
                          ).toLocaleDateString('tr-TR')
                        : 'Bilinmiyor'}
                    </p>
                  </div>
                </div>

                {/* Address Field (if exists) */}
                {appUser.address && (
                  <div className="md:col-span-2 p-4 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adres
                    </label>
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center mt-1">
                        <FiFileText className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 leading-relaxed">
                        {formatAddress(appUser.address)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Business Rejection Alert */}
            {isBusinessAccount && isBusinessRejected && rejectionReason && (
              <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl shadow-xl p-8 text-white">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <FiAlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">
                      İşletme Başvurusu Reddedildi
                    </h3>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                      <p className="text-white/90 text-lg leading-relaxed">
                        {rejectionReason}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDocumentModal(true)}
                      className="group bg-white text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-all duration-200 hover:shadow-lg flex items-center"
                    >
                      <FiUpload className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Belgeleri Tekrar Yükle
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Business Information */}
            {isBusinessAccount && (
              <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                    <FiFileText className="h-4 w-4 text-white" />
                  </div>
                  İşletme Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Name */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      İşletme Adı
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <FiFileText className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {businessInfo?.businessName || 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>

                  {/* Tax Number */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vergi Numarası
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <FiFileText className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {businessInfo?.taxNumber || 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>

                  {/* Trade Registry Number */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ticaret Sicil No
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <FiFileText className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {businessInfo?.tradeRegistryNumber || 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>

                  {/* Business Phone */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      İşletme Telefonu
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <FiFileText className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {businessInfo?.businessPhone || 'Belirtilmemiş'}
                      </p>
                    </div>
                  </div>

                  {/* Business Address */}
                  {businessInfo?.businessAddress && (
                    <div className="md:col-span-2 p-4 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border border-gray-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        İşletme Adresi
                      </label>
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center mt-1">
                          <FiFileText className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-medium text-gray-900 leading-relaxed">
                          {formatAddress(businessInfo.businessAddress)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Operations - Lean Version */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Hesap İşlemleri
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors duration-200"
            >
              <FiLock className="h-4 w-4 mr-2" />
              Şifre Değiştir
            </button>
            <button
              onClick={() => router.push('/profile/edit')}
              className="flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors duration-200"
            >
              <FiUser className="h-4 w-4 mr-2" />
              Profili Düzenle
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors duration-200"
            >
              <FiLogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        userId={appUser?.id || ''}
        appUser={appUser}
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

// This page requires authentication and dynamic content, so it should not be statically generated
export async function getServerSideProps() {
  return {
    props: {},
  }
}
