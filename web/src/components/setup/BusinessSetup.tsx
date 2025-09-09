/**
 * Business Setup Component
 * Handles additional profile completion for business accounts (documents and verification)
 */

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { storageClientService } from '@/services/storageClientService'
import { UserDocument } from '@/shared-generated'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

const BusinessSetup: React.FC = () => {
  const router = useRouter()
  const { appUser, updateUser, refreshUser } = useAuth()
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

      // Update user profile with upload information
      await updateUser({
        // Store business-specific data as a nested object
        ...{
          businessInfo: {
            ...(appUser as any)?.businessInfo,
            // Ensure company name is set (use existing or fallback to user's display name)
            companyName:
              (appUser as any)?.businessInfo?.companyName ||
              appUser?.displayName ||
              'İşletme',
            isCertified: false, // Will be set to true after document verification
            isApproved: false, // Business users need admin approval
            documentsUploadedAt:
              uploadedDocuments.length > 0
                ? new Date().toISOString()
                : undefined,
          },
          // Store the actual uploaded documents array
          documents: uploadedDocuments,
        },
      } as any)

      setSuccess(true)

      // Refresh user data to get updated profile information
      console.log('Refreshing user data after successful upload...')
      await refreshUser()
      console.log('User data refreshed, profile should be complete now')

      // Reset loading state after successful completion
      setLoading(false)

      // The setup page will automatically redirect based on updated isProfileComplete
      // No need for manual redirect here
    } catch (err: any) {
      setError(err.message || 'Profil güncellenirken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
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
            Profiliniz başarıyla güncellendi! Onay sürecine
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
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Not:</strong> Belgeleriniz incelendikten sonra
                profilinizde "Yetkili Bayi" rozeti görüntülenecektir. Ayrıca
                hesabınızın yönetici tarafından onaylanması gerekmektedir.
                <strong> Belge yükleme işlemi zorunludur.</strong>
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
    </div>
  )
}

export default BusinessSetup
