/**
 * Map and Address related type definitions
 */

export interface ICoordinates {
  lat: number
  lng: number
}

// Extended address interface that includes shared IAddress properties
export interface IAddress {
  // Required from shared types
  street: string
  city: string
  state: string
  zipCode: string
  country: string

  // Additional local properties
  formattedAddress?: string
  doorNumber?: string
  apartment?: string
  neighborhood?: string
  district?: string
  postalCode?: string  // This maps to zipCode
  coordinates?: ICoordinates
  type?: 'home' | 'business'
}

export interface IMarkerData {
  id: string
  position: ICoordinates
  title: string
  info?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    category?: string
    isCertified?: boolean
    [key: string]: any
  }
}

export enum AddressComponent {
  // Turkey specific address components
  city = 'administrative_area_level_1',           // İl (Province/City)
  district = 'administrative_area_level_2',       // İlçe (District)
  neighborhood = 'sublocality_level_1',           // Mahalle (Neighborhood)
  street = 'route',                               // Sokak/Cadde (Street)
  streetNumber = 'street_number',                 // Kapı No (Street Number)
  postalCode = 'postal_code',                     // Posta Kodu (Postal Code)
  country = 'country'                             // Ülke (Country)
}

export interface IAddressComponentItem {
  key: keyof typeof AddressComponent
  value: string
}

export interface IAppUserFilter {
  addressType?: 'business' | 'individual'
  addressComponents?: IAddressComponentItem[]
  businessInfo?: {
    categoriesIds?: string[]
    isCertified?: boolean
  }
}

export interface IGoogleMapsConfig {
  apiKey: string
  defaultCenter: ICoordinates
  defaultZoom: number
  libraries: ('places' | 'marker' | 'geometry' | 'drawing')[]
  language: string
  region: string
}

export interface IPlaceResult extends google.maps.places.PlaceResult {
  // Extended for type safety
}

export interface IMapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface IDealerInfo {
  id: string
  displayName: string
  businessName?: string
  email: string
  phone?: string
  address?: IAddress
  category?: string
  isCertified?: boolean
  rating?: number
  reviewCount?: number
  photoUrl?: string
}
