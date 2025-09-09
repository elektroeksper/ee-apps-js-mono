# Implementation Plan: Home Pages & Address Selection

## Executive Summary
This document outlines the implementation plan for reimplementing differentiated home pages for individual and business accounts, with address selection during setup and Google Maps integration for dealer discovery.

## Key Objectives
1. **Address Selection on Setup**: Implement address selection screens for both account types during profile setup
2. **Individual Home Screen**: Create a map-based dealer discovery interface with filtering
3. **Business Home Screen**: Implement a dashboard with statistics and business-specific features
4. **Google Maps Integration**: Full integration with Places API and Maps for address selection and visualization

## Technical Architecture

### Required Dependencies
```json
{
  "@react-google-maps/api": "^2.19.3",
  "@googlemaps/js-api-loader": "^1.16.6"
}
```

### Environment Variables
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT=41.0082
NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG=28.9784
```

## Implementation Phases

### Phase 1: Core Infrastructure (2-3 days)

#### 1.1 Google Maps Integration
- **File**: `web/src/config/maps.ts`
- Configure Google Maps loader with Places and Marker libraries
- Set up API key management and error handling
- Define default map settings for Turkey

#### 1.2 Type Definitions
- **File**: `web/src/types/maps.ts`
```typescript
interface ICoordinates {
  lat: number;
  lng: number;
}

interface IAddress {
  formattedAddress?: string;
  street?: string;
  doorNumber?: string;
  neighborhood?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: ICoordinates;
  type: 'home' | 'business';
}

interface IMarkerData {
  id: string;
  position: ICoordinates;
  title: string;
  info?: any;
}

enum AddressComponent {
  city = 'administrative_area_level_1',
  district = 'administrative_area_level_2',
  neighborhood = 'sublocality_level_1',
  street = 'route'
}
```

### Phase 2: Reusable Components (3-4 days)

#### 2.1 Google Address Autocomplete
- **File**: `web/src/components/maps/GoogleAddressAutocomplete.tsx`
- Features:
  - Turkish address support with country restriction
  - Shadow DOM manipulation for styling
  - Place selection callback
  - Address component extraction
  - TypeScript support

#### 2.2 Map Components
- **File**: `web/src/components/maps/GoogleMapWithMarker.tsx`
  - Single marker display
  - Draggable marker for location adjustment
  - Reverse geocoding on marker move
  
- **File**: `web/src/components/maps/GoogleMapWithMarkers.tsx`
  - Multiple dealer markers
  - Marker clustering for performance
  - Info windows with dealer details
  - Map bounds adjustment

#### 2.3 Address Filter Component
- **File**: `web/src/components/filters/AddressFilter.tsx`
- Hierarchical address component selection
- Dynamic filtering based on available components
- Category filter for business types
- Certified dealer toggle

### Phase 3: Setup Screens (2-3 days)

#### 3.1 Individual Setup
- **File**: `web/src/components/setup/IndividualSetup.tsx`
- Components:
  - Personal information form
  - Address selection with map
  - Google autocomplete integration
  - Address verification
  - Profile completion tracking

#### 3.2 Business Setup
- **File**: `web/src/components/setup/BusinessSetup.tsx`
- Components:
  - Business information form
  - Business address with map
  - Document upload (tax certificate, photos)
  - Category selection
  - Certification status

### Phase 4: Home Pages Implementation (3-4 days)

#### 4.1 Individual Home
- **File**: `web/src/components/home/IndividualHome.tsx`
- Features:
  - Map view with nearby dealers
  - Address-based filtering UI
  - Category filters
  - Dealer list/grid view toggle
  - Selected dealer details panel
  - Quick actions (request service, view dealers)

#### 4.2 Business Home
- **File**: `web/src/components/home/BusinessHome.tsx`
- Features:
  - Statistics dashboard (total users, orders)
  - Recent activity feed
  - Quick actions (manage services, view requests)
  - Promotional content area
  - Performance metrics

### Phase 5: Service Integration (2 days)

#### 5.1 User Service Hooks
- **File**: `web/src/hooks/useUserFilters.ts`
```typescript
export function useFilterForMarkerData(filter: IAppUserFilter) {
  // Implement Firebase query for filtered users
  // Return marker data for map display
}
```

- **File**: `web/src/hooks/useAddressUpdate.ts`
```typescript
export function useUpdateAddress() {
  // Hook for updating user address
  // Handle geocoding and validation
}
```

#### 5.2 Firebase Integration
- Update Firestore rules for address queries
- Create composite indexes for filtering
- Implement geohashing for proximity queries

### Phase 6: Routing & Navigation (1 day)

#### 6.1 Update Home Page Router
- **File**: `web/src/pages/home.tsx`
```typescript
// Redirect logic based on:
// - Account type (individual/business)
// - Profile completion status
// - Email verification status
```

#### 6.2 Setup Flow Integration
- Add setup screens to routing
- Implement guards for incomplete profiles
- Handle navigation after setup completion

## Component Structure

```
web/src/
├── components/
│   ├── maps/
│   │   ├── GoogleAddressAutocomplete.tsx
│   │   ├── GoogleMapWithMarker.tsx
│   │   └── GoogleMapWithMarkers.tsx
│   ├── filters/
│   │   ├── AddressFilter.tsx
│   │   └── CategoryFilter.tsx
│   ├── setup/
│   │   ├── IndividualSetup.tsx
│   │   ├── BusinessSetup.tsx
│   │   └── SetupProgress.tsx
│   └── home/
│       ├── IndividualHome.tsx
│       ├── BusinessHome.tsx
│       └── DashboardStats.tsx
├── hooks/
│   ├── maps/
│   │   ├── useGoogleMaps.ts
│   │   └── useGeocoding.ts
│   └── filters/
│       ├── useUserFilters.ts
│       └── useAddressFilters.ts
└── types/
    ├── maps.ts
    └── filters.ts
```

## Data Flow

1. **Setup Flow**:
   - User registers → Check profile completion → Redirect to setup
   - Setup form → Address selection → Save to Firestore → Mark complete

2. **Individual Home Flow**:
   - Load user location → Fetch nearby dealers → Display on map
   - Apply filters → Update markers → Show filtered results

3. **Business Home Flow**:
   - Load business data → Fetch statistics → Display dashboard
   - Update metrics periodically → Show activity feed

## Testing Strategy

### Unit Tests
- Address parsing utilities
- Filter logic components
- Geocoding functions

### Integration Tests
- Google Maps API integration
- Address autocomplete flow
- Marker interaction

### E2E Tests
- Complete setup flow
- Address selection and saving
- Filter application and results

## Performance Considerations

1. **Map Optimization**:
   - Lazy load Google Maps script
   - Implement marker clustering for 50+ markers
   - Use viewport-based loading

2. **Data Fetching**:
   - Implement pagination for dealer lists
   - Cache geocoding results
   - Use Firestore composite indexes

3. **Component Optimization**:
   - Memoize filter results
   - Debounce address input
   - Virtual scrolling for large lists

## Migration Strategy

1. **Phase 1**: Implement components in parallel with existing home
2. **Phase 2**: Add feature flag for new home pages
3. **Phase 3**: Gradual rollout to users
4. **Phase 4**: Deprecate old home page

## Timeline

- **Week 1**: Core infrastructure + Google Maps components
- **Week 2**: Setup screens + Service integration
- **Week 3**: Home pages + Testing
- **Total**: 12-14 working days

## Success Metrics

- Address selection completion rate > 90%
- Map load time < 2 seconds
- Filter response time < 500ms
- User engagement increase of 30%

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Google Maps API quota | Implement caching and rate limiting |
| Complex address parsing | Fallback to manual entry |
| Performance on mobile | Progressive loading and optimization |
| Firebase query limits | Implement client-side filtering as backup |

## Next Steps

1. Obtain Google Maps API key with required APIs enabled
2. Set up development environment with API keys
3. Begin Phase 1 implementation
4. Create feature branch for development
5. Set up testing environment
