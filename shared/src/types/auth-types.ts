/**
 * Authentication-related type definitions
 * Shared across web and functions packages
 */

import { AccountType, CompanySize, TaxNumberType } from '../enums';
import { IOperationResult } from './common-types';
import { IAddress } from './map-types';
import { IAppUser } from './user-types';

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
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  accountType: AccountType;
}

// Business Registration Data
interface IBusinessRegisterData extends IRegisterData {
  // Basic Information
  businessName: string;
  userTitle: string;
  companyName: string;
  taxNumber: string;
  taxNumberType: TaxNumberType;
  identityNumber?: string;
  taxOffice: string;

  // Contact & Location
  address: IAddress;
  phone: string;
  email: string;
  website?: string;

  // Business Details
  industry: string;
  companySize: CompanySize;
  mainCategoryId: string;
  subCategoryIds: string[];
  description?: string;

  // Owner (will be set from authenticated user)
  ownerId: string;
}

interface IIndividualSetupData {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: IAddress;
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
  register(data: IRegisterData): Promise<IOperationResult<IFirebaseUser>>;
  logout(): Promise<IOperationResult<void>>;
  loginWithGoogle(): Promise<IOperationResult<IFirebaseUser>>;
  registerWithGoogle(): Promise<IOperationResult<IFirebaseUser>>;
  resetPassword(email: string, url?: string, path?: string): Promise<IOperationResult<void>>;
  changePassword(data: IPasswordChangeData): Promise<IOperationResult<void>>;
  onAuthStateChanged(callback: (user: IFirebaseUser | null) => void): () => void;
  getCurrentUser(): IFirebaseUser | null;
  getIdToken(): Promise<string | null>;
  refreshToken(): Promise<string | null>;
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

  // Roles / permissions (user-level, not business-specific)
  isAdmin: boolean;
  userRoles: string[];
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;

  // Profile completion computed properties
  isProfileComplete: boolean;  // computed profile completion status for all user types

  // Errors
  error: string | null;
  clearError: () => void;

  // User profile operations
  updateUser: (data: Partial<IAppUser>) => Promise<IAppUser | null>; // uid implied from auth state
  refreshUser: () => Promise<void>;
  refreshAuthToken: () => Promise<void>; // forces refresh of auth claims/token

  // Auth actions
  register: (data: IRegisterData | IBusinessRegisterData) => Promise<IOperationResult<IFirebaseUser>>;
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


export type {
  IAuthConfig, IAuthContextType, IAuthError, IAuthService, IAuthValidationSchemas, IBusinessRegisterData, IFirebaseUser,
  IIndividualSetupData, ILoginData, IPasswordChangeData, IPasswordResetData, IRegisterData, IRouteGuard
};

