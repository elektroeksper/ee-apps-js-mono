/**
 * Authentication-related type definitions
 * Shared across web and functions packages
 */

import { AccountType, AuthRole, BusinessVerificationStatus, CompanySize, DocumentStatus, DocumentType } from '../enums';
import { IAddress, IEntity, IOperationResult } from './common-types';

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
  firstName: string;
  lastName: string;
  accountType: AccountType;
  phone?: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}

// Business Registration Data
interface IBusinessRegisterData extends IRegisterData {
  companyName: string;
  taxNumber?: string;
  businessAddress?: IAddress;
  businessPhone?: string;
  website?: string;
  industry?: string;
  companySize?: CompanySize;
}

interface IAppUser extends IEntity {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  accountType: AccountType;
  roles: AuthRole[]; // Legacy enum roles for compatibility
  rolesList?: string[]; // New string-based roles array (synced from Firebase Auth claims)
  isEmailVerified: boolean;
  preferences: IUserPreferences;
  address?: IAddress;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Business Profile Interface
interface IBusinessProfile extends IAppUser {
  companyName: string;
  taxNumber?: string;
  businessAddress?: IAddress;
  businessPhone?: string;
  website?: string;
  industry?: string;
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

// Business Document Interface
interface IBusinessDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: string; // ISO date string
  status: DocumentStatus;
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

  // Loading flags
  isLoading: boolean;          // union loading (auth || user)
  isAuthLoading: boolean;      // firebase auth listener/loading
  isUserLoading: boolean;      // user document/profile loading

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
  allowedRoles?: AuthRole[];
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

export type {
  IAppUser, IAuthConfig, IAuthContextType, IAuthError, IAuthService, IAuthValidationSchemas, IBusinessDocument, IBusinessProfile, IBusinessRegisterData, IFirebaseUser,
  ILoginData, INotificationPreferences, IPasswordChangeData, IPasswordResetData, IPrivacyPreferences, IRegisterData, IRouteGuard, IUserFilter, IUserPreferences, IUserService
};

