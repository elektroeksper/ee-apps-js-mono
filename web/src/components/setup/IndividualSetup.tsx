/**
 * Individual Setup Component
 * Handles profile completion for individual users with address selection
 */

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GOOGLE_MAPS_CONFIG } from '@/config/maps'
import { useAuth } from '@/contexts/AuthContext'
import { IAddress, ICoordinates } from '@/types/maps'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import GoogleAddressAutocomplete, {
  extractAddressComponents,
  getPlaceCoordinates,
} from '../maps/GoogleAddressAutocomplete'
import GoogleMapWithMarker from '../maps/GoogleMapWithMarker'

interface IndividualFormData {
  firstName: string
  lastName: string
  phone: string
  address: IAddress
}

const IndividualSetup: React.FC = () => {
  const router = useRouter()
  const { appUser, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1) // 1: Personal Info, 2: Address

  const [formData, setFormData] = useState<IndividualFormData>({
    firstName: appUser?.firstName || '',
    lastName: appUser?.lastName || '',
    phone: appUser?.phone || '',
    address: {
      type: 'home',
      formattedAddress: '',
      street: '',
      doorNumber: '',
      apartment: '',
      neighborhood: '',
      district: '',
      city: '',
      state: '',
      postalCode: '',
      zipCode: '', // Added zipCode
      country: 'Türkiye',
      coordinates: GOOGLE_MAPS_CONFIG.defaultCenter,
    },
  })

  const [addressText, setAddressText] = useState('')
  const [hasInteractedWithAddress, setHasInteractedWithAddress] =
    useState(false)
  const [mapCenter, setMapCenter] = useState<ICoordinates>(
    formData.address.coordinates || GOOGLE_MAPS_CONFIG.defaultCenter
  )
  const [markerPosition, setMarkerPosition] = useState<
    ICoordinates | undefined
  >(formData.address.coordinates)

  // Check if we have sufficient address information for door number input
  const hasSufficientAddressInfo = React.useMemo(() => {
    return !!(
      formData.address.street &&
      formData.address.neighborhood &&
      formData.address.city
    )
  }, [
    formData.address.street,
    formData.address.neighborhood,
    formData.address.city,
  ])

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation && !formData.address.coordinates) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setMapCenter(coords)
          setMarkerPosition(coords)
          setFormData(prev => ({
            ...prev,
            address: { ...prev.address, coordinates: coords },
          }))
        },
        error => {
          console.log('Geolocation error:', error)
          // Keep default center
        }
      )
    }
  }, [])

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult) => {
      const components = extractAddressComponents(place)
      const coordinates = getPlaceCoordinates(place)

      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          formattedAddress: components.formatted,
          street: components.street || '',
          doorNumber: components.streetNumber,
          neighborhood: components.neighborhood,
          district: components.district,
          city: components.city || '',
          state: components.city || '', // Using city as state for Turkey
          postalCode: components.postalCode,
          zipCode: components.postalCode || '', // Sync zipCode with postalCode
          country: components.country || 'Türkiye',
          coordinates: coordinates || prev.address.coordinates,
        },
      }))

      if (coordinates) {
        setMapCenter(coordinates)
        setMarkerPosition(coordinates)
      }

      setAddressText(components.formatted)
    },
    []
  )

  // Handle marker drag on map
  const handleMarkerDragEnd = useCallback((position: ICoordinates) => {
    setMarkerPosition(position)
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, coordinates: position },
    }))
  }, [])

  // Handle address change from map (reverse geocoding)
  const handleAddressChangeFromMap = useCallback(
    (place: google.maps.places.PlaceResult | null) => {
      if (place) {
        const components = extractAddressComponents(place)
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            formattedAddress: components.formatted,
            street: components.street,
            doorNumber: components.streetNumber,
            neighborhood: components.neighborhood,
            district: components.district,
            city: components.city,
            state: components.city,
            postalCode: components.postalCode,
          },
        }))
        setAddressText(components.formatted)
      }
    },
    []
  )

  // Handle input changes
  const handleInputChange = (
    field: keyof IndividualFormData | string,
    value: string
  ) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  // Validate step 1
  const validatePersonalInfo = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('Lütfen adınızı girin')
      return false
    }
    if (!formData.lastName.trim()) {
      setError('Lütfen soyadınızı girin')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Lütfen telefon numaranızı girin')
      return false
    }
    if (!/^(\+90|0)?[5-9]\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      setError('Geçerli bir telefon numarası girin')
      return false
    }
    return true
  }

  // Validate step 2
  const validateAddress = (): boolean => {
    if (!formData.address.coordinates) {
      setError('Lütfen haritadan konumunuzu seçin')
      return false
    }
    if (!formData.address.city) {
      setError('Lütfen şehir bilgisini girin')
      return false
    }
    if (hasSufficientAddressInfo && !formData.address.doorNumber?.trim()) {
      setError('Lütfen kapı numaranızı girin')
      return false
    }
    return true
  }

  // Handle next step
  const handleNextStep = () => {
    setError('')
    if (step === 1 && validatePersonalInfo()) {
      setStep(2)
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    setError('')
    setStep(1)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateAddress()) {
      return
    }

    setLoading(true)

    try {
      // Update user profile
      await updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
      })

      setSuccess(true)

      // Redirect to home after success
      setTimeout(() => {
        router.push('/home')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Profil güncellenirken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Profilinizi Tamamlayın
          </h1>
          <p className="text-gray-600">
            Hizmetlerimizden yararlanabilmek için lütfen bilgilerinizi
            tamamlayın
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full 
              ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}
            >
              1
            </div>
            <div
              className={`w-24 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}
            />
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full 
              ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}
            >
              2
            </div>
          </div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-8">
            <span
              className={`text-sm ${step === 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}
            >
              Kişisel Bilgiler
            </span>
            <span
              className={`text-sm ${step === 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}
            >
              Adres Bilgileri
            </span>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            Profiliniz başarıyla güncellendi! Ana sayfaya
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
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Kişisel Bilgiler
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad *
                  </label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={e =>
                      handleInputChange('firstName', e.target.value)
                    }
                    placeholder="Adınız"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Soyad *
                  </label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={e =>
                      handleInputChange('lastName', e.target.value)
                    }
                    placeholder="Soyadınız"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası *
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="5XX XXX XX XX"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Başında 0 olmadan giriniz
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={handleNextStep} className="px-6">
                  İleri
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Adres Bilgileri
              </h2>

              {/* Address Autocomplete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres Ara
                </label>
                <GoogleAddressAutocomplete
                  value={addressText}
                  onChange={value => {
                    setAddressText(value)
                    if (value.trim()) {
                      setHasInteractedWithAddress(true)
                    }
                  }}
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Adresinizi arayın veya haritadan seçin"
                />
              </div>

              {/* Map */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Haritadan Konumunuzu Seçin
                </label>
                <GoogleMapWithMarker
                  center={mapCenter}
                  markerPosition={markerPosition}
                  draggable={true}
                  onMarkerDragEnd={handleMarkerDragEnd}
                  onAddressChange={handleAddressChangeFromMap}
                  height="400px"
                  className="rounded-lg overflow-hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  İşaretçiyi sürükleyerek konumunuzu ayarlayabilirsiniz
                </p>
              </div>

              {/* Conditional Door Number Field - Only show when sufficient address info available */}
              {hasSufficientAddressInfo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kapı No *
                  </label>
                  <Input
                    type="text"
                    value={formData.address.doorNumber}
                    onChange={e =>
                      handleInputChange('address.doorNumber', e.target.value)
                    }
                    placeholder="Kapı numaranızı girin"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Adres bilgileri tamamlandıktan sonra kapı numaranızı
                    girebilirsiniz
                  </p>
                </div>
              )}

              {/* Warning when user has interacted but insufficient address info */}
              {!hasSufficientAddressInfo && hasInteractedWithAddress && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-700">
                    <svg
                      className="w-4 h-4 inline mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Kapı numarası girebilmek için yukarıdan adresinizi seçin
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                >
                  Geri
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    (hasSufficientAddressInfo &&
                      !formData.address.doorNumber?.trim())
                  }
                >
                  {loading ? 'Kaydediliyor...' : 'Tamamla'}
                </Button>
              </div>

              {/* Warning when door number is required but missing */}
              {hasSufficientAddressInfo &&
                !formData.address.doorNumber?.trim() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm text-amber-700">
                      <svg
                        className="w-4 h-4 inline mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Profili tamamlamak için kapı numaranızı girmeniz gerekiyor
                    </p>
                  </div>
                )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default IndividualSetup
