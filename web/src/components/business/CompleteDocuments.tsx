/**
 * Complete Documents Component
 * Displayed to business users whose account was rejected and need to re-submit documents
 */

import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useVideosByLocation } from '@/hooks/useContentQueries'
import { storageClientService } from '@/services/storageClientService'
import { UserDocument } from '@/shared-generated'
import { IExtendedAppUser } from '@/types/user'
import React, { useEffect, useState } from 'react'
import { FiAlertCircle, FiUpload, FiX } from 'react-icons/fi'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

const CompleteDocuments: React.FC = () => {
  const { appUser, updateUser, logout } = useAuth()
  const extendedUser = appUser as IExtendedAppUser
  const businessInfo = extendedUser?.businessInfo

  // Video fetch and client guard
  const { data: videos, isLoading: videosLoading } =
    useVideosByLocation('business-setup')
  const primaryVideo = videos?.find(v => v.isActive) || null
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])
  const showVideo = isClient ? videosLoading || !!primaryVideo : true
  const boxLoading = isClient && videosLoading

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Document upload states
  const [taxCertificate, setTaxCertificate] = useState<File | null>(null)
  const [placePhotos, setPlacePhotos] = useState<File[]>([])

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
    const validFiles = files.filter(file => {
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

    try {
      const uploadedDocuments: UserDocument[] = []

      // Upload tax certificate if provided
      if (taxCertificate && appUser?.id) {
        try {
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
          return
        }
      }

      // Upload place photos if provided
      if (placePhotos.length > 0 && appUser?.id) {
        for (const photo of placePhotos) {
          try {
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
            return
          }
        }
      }

      // Update user profile and clear rejection status
      await updateUser({
        businessInfo: {
          ...businessInfo,
          // Clear rejection fields
          rejectedAt: undefined,
          rejectedBy: undefined,
          rejectionReason: undefined,
          // Reset approval status
          isApproved: false,
          // Update documents timestamp
          documentsUploadedAt:
            uploadedDocuments.length > 0 ? new Date().toISOString() : undefined,
        },
        // Store the actual uploaded documents array
        documents: uploadedDocuments,
      } as any)

      setSuccess(true)
      setLoading(false)

      // Redirect to pending approval after a delay
      setTimeout(() => {
        window.location.href = '/pending-approval'
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Belgeler yüklenirken bir hata oluştu')
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {showVideo ? (
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-6xl relative">
          {boxLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
              <LoadingSpinner size="large" />
            </div>
          )}
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <FiAlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Belgeleri Yeniden Yükleyin
              </h1>
              <p className="text-gray-600">
                Hesabınız reddedildi. Lütfen belgelerinizi yeniden yükleyerek
                tekrar başvurun.
              </p>
            </div>

            {/* Rejection Reason */}
            {businessInfo?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <h3 className="text-sm font-semibold text-red-900 mb-2">
                  Red Nedeni:
                </h3>
                <p className="text-sm text-red-800">
                  {businessInfo.rejectionReason}
                </p>
              </div>
            )}

            {/* Video Section */}
            <div className="mb-8">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl bg-gray-100 max-w-2xl mx-auto">
                {!isClient ? (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
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
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
                        />
                      </svg>
                      <p>Henüz video eklenmemiş</p>
                    </div>
                  </div>
                ) : videosLoading ? (
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
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
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
                Belgeleriniz başarıyla yüklendi! Onay sürecine
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
                  <strong>Not:</strong> Belgeleriniz tekrar incelenecektir.
                  Lütfen gerekli düzeltmeleri yaparak yeniden yükleyin. Belge
                  yükleme işlemi zorunludur.
                </p>
              </div>

              {/* Tax Certificate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vergi Levhası (PDF) *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleTaxCertificateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
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
                      <FiX className="w-4 h-4" />
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
                  İşletme Fotoğrafları (Max 5) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePlacePhotosChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
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
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <FiX className="w-3 h-3" />
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
                  Belge Yükleme Gereksinimleri:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Vergi levhası net ve okunabilir olmalıdır</li>
                  <li>• İşletme fotoğrafları işyerini açıkça göstermelidir</li>
                  <li>• Belgeler güncel ve geçerli olmalıdır</li>
                  <li>• Dosya boyutlarına dikkat ediniz</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={
                    loading || (!taxCertificate && placePhotos.length === 0)
                  }
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="small" className="mr-2" />
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <FiUpload className="mr-2" />
                      Belgeleri Yükle ve Tekrar Başvur
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={handleLogout} type="button">
                  Çıkış Yap
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <FiAlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Belgeleri Yeniden Yükleyin
            </h1>
            <p className="text-gray-600">
              Hesabınız reddedildi. Lütfen belgelerinizi yeniden yükleyerek
              tekrar başvurun.
            </p>
          </div>

          {/* Rejection Reason */}
          {businessInfo?.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <h3 className="text-sm font-semibold text-red-900 mb-2">
                Red Nedeni:
              </h3>
              <p className="text-sm text-red-800">
                {businessInfo.rejectionReason}
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              Belgeleriniz başarıyla yüklendi! Onay sürecine
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
                <strong>Not:</strong> Belgeleriniz tekrar incelenecektir. Lütfen
                gerekli düzeltmeleri yaparak yeniden yükleyin.
              </p>
            </div>

            {/* Tax Certificate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vergi Levhası (PDF) *
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleTaxCertificateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
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
                    <FiX className="w-4 h-4" />
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
                İşletme Fotoğrafları (Max 5) *
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePlacePhotosChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
              />
              {placePhotos.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-green-600 mb-2">
                    ✓ {placePhotos.length} fotoğraf yüklendi
                  </p>
                  <div className="grid grid-cols-3 gap-2">
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
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <FiX className="w-3 h-3" />
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
                Belge Gereksinimleri:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vergi levhası net ve okunabilir</li>
                <li>• İşletme fotoğrafları açık</li>
                <li>• Belgeler güncel ve geçerli</li>
                <li>• Dosya boyutlarına dikkat</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col space-y-3 pt-4">
              <Button
                type="submit"
                disabled={
                  loading || (!taxCertificate && placePhotos.length === 0)
                }
                className="w-full"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" className="mr-2" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <FiUpload className="mr-2" />
                    Belgeleri Yükle ve Tekrar Başvur
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleLogout}
                type="button"
                className="w-full"
              >
                Çıkış Yap
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default CompleteDocuments
