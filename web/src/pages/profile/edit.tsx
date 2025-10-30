/**
 * Profile Edit Page
 * Allows users to edit their profile information including business details
 */

import { AuthGuard } from '@/components/auth/AuthGuard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { FiArrowLeft, FiMapPin, FiSave, FiUser } from 'react-icons/fi'

interface Address {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export default function ProfileEditPage() {
  const router = useRouter()
  const { appUser, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState<Address>({})

  // Business-specific states
  const [businessName, setBusinessName] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [businessData, setBusinessData] = useState<any>(null)

  const isBusinessAccount = appUser?.accountType === 'business'

  // Load user data on mount
  useEffect(() => {
    if (appUser) {
      setFirstName(appUser.firstName || '')
      setLastName(appUser.lastName || '')
      setPhoneNumber(appUser.phoneNumber || '')
      setEmail(appUser.email || '')
      setAddress(appUser.address || {})

      // Fetch business data if business account
      if (isBusinessAccount && appUser.businessInfo?.businessId) {
        fetchBusinessData()
      }
    }
  }, [appUser, isBusinessAccount])

  const fetchBusinessData = async () => {
    if (!appUser?.businessInfo?.businessId) return

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
          const business = result.data
          setBusinessData(business)
          setBusinessName(business.businessName || '')
          setBusinessPhone(business.phone || '')
          setBusinessEmail(business.email || '')
          setWebsite(business.website || '')
        }
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!appUser?.id) {
      setError('User information not available')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Update user profile
      const userUpdateData = {
        firstName,
        lastName,
        phoneNumber,
        address: Object.keys(address).length > 0 ? address : undefined,
      }

      const userResponse = await fetch(`/api/user/${appUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userUpdateData),
      })

      if (!userResponse.ok) {
        throw new Error('Failed to update user profile')
      }

      // Update business data if business account
      if (isBusinessAccount && businessData) {
        const businessUpdateData = {
          businessName,
          phone: businessPhone,
          email: businessEmail,
          website: website || undefined,
        }

        const businessResponse = await fetch(
          `/api/business/${businessData.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(businessUpdateData),
          }
        )

        if (!businessResponse.ok) {
          throw new Error('Failed to update business information')
        }
      }

      // Refresh user data
      await refreshUser()
      setSuccess('Profil başarıyla güncellendi')

      // Redirect back to profile after 2 seconds
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Profil güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!appUser) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <FiArrowLeft className="h-5 w-5 mr-2" />
              Profil'e Geri Dön
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Profili Düzenle
            </h1>
            <p className="text-gray-600 mt-2">
              {isBusinessAccount
                ? 'İşletme ve kişisel bilgilerinizi güncelleyin'
                : 'Kişisel bilgilerinizi güncelleyin'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FiUser className="h-6 w-6 mr-3 text-blue-600" />
                Kişisel Bilgiler
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ad
                  </label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Adınızı girin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Soyad
                  </label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Soyadınızı girin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefon Numarası
                  </label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="Telefon numaranızı girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    E-posta (Değiştirilemez)
                  </label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiMapPin className="h-5 w-5 mr-2 text-green-600" />
                  Adres Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sokak/Mahalle
                    </label>
                    <Input
                      type="text"
                      value={address?.street || ''}
                      onChange={e =>
                        setAddress({ ...address, street: e.target.value })
                      }
                      placeholder="Sokak/Mahalle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şehir
                    </label>
                    <Input
                      type="text"
                      value={address?.city || ''}
                      onChange={e =>
                        setAddress({ ...address, city: e.target.value })
                      }
                      placeholder="Şehir"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İl
                    </label>
                    <Input
                      type="text"
                      value={address?.state || ''}
                      onChange={e =>
                        setAddress({ ...address, state: e.target.value })
                      }
                      placeholder="İl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posta Kodu
                    </label>
                    <Input
                      type="text"
                      value={address?.postalCode || ''}
                      onChange={e =>
                        setAddress({ ...address, postalCode: e.target.value })
                      }
                      placeholder="Posta Kodu"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            {isBusinessAccount && (
              <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FiUser className="h-6 w-6 mr-3 text-orange-600" />
                  İşletme Bilgileri
                </h2>{' '}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      İşletme Adı
                    </label>
                    <Input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="İşletme adını girin"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      İşletme Telefonu
                    </label>
                    <Input
                      type="tel"
                      value={businessPhone}
                      onChange={e => setBusinessPhone(e.target.value)}
                      placeholder="İşletme telefon numarası"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      İşletme E-posta
                    </label>
                    <Input
                      type="email"
                      value={businessEmail}
                      onChange={e => setBusinessEmail(e.target.value)}
                      placeholder="İşletme e-posta adresi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Web Sitesi
                    </label>
                    <Input
                      type="url"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://orneksite.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/profile')}
                disabled={loading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <FiSave className="h-4 w-4 mr-2" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}
