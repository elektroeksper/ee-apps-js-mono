/**
 * Authentication-related type definitions
 * Shared across web and functions packages
 */

import { AccountType, BusinessUserRole, BusinessVerificationStatus, CompanySize, TaxNumberType } from '../enums';
import { IAppUser, IBusiness, IBusinessDocument } from './business-types';
import { IAddress, IOperationResult } from './common-types';

// Base Operation Result Interface

// Generic Firebase User type
interface IFirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  providerId: string;
  disabled?: boolean;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  customClaims?: Record<string, any>;
}

// Login Data Interface
interface ILoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Registration Data Interface
interface IRegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  accountType: AccountType;
}

// Business Registration Data
interface IBusinessRegisterData extends IRegisterData {
  companyName: string;
  title?: string;
  firstName: string;
  lastName: string;
  taxNumber?: string;
  address?: IAddress;
  mainCategoryId: string; // New field for main category selection
}

interface IBusinessSetupData {
  subCategoryIds: string[];
  companySize?: CompanySize;
  address?: IAddress;
  phone?: string;
  documents: IBusinessDocument[];
  otherAddresses?: IAddress[];
  website?: string;
  contactInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

interface IIndividualSetupData {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: IAddress;
}

interface IBusinessInfo {
  name: string;
  taxNumber?: string;
  taxNumberType?: TaxNumberType;
  identityNumber?: string;
  address?: IAddress[];
  phone?: string;
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  website?: string;
  industry?: string;
  companySize?: CompanySize;
  mainCategoryId: string; //
  subCategoryIds?: string[];
  rejectionReason?: string;
  documents: IBusinessDocument[];
  verification: {
    status: BusinessVerificationStatus;
    history: {
      approvedAt?: Date;
      approvedBy?: string; // Admin user ID who approved
      rejectedAt?: Date;
      rejectedBy?: string; // Admin user ID who rejected
      rejectionReason?: string;
    },
    lastUpdatedAt: Date;
  }[];
}

// Business Profile Interface
interface IBusinessProfile extends IAppUser {
  companyName: string;
  taxNumber?: string;
  taxNumberType?: TaxNumberType;
  identityNumber?: string;
  address?: IAddress;
  phone?: string;
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  website?: string;
  companySize?: CompanySize;
  documents?: IBusinessDocument[];
  verificationStatus: BusinessVerificationStatus;
  isApproved?: boolean; // Admin approval status for business users
  approvedAt?: Date;
  approvedBy?: string; // Admin user ID who approved
  rejectedAt?: Date;
  rejectedBy?: string; // Admin user ID who rejected
  rejectionReason?: string;
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

// Password Reset Data
interface IPasswordResetData {
  email: string;
}

// Password Change Data
interface IPasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}


// Auth Service Interface
interface IAuthService {
  login(data: ILoginData): Promise<IOperationResult<IFirebaseUser>>;
  register(data: IRegisterData | IBusinessRegisterData): Promise<IOperationResult<IFirebaseUser>>;
  logout(): Promise<IOperationResult<void>>;
  loginWithGoogle(): Promise<IOperationResult<IFirebaseUser>>;
  registerWithGoogle(): Promise<IOperationResult<IFirebaseUser>>;
  resetPassword(email: string): Promise<IOperationResult<void>>;
  changePassword(data: IPasswordChangeData): Promise<IOperationResult<void>>;
  onAuthStateChanged(callback: (user: IFirebaseUser | null) => void): () => void;
  getCurrentUser(): IFirebaseUser | null;
  getIdToken(): Promise<string | null>;
  refreshToken(): Promise<string | null>;
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
  // Hook to use auth context
  getAll(filter: IUserFilter): Promise<IOperationResult<IAppUser[]>>;
  getById(uid: string): Promise<IOperationResult<IAppUser>>;
  update(uid: string, data: Partial<IAppUser>): Promise<IOperationResult<IAppUser>>;
  delete(uid: string): Promise<IOperationResult<void>>;
  checkExists(uid: string): Promise<boolean>;
  create(data: Partial<IRegisterData | IBusinessRegisterData>): Promise<IOperationResult<IAppUser>>;
}


// Auth Context Type
interface IAuthContextType {
  // Core identities
  fireUser: IFirebaseUser | null;
  appUser: IAppUser | null;

  // Business information (when user belongs to a business)
  business: IBusiness | null;
  businessRole: BusinessUserRole | null;
  businessPermissions: string[];

  // Business permission helpers
  hasBusinessPermission: (permission: string) => boolean;
  canEditBusiness: boolean;
  canInviteUsers: boolean;
  canManageUsers: boolean;
  canViewOrders: boolean;
  canManageOrders: boolean;

  // Loading flags
  isLoading: boolean;          // union loading (auth || user)
  isAuthLoading: boolean;      // firebase auth listener/loading
  isUserLoading: boolean;      // user document/profile loading
  isBusinessLoading: boolean;  // business data loading

  // Roles / permissions
  isAdmin: boolean;
  userRoles: string[];
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;

  // Business document computed properties
  hasDocuments: boolean;       // computed from documents array
  isProfileComplete: boolean;  // computed profile completion status for all user types

  // Errors
  error: string | null;
  clearError: () => void;

  // User profile operations
  updateUser: (data: Partial<IAppUser>) => Promise<IAppUser | null>; // uid implied from auth state
  refreshUser: () => Promise<void>;
  refreshAuthToken: () => Promise<void>; // forces refresh of auth claims/token

  // Business operations
  refreshBusiness: () => Promise<void>;
  leaveBusiness: () => Promise<{ success: boolean; error?: string }>;
  acceptBusinessInvitation: (token: string) => Promise<{ success: boolean; error?: string }>;

  // Auth actions
  register: (data: IRegisterData | IBusinessRegisterData) => Promise<{ success: boolean; error?: string }>;
  login: (data: ILoginData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendEmailVerification: () => Promise<{ success: boolean; error?: string }>;
}



// Auth Error Types
interface IAuthError {
  code: string;
  message: string;
  details?: string;
}

// Form Validation Schemas
interface IAuthValidationSchemas {
  login: any;
  register: any;
  businessRegister: any;
  passwordReset: any;
  passwordChange: any;
  profileUpdate: any;
}

// Auth Route Guards
interface IRouteGuard {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireEmailVerification?: boolean;
  requireProfileComplete?: boolean;
  allowedAccountTypes?: AccountType[];
  redirectTo?: string;
}

// Auth Configuration
interface IAuthConfig {
  enableGoogleAuth: boolean;
  enableEmailVerification: boolean;
  requireEmailVerification: boolean;
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number;
  rememberMeDuration: number;
}

interface IBusinessRegisterFormData extends IRegisterData {
  companyName: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: {
    street: string;
    doorNumber: string;
    neighborhood?: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  phone?: string;
  website?: string;
  industry?: string;
  companySize?: CompanySize;
  mainCategoryId: string; // New field for main category selection
}

export type {
  IAuthConfig, IAuthContextType, IAuthError, IAuthService, IAuthValidationSchemas, IBusinessInfo, IBusinessProfile, IBusinessRegisterData, IBusinessRegisterFormData, IFirebaseUser,
  ILoginData, INotificationPreferences, IPasswordChangeData, IPasswordResetData, IPrivacyPreferences, IRegisterData, IRouteGuard, IUserFilter, IUserPreferences, IUserService
};

