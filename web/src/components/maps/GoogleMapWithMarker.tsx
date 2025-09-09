/**
 * Google Map with Single Marker Component
 * Used for displaying and selecting a single location
 */

import { DEFAULT_MAP_OPTIONS, GOOGLE_MAPS_CONFIG } from '@/config/maps'
import { ICoordinates } from '@/types/maps'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import React, { useCallback, useEffect, useRef, useState } from 'react'

interface GoogleMapWithMarkerProps {
  center?: ICoordinates
  zoom?: number
  markerPosition?: ICoordinates
  draggable?: boolean
  onMarkerDragEnd?: (position: ICoordinates) => void
  onAddressChange?: (place: google.maps.places.PlaceResult | null) => void
  height?: string
  width?: string
  className?: string
}

const libraries: ('places' | 'marker')[] = ['places', 'marker']

const GoogleMapWithMarker: React.FC<GoogleMapWithMarkerProps> = ({
  center = GOOGLE_MAPS_CONFIG.defaultCenter,
  zoom = GOOGLE_MAPS_CONFIG.defaultZoom,
  markerPosition,
  draggable = false,
  onMarkerDragEnd,
  onAddressChange,
  height = '400px',
  width = '100%',
  className = ''
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.apiKey,
    libraries,
    language: GOOGLE_MAPS_CONFIG.language,
    region: GOOGLE_MAPS_CONFIG.region
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [currentPosition, setCurrentPosition] = useState<ICoordinates | null>(
    markerPosition || null
  )
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  // Initialize geocoder
  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder()
    }
  }, [isLoaded])

  // Update marker position when prop changes
  useEffect(() => {
    if (markerPosition) {
      setCurrentPosition(markerPosition)
      if (map && markerPosition) {
        map.panTo(markerPosition)
      }
    }
  }, [markerPosition, map])

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  // Handle map unload
  const onMapUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Handle marker load
  const onMarkerLoad = useCallback((markerInstance: google.maps.Marker) => {
    setMarker(markerInstance)
  }, [])

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return

      const newPosition: ICoordinates = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      }

      setCurrentPosition(newPosition)
      
      if (onMarkerDragEnd) {
        onMarkerDragEnd(newPosition)
      }

      // Reverse geocode to get address
      if (onAddressChange && geocoderRef.current) {
        geocoderRef.current.geocode(
          { location: newPosition },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              onAddressChange(results[0])
            } else {
              onAddressChange(null)
            }
          }
        )
      }
    },
    [onMarkerDragEnd, onAddressChange]
  )

  // Handle map click to place marker
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng || !draggable) return

      const newPosition: ICoordinates = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      }

      setCurrentPosition(newPosition)
      
      if (onMarkerDragEnd) {
        onMarkerDragEnd(newPosition)
      }

      // Reverse geocode to get address
      if (onAddressChange && geocoderRef.current) {
        geocoderRef.current.geocode(
          { location: newPosition },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              onAddressChange(results[0])
            } else {
              onAddressChange(null)
            }
          }
        )
      }
    },
    [draggable, onMarkerDragEnd, onAddressChange]
  )

  // Loading state
  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height, width }}
      >
        <div className="text-gray-500">Harita yükleniyor...</div>
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
        <div className="text-red-600">
          Harita yüklenirken hata oluştu
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={{ height, width }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        options={DEFAULT_MAP_OPTIONS}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        onClick={handleMapClick}
      >
        {currentPosition && (
          <Marker
            position={currentPosition}
            draggable={draggable}
            onLoad={onMarkerLoad}
            onDragEnd={handleMarkerDragEnd}
            animation={google.maps.Animation.DROP}
          />
        )}
      </GoogleMap>
    </div>
  )
}

export default GoogleMapWithMarker
