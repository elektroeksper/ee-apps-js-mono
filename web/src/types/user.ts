/**
 * Extended user types for the web application
 * Business-specific properties are stored in businessInfo map
 */

import { IAppUser } from '@/shared-generated';
import { IAddress } from './maps';

// Business info stored as a map property
export interface IBusinessInfo {
  businessName?: string;
  taxNumber?: string;
  category?: string;
  website?: string;
  description?: string;
  businessAddress?: IAddress; // Business-specific address with extended properties
  hasDocuments?: boolean;
  isCertified?: boolean;
  businessPhone?: string;
  companySize?: string;
  industry?: string;
  isApproved?: boolean; // Admin approval status for business users
  approvedAt?: string; // ISO date string
  approvedBy?: string; // Admin user ID who approved
  rejectedAt?: string; // ISO date string
  rejectedBy?: string; // Admin user ID who rejected
  rejectionReason?: string;
}

// Extended IAppUser with additional UI-specific properties
export interface IExtendedAppUser extends Omit<IAppUser, 'address'> {
  address?: IAddress; // Personal/home address with extended properties
  businessInfo?: IBusinessInfo; // Business-specific info stored as a map
}

// Type guard to check if user is a business user
export function isBusinessUser(user: IAppUser | IExtendedAppUser | null): boolean {
  return user?.accountType === 'business';
}

// Helper to get business name safely
export function getBusinessName(user: IExtendedAppUser | null): string | undefined {
  if (!user || !isBusinessUser(user)) return undefined;
  return user.businessInfo?.businessName;
}

// Helper to get business address safely
export function getBusinessAddress(user: IExtendedAppUser | null): IAddress | undefined {
  if (!user || !isBusinessUser(user)) return undefined;
  return user.businessInfo?.businessAddress;
}

// Helper to safely access extended address properties
export function getExtendedAddress(user: IExtendedAppUser | null): IAddress | undefined {
  if (!user?.address) return undefined;
  return user.address as IAddress;
}
