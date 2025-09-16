import { IAddress } from "../types/map-types";

export class Address implements IAddress {
  street: string;
  doorNumber: string;
  neighborhood: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  formattedAddress?: string | undefined;
  apartment?: string | undefined;
  phone?: string | undefined;
  type?: "home" | "business" | undefined;
  zipCode: string = "";

  constructor(data: IAddress) {
    this.street = data.street;
    this.doorNumber = data.doorNumber || '';
    this.neighborhood = data.neighborhood || '';
    this.district = data.district || '';
    this.city = data.city || '';
    this.state = data.state || '';
    this.postalCode = data.postalCode || '';
    this.country = data.country || '';
    this.coordinates = data.coordinates || { lat: 0, lng: 0 };
  }

}