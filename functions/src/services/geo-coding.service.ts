import https from 'node:https';
import { URL } from 'node:url';
import { IAddressInfo, IOperationResult } from '../shared-generated';

class GeocodingService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (!this.apiKey) {
      console.warn('[GeocodingService] Google Maps API key not set (MAPS_API_KEY or GOOGLE_MAPS_API_KEY). Geocoding calls will fail until configured.');
    }
  }

  private async fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestUrl = new URL(url);
      https
        .get(requestUrl, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        })
        .on('error', (err) => reject(err));
    });
  }

  private extractAddressComponents(
    addressComponents: any[]
  ): Partial<IAddressInfo> {
    const info: Partial<IAddressInfo> = {};

    for (const component of addressComponents) {
      const types = component.types;

      if (types.includes('country')) {
        info.country = component.long_name;
      } else if (
        types.includes('administrative_area_level_1') ||
        types.includes('locality')
      ) {
        // City can be in locality or administrative_area_level_1
        if (!info.city) {
          info.city = component.long_name;
        }
      } else if (
        types.includes('sublocality') ||
        types.includes('administrative_area_level_2')
      ) {
        // District can be in sublocality or administrative_area_level_2
        info.district = component.long_name;
      } else if (types.includes('route')) {
        // Street name
        info.street = component.long_name;
      } else if (types.includes('street_number')) {
        // Street number - append to street if exists
        if (info.street) {
          info.street = `${component.long_name} ${info.street}`;
        } else {
          info.street = component.long_name;
        }
      }
    }

    return info;
  }

  decodeAddressByLocation = async (
    lat: number,
    lng: number
  ): Promise<IOperationResult<IAddressInfo | null>> => {
    try {
      if (!this.apiKey) {
        return { success: false, data: null, error: 'Geocoding service not configured (missing API key)' };
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      const result = await this.fetchJson(url);

      if (result.results && result.results.length > 0) {
        const firstResult = result.results[0];
        const addressComponents = this.extractAddressComponents(
          firstResult.address_components
        );

        const addressInfo: IAddressInfo = {
          ...addressComponents,
          formattedAddress: firstResult.formatted_address,
        };

        console.log('Reverse geocoding successful:', addressInfo);
        return {
          success: true,
          data: addressInfo,
        };
      }

      return {
        success: false,
        data: null,
        error: 'No results found',
      };
    } catch (error: any) {
      console.error('Error decoding address by location:', error);

      // More specific error handling
      if (error.response?.status === 403) {
        return {
          success: false,
          data: null,
          error:
            'API key lacks permission for Geocoding API or has restrictions',
        };
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  geocodeAddress = async (
    address: string
  ): Promise<
    IOperationResult<{
      lat: number;
      lng: number;
      addressInfo: IAddressInfo;
    } | null>
  > => {
    try {
      if (!this.apiKey) {
        return { success: false, data: null, error: 'Geocoding service not configured (missing API key)' };
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      const result = await this.fetchJson(url);

      if (result.results && result.results.length > 0) {
        const firstResult = result.results[0];
        const location = firstResult.geometry.location;
        const addressComponents = this.extractAddressComponents(
          firstResult.address_components
        );

        const addressInfo: IAddressInfo = {
          ...addressComponents,
          formattedAddress: firstResult.formatted_address,
        };

        return {
          success: true,
          data: {
            lat: location.lat,
            lng: location.lng,
            addressInfo,
          },
        };
      }

      return {
        success: false,
        data: null,
        error: 'No results found',
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}

export const geocodingService = new GeocodingService();
