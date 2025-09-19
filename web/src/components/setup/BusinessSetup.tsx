/**
 * Business Setup Component
 * Handles additional profile completion for business accounts (documents and verification)
 */

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import {
  DocumentStatus,
  DocumentType,
  IBusiness,
  IVideoItem,
  UserDocument,
} from '@/shared-generated'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

interface BusinessSetupProps {
  videos?: IVideoItem[]
}

const BusinessSetup: React.FC<BusinessSetupProps> = ({ videos = [] }) => {
  const router = useRouter()
  const { appUser, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [businessData, setBusinessData] = useState<IBusiness | null>(null)
  const [fetchingBusiness, setFetchingBusiness] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data state
  const [phone, setPhone] = useState(appUser?.phoneNumber || '')
  const [taxCertificate, setTaxCertificate] = useState<File | null>(null)
  const [placePhotos, setPlacePhotos] = useState<File[]>([])

  // Fetch business data for the current user using business API
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!appUser?.businessInfo?.businessId) {
        setFetchingBusiness(false)
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
            // Update phone from business data if available
            if (result.data.phone && !phone) {
              setPhone(result.data.phone)
            }
          }
        } else {
          console.warn('Failed to fetch business data:', response.status)
        }
      } catch (error) {
        console.error('Error fetching business data:', error)
      } finally {
        setFetchingBusiness(false)
      }
    }

    if (appUser) {
      fetchBusinessData()
    }
  }, [appUser, phone])

  // Check if business setup is complete based on business document
  const isBusinessSetupComplete = () => {
    if (!businessData) return false

    // Check if business has documents uploaded
    const hasDocuments =
      businessData.documents && businessData.documents.length > 0

    // Check if business has required information
    const hasBasicInfo = businessData.businessName && businessData.phone

    return hasDocuments && hasBasicInfo
  }

  // If business setup is already complete, redirect to pending approval
  useEffect(() => {
    if (
      !fetchingBusiness &&
      !isSubmitting &&
      businessData &&
      isBusinessSetupComplete()
    ) {
      router.push('/verification')
    }
  }, [fetchingBusiness, businessData, router, isSubmitting])

  // Video display logic - using passed props instead of client-side fetch
  const primaryVideo: IVideoItem | undefined = videos?.find(
    (v: IVideoItem) => v.isActive
  )
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])
  const showVideo = isClient ? !!primaryVideo : true
  const boxLoading = false // No loading needed since videos are pre-fetched

  // Handle tax certificate selection
  const handleTaxCertificateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("Vergi levhası dosyası 10MB'dan küçük olmalıdır")
        return
      }
      if (file.type !== 'application/pdf') {
        setError('Vergi levhası PDF formatında olmalıdır')
        return
      }
      setTaxCertificate(file)
      setError('')
    }
  }

  // Handle place photos selection
  const handlePlacePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = files.filter((file: File) => {
      if (file.size > MAX_IMAGE_SIZE) {
        setError("Fotoğraflar 5MB'dan küçük olmalıdır")
        return false
      }
      if (!file.type.startsWith('image/')) {
        setError('Sadece resim dosyaları yüklenebilir')
        return false
      }
      return true
    })

    if (validFiles.length > 5) {
      setError('En fazla 5 fotoğraf yükleyebilirsiniz')
      return
    }

    setPlacePhotos(validFiles)
    setError('')
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setIsSubmitting(true)

    // Validate phone number if provided
    if (phone && !/^(\+90|0)?[5-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      setError('Geçerli bir Türkiye telefon numarası girin (5XX XXX XX XX)')
      setLoading(false)
      setIsSubmitting(false)
      return
    }

    try {
      const uploadedDocuments: UserDocument[] = []

      // Upload tax certificate if provided
      if (taxCertificate && appUser?.id) {
        try {
          const { storageClientService } = await import(
            '@/services/storage.service'
          )
          const uploadedTaxCert = await storageClientService.uploadUserDocument(
            appUser.id,
            taxCertificate,
            'tax-certificates'
          )
          uploadedDocuments.push(uploadedTaxCert)
        } catch (uploadError) {
          console.error('Failed to upload tax certificate:', uploadError)
          setError('Vergi levhası yüklenirken hata oluştu')
          setLoading(false)
          setIsSubmitting(false)
          return
        }
      }

      // Upload place photos if provided
      if (placePhotos.length > 0 && appUser?.id) {
        for (const photo of placePhotos) {
          try {
            const { storageClientService } = await import(
              '@/services/storage.service'
            )
            const uploadedPhoto = await storageClientService.uploadUserDocument(
              appUser.id,
              photo,
              'place-photos'
            )
            uploadedDocuments.push(uploadedPhoto)
          } catch (uploadError) {
            console.error('Failed to upload place photo:', uploadError)
            setError('İşyeri fotoğrafları yüklenirken hata oluştu')
            setLoading(false)
            setIsSubmitting(false)
            return
          }
        }
      }

      // Update business document if it exists
      if (businessData?.id) {
        try {
          const businessUpdateData: Partial<IBusiness> = {}

          // Update phone if provided
          if (phone && phone.trim() !== businessData.phone) {
            businessUpdateData.phone = phone.trim()
          }

          // Add uploaded documents to business
          if (uploadedDocuments.length > 0) {
            const businessDocuments = uploadedDocuments.map(doc => {
              // Map UserDocumentCategory to DocumentType enum
              let documentType: DocumentType
              if (doc.category === 'tax-certificates') {
                documentType = DocumentType.TAX_CERTIFICATE
              } else if (doc.category === 'place-photos') {
                documentType = DocumentType.OTHER // Place photos are treated as 'other' documents
              } else if (doc.category === 'business-documents') {
                documentType = DocumentType.BUSINESS_LICENSE
              } else {
                documentType = DocumentType.OTHER
              }

              // Create a serializable document object for the API
              return {
                type: documentType,
                url: doc.url,
                uploadedAt: doc.uploadedAt || new Date().toISOString(), // Send as ISO string for API
                uploadedBy: appUser?.id || '',
                status: DocumentStatus.PENDING,
              }
            })

            businessUpdateData.documents = [
              ...(businessData.documents || []),
              ...(businessDocuments as any), // Cast to allow Date/string for uploadedAt
            ]
          }

          // Update business only if there are changes
          if (Object.keys(businessUpdateData).length > 0) {
            console.log('Updating business with data:', businessUpdateData)

            const response = await fetch(`/api/business/${businessData.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(businessUpdateData),
            })

            console.log('Business update response status:', response.status)

            if (!response.ok) {
              const errorData = await response.text()
              console.error('Business update error response:', errorData)
              throw new Error(
                `Failed to update business information: ${response.status}`
              )
            }

            const result = await response.json()
            if (result.success) {
              // Update local business data state
              setBusinessData(result.data)
            }
          }
        } catch (updateError) {
          console.error('Failed to update business:', updateError)
          setError('İşletme bilgileri güncellenirken hata oluştu')
          setLoading(false)
          setIsSubmitting(false)
          return
        }
      }

      // Also update user phone number if changed
      if (phone && phone.trim() !== appUser?.phoneNumber) {
        try {
          const response = await fetch(`/api/user/${appUser?.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              phoneNumber: phone.trim(),
            }),
          })

          if (!response.ok) {
            console.warn('Failed to update user phone number')
          }
        } catch (userUpdateError) {
          console.warn('Error updating user phone:', userUpdateError)
        }
      }

      setSuccess(true)

      // Refresh user data to get updated profile information
      console.log('Refreshing user data after successful upload...')
      await refreshUser()
      console.log('User data refreshed, profile should be complete now')

      // Reset loading state after successful completion
      setLoading(false)

      // Redirect to pending approval page after successful document upload
      console.log('🚀 Preparing to redirect to verification page...')
      setTimeout(() => {
        console.log('🚀 Executing redirect to verification page...')
        setIsSubmitting(false)
        router.replace('/verification')
      }, 1000) // 1 second delay to show success message
    } catch (err: any) {
      setError(err.message || 'Profil güncellenirken bir hata oluştu')
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center bg-gray-50">
      {/* Show loading while fetching business data */}
      {fetchingBusiness ? (
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">
              İşletme bilgileri yükleniyor...
            </p>
          </div>
        </div>
      ) : showVideo ? (
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-6xl relative">
          {boxLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
              <LoadingSpinner size="large" />
            </div>
          )}
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                İşletme Belgelerini Yükleyin
              </h1>
              <p className="text-gray-600">
                İşletme hesabınızı onaylatabilmek için belgelerinizi yüklemeniz
                gerekmektedir
              </p>
            </div>

            {/* Video Section */}
            <div className="mb-8">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl bg-gray-100 max-w-2xl mx-auto">
                {!isClient ? (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      {/* video placeholder icon */}
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p>Henüz video eklenmemiş</p>
                    </div>
                  </div>
                ) : boxLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Video yükleniyor...</span>
                  </div>
                ) : primaryVideo ? (
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${primaryVideo.youtubeVideoId}${primaryVideo.autoStart ? '?autoplay=1' : ''}${primaryVideo.loop ? '&loop=1&playlist=' + primaryVideo.youtubeVideoId : ''}`}
                    title={primaryVideo.title || 'Kurulum Videosu'}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      {/* video placeholder icon */}
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p>Henüz video eklenmemiş</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                Belgeleriniz başarıyla yüklendi! Onay durumu sayfasına
                yönlendiriliyorsunuz...
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Not:</strong> Belgeleriniz incelendikten sonra
                  profilinizde "Yetkili Bayi" rozeti görüntülenecektir. Ayrıca
                  hesabınızın yönetici tarafından onaylanması gerekmektedir.
                  <strong> Belge yükleme işlemi zorunludur.</strong>
                </p>
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşletme Telefon Numarası
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="5XX XXX XX XX"
                />
                <p className="text-xs text-gray-500 mt-1">
                  İsteğe bağlı - Müşterilerin sizinle iletişim kurması için
                </p>
              </div>

              {/* Tax Certificate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vergi Levhası (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleTaxCertificateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {taxCertificate && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-green-50 rounded">
                    <p className="text-sm text-green-600">
                      ✓ {taxCertificate.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setTaxCertificate(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Maksimum dosya boyutu: 10MB
                </p>
              </div>

              {/* Place Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşletme Fotoğrafları (Max 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePlacePhotosChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {placePhotos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600 mb-2">
                      ✓ {placePhotos.length} fotoğraf yüklendi
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {placePhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`İşletme ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPlacePhotos(prev =>
                                prev.filter((_, i) => i !== index)
                              )
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Her fotoğraf maksimum 5MB olmalıdır
                </p>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Neden Belge Yüklemeliyim?
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Müşteri güvenini artırır</li>
                  <li>• Arama sonuçlarında üst sıralarda yer alırsınız</li>
                  <li>• "Yetkili Bayi" rozetine sahip olursunuz</li>
                  <li>• Daha fazla müşteriye ulaşırsınız</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={
                    loading || (!taxCertificate && placePhotos.length === 0)
                  }
                >
                  {loading ? 'Yükleniyor...' : 'Belgeleri Yükle ve Devam Et'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              İşletme Belgelerini Yükleyin
            </h1>
            <p className="text-gray-600">
              İşletme hesabınızı onaylatabilmek için belgelerinizi yüklemeniz
              gerekmektedir
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              Belgeleriniz başarıyla yüklendi! Onay durumu sayfasına
              yönlendiriliyorsunuz...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Not:</strong> Belgeleriniz incelendikten sonra
                  profilinizde "Yetkili Bayi" rozeti görüntülenecektir. Ayrıca
                  hesabınızın yönetici tarafından onaylanması gerekmektedir.
                  <strong> Belge yükleme işlemi zorunludur.</strong>
                </p>
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşletme Telefon Numarası
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="5XX XXX XX XX"
                />
                <p className="text-xs text-gray-500 mt-1">
                  İsteğe bağlı - Müşterilerin sizinle iletişim kurması için
                </p>
              </div>

              {/* Tax Certificate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vergi Levhası (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleTaxCertificateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {taxCertificate && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-green-50 rounded">
                    <p className="text-sm text-green-600">
                      ✓ {taxCertificate.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setTaxCertificate(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Maksimum dosya boyutu: 10MB
                </p>
              </div>

              {/* Place Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşletme Fotoğrafları (Max 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePlacePhotosChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {placePhotos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600 mb-2">
                      ✓ {placePhotos.length} fotoğraf yüklendi
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {placePhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`İşletme ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPlacePhotos(prev =>
                                prev.filter((_, i) => i !== index)
                              )
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Her fotoğraf maksimum 5MB olmalıdır
                </p>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Neden Belge Yüklemeliyim?
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Müşteri güvenini artırır</li>
                  <li>• Arama sonuçlarında üst sıralarda yer alırsınız</li>
                  <li>• "Yetkili Bayi" rozetine sahip olursunuz</li>
                  <li>• Daha fazla müşteriye ulaşırsınız</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={
                    loading || (!taxCertificate && placePhotos.length === 0)
                  }
                >
                  {loading ? 'Yükleniyor...' : 'Belgeleri Yükle ve Devam Et'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default BusinessSetup
