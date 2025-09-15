import { Timestamp } from "firebase/firestore"
import { AccountType, BusinessUserRole } from "../enums"
import { IBusinessPermissions } from "./business-types"
import { IOperationResult } from "./common-types"
import { IAddress } from "./map-types"

interface IAppUser {
  id: string
  firstName: string
  lastName: string
  displayName: string // Add this
  email: string
  phone?: string
  photoURL?: string // Add this
  accountType: AccountType
  isEmailVerified: boolean
  isPhoneVerified: boolean
  preferences: IUserPreferences // Add this

  // Business Association - Add these
  businessId?: string
  businessRole?: BusinessUserRole
  businessPermissions?: IBusinessPermissions
  joinedBusinessAt?: Date | Timestamp

  // Status fields - Add these
  isActive: boolean
  lastLoginAt?: Date | Timestamp

  // Addresses
  personalAddress?: IAddress // Rename from address for clarity

  // Metadata
  isDeleted: boolean
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  updatedBy?: string // Add for audit trail
}


// User Preferences Interface
interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: INotificationPreferences;
  privacy: IPrivacyPreferences;
}

// Notification Preferences
interface INotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  orderUpdates: boolean;
  securityAlerts: boolean;
}

// Privacy Preferences
interface IPrivacyPreferences {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  allowAnalytics: boolean;
}



interface IUserFilter {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isDeleted?: boolean;
  accountType?: AccountType;
}


// User Service Interface
interface IUserService {
  getAll(filter: IUserFilter): Promise<IOperationResult<IAppUser[]>>;
  getById(uid: string): Promise<IOperationResult<IAppUser>>;
  update(uid: string, data: Partial<IAppUser>): Promise<IOperationResult<IAppUser>>;
  delete(uid: string): Promise<IOperationResult<void>>;
  checkExists(uid: string): Promise<boolean>;
  create(data: any): Promise<IOperationResult<IAppUser>>;
}

type BusinessUser = IAppUser & {
  accountType: AccountType.BUSINESS
  businessId: string
  businessRole: BusinessUserRole
}

export type {
  BusinessUser,
  IAppUser, INotificationPreferences,
  IPrivacyPreferences, IUserFilter, IUserPreferences, IUserService
}

