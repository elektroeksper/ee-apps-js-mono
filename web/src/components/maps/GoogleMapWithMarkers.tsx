/**
 * Google Map with Multiple Markers Component
 * Used for displaying multiple dealer locations with clustering
 */

import {
  DEFAULT_MAP_OPTIONS,
  GOOGLE_MAPS_CONFIG,
  calculateDistance,
} from '@/config/maps'
import { ICoordinates, IMarkerData } from '@/types/maps'
import {
  GoogleMap,
  InfoWindow,
  Marker,
  MarkerClusterer,
  useJsApiLoader,
} from '@react-google-maps/api'
import React, { useCallback, useEffect, useState } from 'react'

interface GoogleMapWithMarkersProps {
  center?: ICoordinates
  zoom?: number
  markers: IMarkerData[]
  userLocation?: ICoordinates | null
  onMarkerClick?: (marker: IMarkerData) => void
  selectedMarkerId?: string | null
  height?: string
  width?: string
  className?: string
  showUserLocation?: boolean
  fitBounds?: boolean
}

const libraries: ('places' | 'marker')[] = ['places', 'marker']

const GoogleMapWithMarkers: React.FC<GoogleMapWithMarkersProps> = ({
  center = GOOGLE_MAPS_CONFIG.defaultCenter,
  zoom = GOOGLE_MAPS_CONFIG.defaultZoom,
  markers = [],
  userLocation,
  onMarkerClick,
  selectedMarkerId,
  height = '600px',
  width = '100%',
  className = '',
  showUserLocation = true,
  fitBounds = true,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.apiKey,
    libraries,
    language: GOOGLE_MAPS_CONFIG.language,
    region: GOOGLE_MAPS_CONFIG.region,
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<IMarkerData | null>(null)
  const [clusterer, setClusterer] = useState<any>(null)

  // Update selected marker when prop changes
  useEffect(() => {
    if (selectedMarkerId) {
      const marker = markers.find(m => m.id === selectedMarkerId)
      if (marker) {
        setSelectedMarker(marker)
        if (map) {
          map.panTo(marker.position)
          map.setZoom(15)
        }
      }
    } else {
      setSelectedMarker(null)
    }
  }, [selectedMarkerId, markers, map])

  // Fit bounds to show all markers
  useEffect(() => {
    if (map && fitBounds && markers.length > 0) {
      const bounds = new google.maps.LatLngBounds()

      markers.forEach(marker => {
        bounds.extend(marker.position)
      })

      if (userLocation && showUserLocation) {
        bounds.extend(userLocation)
      }

      map.fitBounds(bounds)

      // Don't zoom in too much for single marker
      const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
        if (markers.length === 1 && (map.getZoom() || 0) > 15) {
          map.setZoom(15)
        }
      })

      return () => {
        google.maps.event.removeListener(listener)
      }
    }
  }, [map, markers, userLocation, showUserLocation, fitBounds])

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  // Handle map unload
  const onMapUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Handle marker click
  const handleMarkerClick = useCallback(
    (marker: IMarkerData) => {
      setSelectedMarker(marker)
      if (onMarkerClick) {
        onMarkerClick(marker)
      }
      if (map) {
        map.panTo(marker.position)
        map.setZoom(15)
      }
    },
    [onMarkerClick, map]
  )

  // Handle info window close
  const handleInfoWindowClose = useCallback(() => {
    setSelectedMarker(null)
  }, [])

  // Calculate distance from user location
  const getDistanceFromUser = useCallback(
    (position: ICoordinates): string => {
      if (!userLocation) return ''
      const distance = calculateDistance(userLocation, position)
      return distance < 1
        ? `${Math.round(distance * 1000)} m`
        : `${distance.toFixed(1)} km`
    },
    [userLocation]
  )

  // Clusterer options
  const clustererOptions = {
    imagePath:
      'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    gridSize: 60,
    maxZoom: 14,
    minimumClusterSize: 3,
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height, width }}
      >
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500">Harita yükleniyor...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height, width }}
      >
        <div className="text-red-600">Harita yüklenirken hata oluştu</div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={userLocation || center}
        zoom={zoom}
        options={DEFAULT_MAP_OPTIONS}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      >
        {/* User location marker */}
        {showUserLocation && userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4F46E5',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            title="Konumunuz"
          />
        )}

        {/* Dealer markers with clustering */}
        <MarkerClusterer options={clustererOptions} onLoad={setClusterer}>
          {clusterer => (
            <>
              {markers.map(marker => (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  title={marker.title}
                  clusterer={clusterer}
                  onClick={() => handleMarkerClick(marker)}
                  icon={
                    marker.info?.isCertified
                      ? {
                          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                          scaledSize: new google.maps.Size(40, 40),
                        }
                      : undefined
                  }
                />
              ))}
            </>
          )}
        </MarkerClusterer>

        {/* Info window for selected marker */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedMarker.title}
              </h3>

              {selectedMarker.info && (
                <div className="space-y-1 text-sm">
                  {selectedMarker.info.category && (
                    <p className="text-gray-600">
                      <span className="font-medium">Kategori:</span>{' '}
                      {selectedMarker.info.category}
                    </p>
                  )}

                  {selectedMarker.info.address && (
                    <p className="text-gray-600">
                      <span className="font-medium">Adres:</span>{' '}
                      {selectedMarker.info.address}
                    </p>
                  )}

                  {selectedMarker.info.phone && (
                    <p className="text-gray-600">
                      <span className="font-medium">Telefon:</span>{' '}
                      <a
                        href={`tel:${selectedMarker.info.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedMarker.info.phone}
                      </a>
                    </p>
                  )}

                  {userLocation && (
                    <p className="text-gray-600">
                      <span className="font-medium">Mesafe:</span>{' '}
                      {getDistanceFromUser(selectedMarker.position)}
                    </p>
                  )}

                  {selectedMarker.info.isCertified && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Yetkili Bayi
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  if (onMarkerClick) {
                    onMarkerClick(selectedMarker)
                  }
                }}
                className="mt-3 w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Detayları Gör
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map controls overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3">
        <div className="text-sm text-gray-600">
          <p className="font-medium">{markers.length} bayi bulundu</p>
          {userLocation && (
            <p className="text-xs mt-1">Konumunuza göre sıralandı</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GoogleMapWithMarkers
