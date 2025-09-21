/**
 * Business Setup Component
 * Handles additional profile completion for business accounts (documents and verification)
 */

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import {
  IBusiness,
  IDocument,
  IVideoItem,
  StorageDocumentStatus,
  StorageDocumentType,
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

    console.log('🔍 Business setup check:', {
      hasDocuments,
      hasBasicInfo,
      documentsCount: businessData.documents?.length || 0,
      businessName: businessData.businessName,
      phone: businessData.phone,
    })

    return hasDocuments && hasBasicInfo
  }

  // Check if there are already uploaded documents
  const hasUploadedDocuments = () => {
    return businessData?.documents && businessData.documents.length > 0
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

  // Handle "I Updated Documents" button click
  const handleDocumentsUpdated = async () => {
    setLoading(true)
    setError('')

    try {
      // Refresh user data to get updated profile information
      console.log('🔄 User clicked "Belgeleri Güncelledim", refreshing data...')
      await refreshUser()

      // Redirect to verification page
      console.log('🚀 Redirecting to verification page...')
      router.replace('/verification')
    } catch (err: any) {
      setError('Sayfa yenilenirken bir hata oluştu')
      setLoading(false)
    }
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
      const uploadedDocuments: IDocument[] = []

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
              // Map UserDocumentCategory to StorageDocumentType enum
              let dt: StorageDocumentType
              if (doc.category === 'tax-certificates') {
                dt = StorageDocumentType.TAX_CERTIFICATE
              } else if (doc.category === 'place-photos') {
                dt = StorageDocumentType.OTHER // Place photos are treated as 'other' documents
              } else if (doc.category === 'business-documents') {
                dt = StorageDocumentType.BUSINESS_LICENSE
              } else {
                dt = StorageDocumentType.OTHER
              }

              // Create a serializable document object for the API
              return {
                type: dt,
                url: doc.url,
                uploadedAt: doc.uploadedAt || new Date().toISOString(), // Send as ISO string for API
                uploadedBy: appUser?.id || '',
                status: StorageDocumentStatus.PENDING,
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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Show loading while fetching business data */}
        {fetchingBusiness ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto border border-white/20">
            <div className="text-center">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-gray-600">
                İşletme bilgileri yükleniyor...
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            {boxLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl">
                <LoadingSpinner size="large" />
              </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                İşletme Belgelerini Yükleyin
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                İşletme hesabınızı onaylatabilmek için belgelerinizi yüklemeniz
                gerekmektedir
              </p>
            </div>

            <div className="p-8 lg:p-12">
              {/* Video Section */}
              {showVideo && (
                <div className="mb-12">
                  <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-gray-100 max-w-3xl mx-auto">
                    {!isClient ? (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <svg
                            className="w-20 h-20 mx-auto mb-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-lg">Henüz video eklenmemiş</p>
                        </div>
                      </div>
                    ) : boxLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <LoadingSpinner />
                        <span className="ml-3 text-lg">
                          Video yükleniyor...
                        </span>
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
                          <svg
                            className="w-20 h-20 mx-auto mb-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-lg">Henüz video eklenmemiş</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-lg mb-8">
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-lg font-medium">
                      Belgeleriniz başarıyla yüklendi! Onay durumu sayfasına
                      yönlendiriliyorsunuz...
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8">
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-lg font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Info Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-blue-800 leading-relaxed">
                      <strong>Not:</strong> Belgeleriniz incelendikten sonra
                      profilinizde "Yetkili Bayi" rozeti görüntülenecektir.
                      Ayrıca hesabınızın yönetici tarafından onaylanması
                      gerekmektedir.
                      <strong> Belge yükleme işlemi zorunludur.</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        İletişim Bilgileri
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          İşletme Telefon Numarası
                        </label>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="5XX XXX XX XX"
                          className="text-lg py-3"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          İsteğe bağlı - Müşterilerin sizinle iletişim kurması
                          için
                        </p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Neden Belge Yüklemeliyim?
                      </h3>
                      <ul className="text-sm text-green-700 space-y-2">
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                          Müşteri güvenini artırır
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                          Arama sonuçlarında üst sıralarda yer alırsınız
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                          "Yetkili Bayi" rozetine sahip olursunuz
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></span>
                          Daha fazla müşteriye ulaşırsınız
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Tax Certificate */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v8h12V6H4z"
                            clipRule="evenodd"
                          />
                          <path
                            fillRule="evenodd"
                            d="M9 8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.01 3a1 1 0 100 2H12a1 1 0 100-2H9.01z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Vergi Levhası (PDF)
                      </h3>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleTaxCertificateChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 border-dashed rounded-lg text-sm hover:border-blue-400 transition-colors cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {taxCertificate && (
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center">
                              <svg
                                className="w-5 h-5 text-green-600 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm font-medium text-green-700">
                                {taxCertificate.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTaxCertificate(null)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
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
                        <p className="text-sm text-gray-500">
                          Maksimum dosya boyutu: 10MB
                        </p>
                      </div>
                    </div>

                    {/* Place Photos */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        İşletme Fotoğrafları (Max 5)
                      </h3>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePlacePhotosChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 border-dashed rounded-lg text-sm hover:border-purple-400 transition-colors cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        {placePhotos.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center text-sm font-medium text-green-700">
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {placePhotos.length} fotoğraf yüklendi
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                              {placePhotos.map((photo, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={URL.createObjectURL(photo)}
                                    alt={`İşletme ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPlacePhotos(prev =>
                                        prev.filter((_, i) => i !== index)
                                      )
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          Her fotoğraf maksimum 5MB olmalıdır
                        </p>
                      </div>
                    </div>

                    {/* Add Documents Button - Only shown when documents already exist */}
                    {hasUploadedDocuments() && (
                      <div className="mt-4">
                        <div className="flex justify-center">
                          <Button
                            type="submit"
                            disabled={
                              loading ||
                              (!taxCertificate && placePhotos.length === 0)
                            }
                            className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:transform-none disabled:shadow-lg"
                          >
                            {loading ? (
                              <div className="flex items-center">
                                <LoadingSpinner size="small" />
                                <span className="ml-2">Yükleniyor...</span>
                              </div>
                            ) : (
                              'Yeni Belgeler Ekle'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-8 border-t border-gray-200">
                  {hasUploadedDocuments() && (
                    <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-green-800 font-semibold text-lg mb-2">
                            Belgeleriniz Daha Önce Yüklenmiş
                          </h4>
                          <p className="text-green-700 mb-4 leading-relaxed">
                            İşletmeniz için{' '}
                            {businessData?.documents?.length || 0} adet belge
                            bulunuyor. Belgelerinizi güncellediyseniz, aşağıdaki
                            butona tıklayarak onay sürecine devam edebilirsiniz.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              type="button"
                              onClick={handleDocumentsUpdated}
                              disabled={loading}
                              className="px-6 py-3 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                              {loading ? (
                                <div className="flex items-center">
                                  <LoadingSpinner size="small" />
                                  <span className="ml-2">Yükleniyor...</span>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <svg
                                    className="w-5 h-5 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Belgeleri Güncelledim
                                </div>
                              )}
                            </Button>
                            <p className="text-green-600 text-sm italic self-center">
                              Bu butona tıklayarak onay sürecine devam
                              edebilirsiniz
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasUploadedDocuments() && (
                    <div className="flex justify-center">
                      <Button
                        type="submit"
                        disabled={
                          loading ||
                          (!taxCertificate && placePhotos.length === 0)
                        }
                        className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:transform-none disabled:shadow-lg"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <LoadingSpinner size="small" />
                            <span className="ml-2">Yükleniyor...</span>
                          </div>
                        ) : (
                          'Belgeleri Yükle ve Devam Et'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessSetup
