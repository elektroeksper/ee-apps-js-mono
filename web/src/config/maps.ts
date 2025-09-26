/**
 * Google Maps Configuration
 */

// Default center for Turkey (Istanbul)
export const DEFAULT_MAP_CENTER = {
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT || '41.0082'),
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG || '28.9784'),
}

export const DEFAULT_MAP_ZOOM = 12

export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  defaultCenter: DEFAULT_MAP_CENTER,
  defaultZoom: DEFAULT_MAP_ZOOM,
  libraries: ['places', 'marker'],
  language: 'tr',
  region: 'TR',
}

// Map styles for better visualization
export const MAP_STYLES = [
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
]

// Marker icons
export const MARKER_ICONS = {
  default: '/images/markers/default.png',
  business: '/images/markers/business.png',
  certified: '/images/markers/certified.png',
  selected: '/images/markers/selected.png',
  user: '/images/markers/user.png',
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
  styles: MAP_STYLES,
}

// Autocomplete options for Turkey
export const AUTOCOMPLETE_OPTIONS: google.maps.places.AutocompleteOptions = {
  componentRestrictions: { country: 'tr' },
  fields: [
    'address_components',
    'formatted_address',
    'geometry',
    'name',
    'place_id',
  ],
  types: ['geocode', 'establishment'],
}
