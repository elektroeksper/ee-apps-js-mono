'use client'

import { getAuthErrorMessage } from '@/config/firebase-error-messages'
import { GOOGLE_MAPS_CONFIG } from '@/config/maps'
import { useAuth } from '@/contexts/AuthContext'
import {
  usePublicMainCategories,
  usePublicSubCategories,
} from '@/hooks/useCategoryQueries'
import {
  businessRegisterSchema,
  transformToBusinessRegisterData,
  type BusinessRegisterFormData,
} from '@/lib/validations/auth'
import {
  AccountType,
  BUSINESS_CATEGORY_ICONS,
  ICategory,
  ICoordinates,
  TaxNumberType,
} from '@/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import GoogleAddressAutocomplete, {
  extractAddressComponents,
  getPlaceCoordinates,
} from './maps/GoogleAddressAutocomplete'
import GoogleMapWithMarker from './maps/GoogleMapWithMarker'
import { Button } from './ui/Button'
import { Checkbox } from './ui/Checkbox'
import { Input } from './ui/Input'
import { LoadingSpinner } from './ui/LoadingSpinner'

export const BusinessRegisterForm: React.FC = () => {
  const { register: registerUser, isLoading, error, clearError } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    []
  )

  // Fetch subcategories when main category is selected
  const {
    data: subCategoriesResult,
    isLoading: subCategoriesLoading,
    error: subCategoriesError,
    refetch: refetchSubCategories,
  } = usePublicSubCategories(selectedCategory)

  // Google Maps states
  const [addressText, setAddressText] = useState('')
  const [hasInteractedWithAddress, setHasInteractedWithAddress] =
    useState(false)
  const [mapCenter, setMapCenter] = useState<ICoordinates>(
    GOOGLE_MAPS_CONFIG.defaultCenter
  )
  const [markerPosition, setMarkerPosition] = useState<
    ICoordinates | undefined
  >(GOOGLE_MAPS_CONFIG.defaultCenter)

  const form = useForm<BusinessRegisterFormData>({
    resolver: zodResolver(businessRegisterSchema) as any,
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      accountType: AccountType.BUSINESS,
      businessName: '',
      userTitle: '',
      taxNumber: '',
      taxNumberType: TaxNumberType.TAX,
      identityNumber: '',
      taxOffice: '',
      mainCategoryId: '',
      subCategoryIds: [],
      address: {
        street: '',
        doorNumber: '',
        neighborhood: '',
        district: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Turkey',
        coordinates: {
          lat: 39.9334, // Default Ankara coordinates
          lng: 32.8597,
        },
      },
      website: '',
      industry: '',
      companySize: '',
      description: '',
      acceptTerms: false,
      marketingConsent: false,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    setError,
    setValue,
  } = form

  // Fetch categories using React Query
  const {
    data: categoriesResult,
    isLoading: categoriesLoading,
    error: categoriesQueryError,
    isError: categoriesHasError,
  } = usePublicMainCategories()

  // Extract categories and error from the query result
  const categories =
    (categoriesResult?.success ? categoriesResult.data : []) || []
  const categoriesError = categoriesHasError
    ? (categoriesQueryError as Error)?.message ||
      'Kategoriler yüklenirken hata oluştu'
    : categoriesResult?.success === false
      ? categoriesResult.error || 'Kategoriler yüklenemedi'
      : ''

  const onSubmit = async (data: BusinessRegisterFormData) => {
    try {
      clearError()

      // Check if door number is required but missing
      if (hasSufficientAddressInfo && !data.address?.doorNumber) {
        setError('address.doorNumber', {
          type: 'manual',
          message: 'Kapı numarası gereklidir',
        })
        return
      }

      // Use the transformation function to convert form data to IBusinessRegisterData
      if (!registerUser) {
        setError('root', {
          type: 'manual',
          message: 'Registration service is not available',
        })
        return
      }

      // Transform form data to the shared interface format
      const businessRegisterData = transformToBusinessRegisterData(data, '')

      // Register the business user
      const registerResult = await registerUser(businessRegisterData)

      if (!registerResult.success) {
        setError('root', {
          type: 'manual',
          message: getAuthErrorMessage(registerResult.error || 'default', 'tr'),
        })
        return
      }

      // If registration is successful, redirect to verification or dashboard
      router.push('/auth/verify-email?type=business')
    } catch (error) {
      console.error('Registration error:', error)
      setError('root', {
        type: 'manual',
        message:
          'Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      })
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    console.log('🔥 Category selected:', categoryId)
    setSelectedCategory(categoryId)
    setValue('mainCategoryId', categoryId as any)

    // Reset subcategories when main category changes
    setSelectedSubCategories([])
    setValue('subCategoryIds', [])
  }

  const handleSubCategoryToggle = (subCategoryId: string) => {
    console.log('🔥 Subcategory toggled:', subCategoryId)
    const updatedSubCategories = selectedSubCategories.includes(subCategoryId)
      ? selectedSubCategories.filter(id => id !== subCategoryId)
      : [...selectedSubCategories, subCategoryId]

    setSelectedSubCategories(updatedSubCategories)
    setValue('subCategoryIds', updatedSubCategories as any)
    console.log('🔥 Updated subcategories:', updatedSubCategories)
  }

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult) => {
      console.log('🗺️ PLACE SELECT CALLBACK TRIGGERED!')
      console.log('🗺️ Place selected:', place)
      console.log('🗺️ Address components:', place.address_components)

      const components = extractAddressComponents(place)
      const coordinates = getPlaceCoordinates(place)

      console.log('🗺️ Extracted components:', components)
      console.log('🗺️ Coordinates:', coordinates)

      // Update form values
      setValue('address.street', components.street || '')
      setValue('address.doorNumber', components.streetNumber || '')
      setValue('address.neighborhood', components.neighborhood || '')
      setValue('address.district', components.district || '')
      setValue('address.city', components.city || '')
      setValue('address.state', components.city || '') // Using city as state for Turkey
      setValue('address.postalCode', components.postalCode || '')
      setValue('address.country', components.country || 'Turkey')

      if (coordinates) {
        setValue('address.coordinates', coordinates)
        setMapCenter(coordinates)
        setMarkerPosition(coordinates)
        console.log('🗺️ Map centered at:', coordinates)
      }

      setAddressText(components.formatted)
      console.log('🗺️ Address text set to:', components.formatted)
      console.log('🗺️ Form values updated successfully')
    },
    [setValue]
  )

  // Handle marker drag on map
  const handleMarkerDragEnd = useCallback(
    (position: ICoordinates) => {
      setMarkerPosition(position)
      setValue('address.coordinates', position)
    },
    [setValue]
  )

  // Handle address change from map (reverse geocoding)
  const handleAddressChangeFromMap = useCallback(
    (place: google.maps.places.PlaceResult | null) => {
      if (place) {
        const components = extractAddressComponents(place)
        setValue('address.street', components.street || '')
        setValue('address.doorNumber', components.streetNumber || '')
        setValue('address.neighborhood', components.neighborhood || '')
        setValue('address.district', components.district || '')
        setValue('address.city', components.city || '')
        setValue('address.state', components.city || '')
        setValue('address.postalCode', components.postalCode || '')
        setAddressText(components.formatted)
      }
    },
    [setValue]
  )

  // Watch address parts for dynamic full address & geocoding on door number change
  const doorNumber = watch('address.doorNumber')
  const street = watch('address.street')
  const district = watch('address.district')
  const city = watch('address.city')
  const neighborhood = watch('address.neighborhood')

  // Watch required form fields for submit button state
  const businessName = watch('businessName')
  const taxNumber = watch('taxNumber')
  const identityNumber = watch('identityNumber')
  const taxNumberType = watch('taxNumberType')
  const taxOffice = watch('taxOffice')
  const userTitle = watch('userTitle')
  const mainCategoryId = watch('mainCategoryId')
  const firstName = watch('firstName')
  const lastName = watch('lastName')
  const email = watch('email')
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const acceptTerms = watch('acceptTerms')

  // Check if sufficient address info is available to show door number field
  const hasSufficientAddressInfo = React.useMemo(() => {
    // For Turkish addresses, we need at least street and either neighborhood or district
    return !!(street && (neighborhood || district) && city)
  }, [street, neighborhood, district, city])

  // Check if all required fields are filled
  const isFormValid = React.useMemo(() => {
    const hasRequiredBusinessInfo = !!(
      businessName &&
      ((taxNumberType === TaxNumberType.TAX && taxNumber) ||
        (taxNumberType === TaxNumberType.IDENTITY && identityNumber)) &&
      taxOffice &&
      userTitle &&
      mainCategoryId
    )

    const hasRequiredPersonalInfo = !!(firstName && lastName && email)

    const hasRequiredSecurity = !!(password && confirmPassword && acceptTerms)

    const hasRequiredAddress = !hasSufficientAddressInfo || !!doorNumber

    return (
      hasRequiredBusinessInfo &&
      hasRequiredPersonalInfo &&
      hasRequiredSecurity &&
      hasRequiredAddress
    )
  }, [
    businessName,
    taxNumber,
    identityNumber,
    taxNumberType,
    taxOffice,
    userTitle,
    mainCategoryId,
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    acceptTerms,
    hasSufficientAddressInfo,
    doorNumber,
  ])

  const fullAddressPreview = React.useMemo(() => {
    if (!street && !city) return ''
    const parts = [street, doorNumber, neighborhood, district, city, 'Turkey']
    return parts.filter(Boolean).join(', ')
  }, [street, doorNumber, neighborhood, district, city])

  // Debounced geocode when door number changes to update marker & coordinates
  React.useEffect(() => {
    if (!street || !city) return
    if (!window.google || !window.google.maps) return

    const fullForGeocode = [street, doorNumber, district, city, 'Turkey']
      .filter(Boolean)
      .join(' ')

    const handler = setTimeout(() => {
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address: fullForGeocode }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location
            ? results[0].geometry.location
            : null
          if (loc) {
            const coords = { lat: loc.lat(), lng: loc.lng() }
            setMapCenter(coords)
            setMarkerPosition(coords)
            setValue('address.coordinates', coords)
            // Update displayed address text with formatted result including door number
            setAddressText(results[0].formatted_address)
          }
        }
      })
    }, 700) // debounce

    return () => clearTimeout(handler)
  }, [doorNumber, street, district, city, setValue])

  return (
    <div className="bg-white  max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          İşletme Hesabı Oluştur
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, errors => {
          console.log('Form validation errors:', errors)
          // Find the first error field and scroll to it
          const firstErrorField = Object.keys(errors)[0]
          if (firstErrorField) {
            const element = document.querySelector(
              `[name="${firstErrorField}"]`
            )
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }
        })}
        className="space-y-6"
      >
        {/* Display general errors */}
        {(error || errors.root) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">
              {error || errors.root?.message}
            </p>
          </div>
        )}

        {/* Business Information Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            İşletme Bilgileri
          </h2>

          <Input
            label="İşletme Adı"
            {...register('businessName')}
            error={errors.businessName?.message}
            placeholder="İşletme adınızı girin"
          />

          {/* Toggle between Vergi No and TC Kimlik No */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1 h-5">
                <label className="text-sm font-medium text-gray-700">
                  {watch('taxNumberType') === TaxNumberType.TAX
                    ? 'Vergi Numarası'
                    : 'TC Kimlik Numarası'}
                </label>
                <div className="inline justify-center">
                  <span
                    className={`mr-2 text-gray-700 text-sm ${
                      watch('taxNumberType') === TaxNumberType.TAX
                        ? 'font-bold'
                        : ''
                    }`}
                  >
                    Vergi
                  </span>
                  <button
                    type="button"
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      watch('taxNumberType') === TaxNumberType.IDENTITY
                        ? 'bg-indigo-600'
                        : 'bg-gray-300'
                    }`}
                    onClick={() => {
                      const currentType = watch('taxNumberType')
                      const newType =
                        currentType === TaxNumberType.TAX
                          ? TaxNumberType.IDENTITY
                          : TaxNumberType.TAX
                      setValue('taxNumberType', newType)

                      // Clear the opposite field when switching
                      if (newType === TaxNumberType.TAX) {
                        setValue('identityNumber', '')
                      } else {
                        setValue('taxNumber', '')
                      }
                    }}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                        watch('taxNumberType') === TaxNumberType.IDENTITY
                          ? 'translate-x-4'
                          : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span
                    className={`ml-2 text-gray-700 text-sm ${
                      watch('taxNumberType') === TaxNumberType.IDENTITY
                        ? 'font-bold'
                        : ''
                    }`}
                  >
                    TC
                  </span>
                </div>
              </div>
              {watch('taxNumberType') === TaxNumberType.TAX ? (
                <Input
                  {...register('taxNumber')}
                  error={errors.taxNumber?.message}
                  placeholder={'Vergi numaranızı girin (10 haneli)'}
                />
              ) : (
                <Input
                  {...register('identityNumber')}
                  error={errors.identityNumber?.message}
                  placeholder={'TC Kimlik numaranızı girin (11 haneli)'}
                />
              )}
            </div>
            <Input
              label="Vergi Dairesi"
              {...register('taxOffice')}
              error={errors.taxOffice?.message}
              placeholder="Vergi dairenizi girin"
            />
          </div>

          <Input
            label="Ünvanınız/Pozisyonunuz"
            {...register('userTitle')}
            error={errors.userTitle?.message}
            placeholder="İşletmedeki ünvanınızı girin"
          />

          {/* Business Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşletme Kategorisi
            </label>

            {categoriesLoading ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner size="small" />
                <span className="ml-2 text-sm text-gray-600">
                  Kategoriler yükleniyor...
                </span>
              </div>
            ) : categoriesError ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{categoriesError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs text-red-700 underline hover:no-underline"
                >
                  Sayfayı yenile
                </button>
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-sm text-gray-600">
                  Henüz kategori bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category: ICategory) => {
                  const categoryIcon =
                    BUSINESS_CATEGORY_ICONS[category.slug] || '📂'

                  return (
                    <label
                      key={category.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedCategory === category.id}
                        onChange={() => handleCategorySelect(category.id || '')}
                        className="sr-only"
                      />

                      {/* Category Icon */}
                      <div className="text-2xl mr-3">{categoryIcon}</div>

                      {/* Category Info */}
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span
                            className={`text-sm font-medium ${
                              selectedCategory === category.id
                                ? 'text-indigo-700'
                                : 'text-gray-900'
                            }`}
                          >
                            {category.name}
                          </span>
                        </div>

                        {category.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>

                      {/* Radio button visual indicator */}
                      <div
                        className={`w-5 h-5 border-2 rounded-full ml-3 flex items-center justify-center ${
                          selectedCategory === category.id
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedCategory === category.id && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            {errors.mainCategoryId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.mainCategoryId.message}
              </p>
            )}
          </div>
        </div>

        {/* Subcategory Selection Section */}
        {selectedCategory && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Alt Kategoriler (İsteğe Bağlı)
              </label>
              <p className="text-sm text-gray-600 mb-4">
                İşletmenizin faaliyet gösterdiği alt kategorileri seçin.
              </p>

              {subCategoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="small" />
                  <span className="ml-2 text-sm text-gray-600">
                    Alt kategoriler yükleniyor...
                  </span>
                </div>
              ) : subCategoriesError ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">
                    Alt kategoriler yüklenirken hata oluştu.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchSubCategories()}
                    className="mt-2 text-sm text-red-700 underline"
                  >
                    Tekrar dene
                  </button>
                </div>
              ) : !subCategoriesResult?.success ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">
                    {subCategoriesResult?.error ||
                      'Alt kategoriler yüklenemedi.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchSubCategories()}
                    className="mt-2 text-sm text-red-700 underline"
                  >
                    Sayfayı yenile
                  </button>
                </div>
              ) : !subCategoriesResult.data ||
                subCategoriesResult.data.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <p className="text-sm text-gray-600">
                    Bu kategori için alt kategori bulunmuyor.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subCategoriesResult.data.map((subCategory: ICategory) => {
                    const isSelected = selectedSubCategories.includes(
                      subCategory.id || ''
                    )

                    return (
                      <label
                        key={subCategory.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                            : 'border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleSubCategoryToggle(subCategory.id || '')
                          }
                          className="sr-only"
                        />

                        {/* Checkbox visual indicator */}
                        <div
                          className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Subcategory Info */}
                        <div className="flex-1">
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? 'text-indigo-700' : 'text-gray-900'
                            }`}
                          >
                            {subCategory.name}
                          </span>

                          {subCategory.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {subCategory.description}
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}

              {errors.subCategoryIds && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.subCategoryIds.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Personal Information Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Kişisel Bilgiler
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ad"
              {...register('firstName')}
              error={errors.firstName?.message}
              placeholder="Adınızı girin"
            />
            <Input
              label="Soyad"
              {...register('lastName')}
              error={errors.lastName?.message}
              placeholder="Soyadınızı girin"
            />
          </div>

          <Input
            label="E-posta Adresi"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="E-posta adresinizi girin"
          />
        </div>

        {/* Address Information Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {`İşletme Adresi`}
          </h2>
          <div>
            <GoogleAddressAutocomplete
              value={addressText}
              onChange={value => {
                setAddressText(value)
                if (value.trim()) {
                  setHasInteractedWithAddress(true)
                }
              }}
              onPlaceSelect={handlePlaceSelect}
              placeholder="İşletme adresinizi arayın veya haritada konum seçin"
            />
          </div>

          {/* Map */}
          <div>
            <GoogleMapWithMarker
              center={mapCenter}
              markerPosition={markerPosition}
              draggable={true}
              onMarkerDragEnd={handleMarkerDragEnd}
              onAddressChange={handleAddressChangeFromMap}
              height="300px"
              className="rounded-lg overflow-hidden border border-gray-300"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tam konumunuzu ayarlamak için işaretçiyi sürükleyin
            </p>
          </div>

          {/* Simplified Address Details: Only door number editable when sufficient info available */}
          {hasSufficientAddressInfo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapı No *
              </label>
              <Input
                {...register('address.doorNumber')}
                error={errors.address?.doorNumber?.message}
                placeholder="Kapı numaranızı girin"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Adres bilgileri tamamlandıktan sonra kapı numaranızı
                girebilirsiniz
              </p>
            </div>
          )}

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
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Hesap Güvenliği
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Şifre"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={errors.password?.message}
              placeholder="Şifre oluşturun"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  )}
                </button>
              }
            />

            <Input
              label="Şifre Tekrarı"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="Şifrenizi doğrulayın"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  )}
                </button>
              }
            />
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-2">
          <Checkbox
            {...register('acceptTerms')}
            error={errors.acceptTerms?.message}
          />
          <label className="text-sm text-gray-600">
            <Link
              href="/terms?type=business"
              className="text-indigo-600 hover:text-indigo-500"
            >
              İşletme Hizmet Koşulları
            </Link>{' '}
            ve{' '}
            <Link
              href="/privacy?type=business"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Gizlilik Politikası
            </Link>
            'nı kabul ediyorum
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600 mt-1">
            {errors.acceptTerms.message}
          </p>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || isLoading || !isFormValid}
          className="w-full"
        >
          {isSubmitting || isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="small" />
              <span>İşletme Hesabı Oluşturuluyor...</span>
            </div>
          ) : (
            'İşletme Hesabı Oluştur'
          )}
        </Button>

        {/* Helpful message when door number is required but missing */}
        {hasSufficientAddressInfo && !doorNumber && (
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
              Hesap oluşturmak için kapı numaranızı girmeniz gerekiyor
            </p>
          </div>
        )}
      </form>

      {/* Login Link */}
      <p className="mt-6 text-center text-sm text-gray-600">
        Zaten hesabınız var mı?{' '}
        <Link
          href="/login?type=business"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Giriş yap
        </Link>
      </p>
    </div>
  )
}

export default BusinessRegisterForm
