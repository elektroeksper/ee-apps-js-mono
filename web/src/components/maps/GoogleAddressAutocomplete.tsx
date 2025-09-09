/**
 * Google Address Autocomplete Component
 * Provides address autocomplete functionality with Turkish address support
 */

import { GOOGLE_MAPS_CONFIG } from '@/config/maps'
import { AddressComponent } from '@/types/maps'
import { useJsApiLoader } from '@react-google-maps/api'
import React, { useEffect, useRef } from 'react'

interface GoogleAddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

const GoogleAddressAutocomplete: React.FC<GoogleAddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Adresinizi girin',
  className = '',
  id = 'address-autocomplete',
  disabled = false,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.apiKey,
    libraries: GOOGLE_MAPS_CONFIG.libraries,
    language: GOOGLE_MAPS_CONFIG.language,
    region: GOOGLE_MAPS_CONFIG.region,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Keep latest callbacks in refs to avoid recreating autocomplete
  const onChangeRef = useRef(onChange)
  const onPlaceSelectRef = useRef(onPlaceSelect)

  useEffect(() => {
    onChangeRef.current = onChange
    onPlaceSelectRef.current = onPlaceSelect
  }, [onChange, onPlaceSelect])

  // Initialize autocomplete when Google Maps loads
  useEffect(() => {
    if (!isLoaded || !containerRef.current || disabled) return

    let autocompleteInstance: google.maps.places.Autocomplete | null = null
    let inputElement: HTMLInputElement | null = null

    const initializeAutocomplete = async () => {
      try {
        console.log('🗺️ Initializing traditional Autocomplete...')

        // Create input element
        inputElement = document.createElement('input')
        inputElement.type = 'text'
        inputElement.placeholder = placeholder
        inputElement.value = value
        inputElement.className = `w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`
        inputElement.id = id

        // Clear container and append input
        containerRef.current!.innerHTML = ''
        containerRef.current!.appendChild(inputElement)

        // Initialize autocomplete
        autocompleteInstance = new google.maps.places.Autocomplete(
          inputElement,
          {
            componentRestrictions: { country: 'tr' },
            types: ['geocode', 'establishment'],
            fields: [
              'formatted_address',
              'geometry',
              'address_components',
              'name',
              'place_id',
            ],
          }
        )

        console.log('🗺️ Autocomplete instance created')

        // Listen for place selection
        autocompleteInstance.addListener('place_changed', () => {
          console.log('🗺️ PLACE_CHANGED EVENT TRIGGERED!')
          const place = autocompleteInstance!.getPlace()

          if (!place || !place.geometry) {
            console.log('🗺️ No place or geometry found')
            return
          }

          console.log('🗺️ Place selected:', place)
          console.log('🗺️ Address components:', place.address_components)

          // Update value and trigger callback
          onChangeRef.current(place.formatted_address || '')
          onPlaceSelectRef.current(place)
          console.log('🗺️ Place selection completed')
        })

        // Listen for input changes
        inputElement.addEventListener('input', e => {
          const target = e.target as HTMLInputElement
          onChangeRef.current(target.value)
        })

        console.log('🗺️ Event listeners attached')
      } catch (error) {
        console.error('🗺️ Error initializing autocomplete:', error)
      }
    }

    initializeAutocomplete()

    // Cleanup
    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance)
      }
      if (inputElement) {
        inputElement.remove()
      }
    }
  }, [isLoaded, placeholder, className, id, disabled])

  // Sync prop value to input
  useEffect(() => {
    const inputElement = containerRef.current?.querySelector('input')
    if (inputElement && inputElement.value !== value) {
      inputElement.value = value
    }
  }, [value])

  // Loading state
  if (!isLoaded) {
    return (
      <input
        type="text"
        disabled
        placeholder="Harita yükleniyor..."
        value={value}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm 
          bg-gray-50 cursor-not-allowed ${className}`}
      />
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className="text-red-600 text-sm">
        Harita yüklenirken hata oluştu. Lütfen API anahtarınızı kontrol edin.
      </div>
    )
  }

  // Disabled state
  if (disabled) {
    return (
      <input
        type="text"
        disabled
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm 
          bg-gray-50 cursor-not-allowed ${className}`}
      />
    )
  }

  // Render container for the autocomplete element
  return <div ref={containerRef} className="w-full" />
}

export default GoogleAddressAutocomplete

// Helper function to extract address components
export const extractAddressComponents = (
  place: google.maps.places.PlaceResult
) => {
  const components = place.address_components || []

  const getComponent = (type: string) => {
    const comp = components.find(c => c.types.includes(type))
    return comp?.long_name || ''
  }

  // Special handling for Turkish addresses
  const getComponentWithFallback = (primary: string, fallback?: string) => {
    let result = getComponent(primary)
    if (!result && fallback) {
      result = getComponent(fallback)
    }
    return result
  }

  // For Turkish addresses, sometimes the city might be in different administrative levels
  const city =
    getComponentWithFallback('administrative_area_level_1', 'locality') ||
    getComponentWithFallback('locality', 'administrative_area_level_2')

  const district =
    getComponentWithFallback(
      'administrative_area_level_2',
      'administrative_area_level_3'
    ) || getComponentWithFallback('sublocality_level_2', 'sublocality')

  const neighborhood =
    getComponentWithFallback('sublocality_level_1', 'sublocality') ||
    getComponentWithFallback('sublocality', 'neighborhood') ||
    getComponentWithFallback('political', '') // Sometimes neighborhood is marked as political

  console.log('🗺️ Address component extraction DEBUG:', {
    raw_components: components.map(c => ({
      types: c.types,
      long_name: c.long_name,
      short_name: c.short_name,
    })),
    neighborhood_candidates: {
      sublocality_level_1: getComponent('sublocality_level_1'),
      sublocality: getComponent('sublocality'),
      neighborhood: getComponent('neighborhood'),
      political: components
        .filter(c => c.types.includes('political'))
        .map(c => c.long_name),
    },
    extracted: {
      street: getComponent(AddressComponent.street),
      streetNumber: getComponent(AddressComponent.streetNumber),
      neighborhood,
      district,
      city,
      postalCode: getComponent(AddressComponent.postalCode),
      country: getComponent(AddressComponent.country),
      formatted: place.formatted_address,
    },
  })

  return {
    street: getComponent(AddressComponent.street),
    streetNumber: getComponent(AddressComponent.streetNumber),
    neighborhood,
    district,
    city,
    postalCode: getComponent(AddressComponent.postalCode),
    country: getComponent(AddressComponent.country),
    formatted: place.formatted_address || '',
  }
}

// Helper to get coordinates from place
export const getPlaceCoordinates = (
  place: google.maps.places.PlaceResult
): { lat: number; lng: number } | null => {
  if (!place.geometry?.location) return null

  const location = place.geometry.location
  return {
    lat:
      typeof location.lat === 'function'
        ? location.lat()
        : (location.lat as unknown as number),
    lng:
      typeof location.lng === 'function'
        ? location.lng()
        : (location.lng as unknown as number),
  }
}
