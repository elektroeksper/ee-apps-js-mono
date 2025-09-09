/**
 * Google Maps Configuration
 */

import { IGoogleMapsConfig } from '@/types/maps'

// Default center for Turkey (Istanbul)
export const DEFAULT_MAP_CENTER = {
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT || '41.0082'),
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG || '28.9784')
}

export const DEFAULT_MAP_ZOOM = 12

export const GOOGLE_MAPS_CONFIG: IGoogleMapsConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  defaultCenter: DEFAULT_MAP_CENTER,
  defaultZoom: DEFAULT_MAP_ZOOM,
  libraries: ['places', 'marker'],
  language: 'tr',
  region: 'TR'
}

// Map styles for better visualization
export const MAP_STYLES = [
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  }
]

// Marker icons
export const MARKER_ICONS = {
  default: '/images/markers/default.png',
  business: '/images/markers/business.png',
  certified: '/images/markers/certified.png',
  selected: '/images/markers/selected.png',
  user: '/images/markers/user.png'
}

// Map options
export const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
  zoom: DEFAULT_MAP_ZOOM,
  center: DEFAULT_MAP_CENTER,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  styles: MAP_STYLES
}

// Autocomplete options for Turkey
export const AUTOCOMPLETE_OPTIONS: google.maps.places.AutocompleteOptions = {
  componentRestrictions: { country: 'tr' },
  fields: [
    'address_components',
    'formatted_address',
    'geometry',
    'name',
    'place_id'
  ],
  types: ['geocode', 'establishment']
}

// Categories for business filtering
export const BUSINESS_CATEGORIES = [
  { id: 'electronics', label: 'Elektronik', icon: '🔌' },
  { id: 'appliances', label: 'Beyaz Eşya', icon: '🏠' },
  { id: 'mobile', label: 'Telefon & Tablet', icon: '📱' },
  { id: 'computer', label: 'Bilgisayar', icon: '💻' },
  { id: 'tv', label: 'TV & Ses Sistemleri', icon: '📺' },
  { id: 'other', label: 'Diğer', icon: '📦' }
]

// Helper to check if Maps API is loaded
export const isMapsApiLoaded = (): boolean => {
  return typeof google !== 'undefined' && 
         typeof google.maps !== 'undefined'
}

// Helper to format coordinates for display
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

// Helper to calculate distance between two points (in km)
export const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLon = (point2.lng - point1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
