/**
 * Individual Home Component
 * Home page for individual users with dealer discovery features
 */

import AddressFilter from '@/components/filters/AddressFilter'
import GoogleAddressAutocomplete, {
  extractAddressComponents,
  getPlaceCoordinates,
} from '@/components/maps/GoogleAddressAutocomplete'
import GoogleMapWithMarkers from '@/components/maps/GoogleMapWithMarkers'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DEFAULT_MAP_CENTER } from '@/config/maps'
import { useAuth } from '@/contexts/AuthContext'
import { useVideosByLocation } from '@/hooks/useContentQueries'
import { IAddressComponentItem, ICoordinates, IMarkerData } from '@/types/maps'
import { IExtendedAppUser, getExtendedAddress } from '@/types/user'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

const IndividualHome: React.FC = () => {
  const { appUser } = useAuth()
  const extendedUser = appUser as IExtendedAppUser
  const userAddress = getExtendedAddress(extendedUser)
  const [loading, setLoading] = useState(true)

  // Video fetch and client guard
  const { data: videos, isLoading: videosLoading } =
    useVideosByLocation('individual-home')
  const primaryVideo = videos?.find(v => v.isActive) || null
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Map and location states
  const [userLocation, setUserLocation] = useState<ICoordinates | null>(null)
  const [mapCenter, setMapCenter] = useState<ICoordinates>(DEFAULT_MAP_CENTER)
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null)

  // Address search states
  const [addressText, setAddressText] = useState('')
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null)

  // Filter states
  const [availableAddressComponents, setAvailableAddressComponents] = useState<
    IAddressComponentItem[]
  >([])
  const [selectedAddressComponents, setSelectedAddressComponents] = useState<
    IAddressComponentItem[]
  >([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined)
  const [onlyCertifiedDealers, setOnlyCertifiedDealers] = useState(false)

  // View state
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')

  // Mock dealer data - In real app, this would come from service hooks
  const [dealers, setDealers] = useState<IMarkerData[]>([])

  // Initialize user location
  useEffect(() => {
    const initializeLocation = async () => {
      setLoading(true)

      // Try to get user's saved address first
      if (userAddress?.coordinates) {
        setUserLocation(userAddress.coordinates)
        setMapCenter(userAddress.coordinates)

        // Set initial address components from user's address
        const components: IAddressComponentItem[] = []
        if (userAddress.city) {
          components.push({ key: 'city', value: userAddress.city })
        }
        if (userAddress.district) {
          components.push({ key: 'district', value: userAddress.district })
        }
        if (userAddress.neighborhood) {
          components.push({
            key: 'neighborhood',
            value: userAddress.neighborhood,
          })
        }
        if (userAddress.street) {
          components.push({ key: 'street', value: userAddress.street })
        }

        setAvailableAddressComponents(components)
        setAddressText(userAddress.formattedAddress || '')
      }
      // Otherwise try geolocation
      else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            setUserLocation(coords)
            setMapCenter(coords)
          },
          error => {
            console.log('Geolocation error:', error)
          }
        )
      }

      // Load mock dealers - In real app, this would be an API call
      setTimeout(() => {
        setDealers(generateMockDealers())
        setLoading(false)
      }, 1000)
    }

    initializeLocation()
  }, [appUser])

  // Generate mock dealer data
  const generateMockDealers = (): IMarkerData[] => {
    const mockDealers: IMarkerData[] = []
    const baseLocation = userLocation || DEFAULT_MAP_CENTER

    // Generate 10-15 random dealers around the user's location
    const dealerCount = Math.floor(Math.random() * 6) + 10

    for (let i = 0; i < dealerCount; i++) {
      const latOffset = (Math.random() - 0.5) * 0.1
      const lngOffset = (Math.random() - 0.5) * 0.1

      mockDealers.push({
        id: `dealer-${i}`,
        position: {
          lat: baseLocation.lat + latOffset,
          lng: baseLocation.lng + lngOffset,
        },
        title: `Bayi ${i + 1}`,
        info: {
          name: `Elektronik Bayi ${i + 1}`,
          address: `Örnek Mahallesi, ${i + 1}. Sokak No: ${Math.floor(Math.random() * 100)}`,
          phone: `0555 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`,
          category: ['electronics', 'appliances', 'mobile'][
            Math.floor(Math.random() * 3)
          ],
          isCertified: Math.random() > 0.5,
        },
      })
    }

    return mockDealers
  }

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult) => {
      setSelectedPlace(place)
      const components = extractAddressComponents(place)
      const coordinates = getPlaceCoordinates(place)

      if (coordinates) {
        setUserLocation(coordinates)
        setMapCenter(coordinates)
      }

      // Update available address components
      const addressComponents: IAddressComponentItem[] = []
      if (components.city) {
        addressComponents.push({ key: 'city', value: components.city })
      }
      if (components.district) {
        addressComponents.push({ key: 'district', value: components.district })
      }
      if (components.neighborhood) {
        addressComponents.push({
          key: 'neighborhood',
          value: components.neighborhood,
        })
      }
      if (components.street) {
        addressComponents.push({ key: 'street', value: components.street })
      }

      setAvailableAddressComponents(addressComponents)
      setSelectedAddressComponents(
        addressComponents.length > 0 ? [addressComponents[0]] : []
      )
      setAddressText(components.formatted)

      // Refresh dealers based on new location
      setDealers(generateMockDealers())
    },
    [userLocation]
  )

  // Filter dealers based on selected filters
  const filteredDealers = useMemo(() => {
    let filtered = [...dealers]

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(d => d.info?.category === selectedCategoryId)
    }

    // Filter by certified status
    if (onlyCertifiedDealers) {
      filtered = filtered.filter(d => d.info?.isCertified)
    }

    // In real app, address component filtering would be done via API
    // Here we just simulate it

    return filtered
  }, [
    dealers,
    selectedCategoryId,
    onlyCertifiedDealers,
    selectedAddressComponents,
  ])

  // Handle dealer selection
  const handleDealerClick = (dealer: IMarkerData) => {
    setSelectedDealerId(dealer.id)
    setMapCenter(dealer.position)
  }

  // Selected dealer details
  const selectedDealer = useMemo(() => {
    return dealers.find(d => d.id === selectedDealerId)
  }, [dealers, selectedDealerId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Yakınımdaki Bayiler
          </h1>
          <p className="text-gray-600 mt-1">
            Size en yakın yetkili bayileri bulun ve hizmet alın
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="max-w-2xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konum Ara
            </label>
            <GoogleAddressAutocomplete
              value={addressText}
              onChange={setAddressText}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Adres veya konum arayın"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <AddressFilter
              availableComponents={availableAddressComponents}
              selectedComponents={selectedAddressComponents}
              onComponentsChange={setSelectedAddressComponents}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
              onlyCertified={onlyCertifiedDealers}
              onCertifiedChange={setOnlyCertifiedDealers}
            />

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                İstatistikler
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Toplam Bayi:</span>
                  <span className="font-medium">{dealers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Filtrelenen:</span>
                  <span className="font-medium">{filteredDealers.length}</span>
                </div>
                {onlyCertifiedDealers && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Yetkili Bayi:</span>
                    <span className="font-medium text-green-600">
                      {filteredDealers.filter(d => d.info?.isCertified).length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* View Toggle */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'map'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Harita Görünümü
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Liste Görünümü
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  {filteredDealers.length} bayi bulundu
                </span>
              </div>
            </div>

            {/* Map View */}
            {viewMode === 'map' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <GoogleMapWithMarkers
                  center={mapCenter}
                  markers={filteredDealers}
                  userLocation={userLocation}
                  onMarkerClick={handleDealerClick}
                  selectedMarkerId={selectedDealerId}
                  height="600px"
                  showUserLocation={true}
                  fitBounds={false}
                />
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="divide-y divide-gray-200">
                  {filteredDealers.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">
                        Seçili filtrelere uygun bayi bulunamadı
                      </p>
                    </div>
                  ) : (
                    filteredDealers.map(dealer => (
                      <div
                        key={dealer.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedDealerId === dealer.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleDealerClick(dealer)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="font-semibold text-gray-900">
                                {dealer.info?.name || dealer.title}
                              </h3>
                              {dealer.info?.isCertified && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Yetkili
                                </span>
                              )}
                            </div>
                            {dealer.info?.address && (
                              <p className="text-sm text-gray-600 mt-1">
                                {dealer.info.address}
                              </p>
                            )}
                            {dealer.info?.phone && (
                              <p className="text-sm text-gray-600 mt-1">
                                Tel: {dealer.info.phone}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setViewMode('map')
                              handleDealerClick(dealer)
                            }}
                            className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Haritada Göster
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Selected Dealer Details */}
            {selectedDealer && viewMode === 'map' && (
              <div className="bg-white rounded-lg shadow-md p-4 mt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {selectedDealer.info?.name || selectedDealer.title}
                    </h3>
                    {selectedDealer.info?.isCertified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                        ✓ Yetkili Bayi
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedDealerId(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {selectedDealer.info?.address && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Adres:</span>{' '}
                      {selectedDealer.info.address}
                    </p>
                  )}
                  {selectedDealer.info?.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Telefon:</span>{' '}
                      <a
                        href={`tel:${selectedDealer.info.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedDealer.info.phone}
                      </a>
                    </p>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Hizmet Talep Et
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Detayları Gör
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Section */}
      {isClient && (videosLoading || primaryVideo) && (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <div
                className="relative bg-gray-100 rounded-lg overflow-hidden shadow-xl"
                style={{ height: '500px' }}
              >
                {videosLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Video yükleniyor...</span>
                  </div>
                ) : primaryVideo ? (
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${primaryVideo.youtubeVideoId}${primaryVideo.autoStart ? '?autoplay=1' : ''}${primaryVideo.loop ? '&loop=1&playlist=' + primaryVideo.youtubeVideoId : ''}`}
                    title={primaryVideo.title || 'Yardım Videosu'}
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
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p>Henüz video eklenmemiş</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndividualHome
