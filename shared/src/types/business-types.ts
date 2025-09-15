/**
 * Business-related type definitions
 * Shared across web and functions packages
 */

import { Timestamp } from 'firebase/firestore';
import { AccountType, BusinessUserRole, BusinessVerificationStatus, CompanySize, DocumentStatus, DocumentType, TaxNumberType } from '../enums';
import { IUserPreferences } from './auth-types';
import { IAddress } from './common-types';

// Base entity for Firestore documents (uses Timestamp instead of Date)
interface IFirestoreEntity {
  id: string;
  isDeleted?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy?: string;
}

// Business Document Interface
interface IBusinessDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: Timestamp;
  status: DocumentStatus;
}

// Business Address Interface (extends IAddress with business-specific fields)
interface IBusinessAddress extends IAddress {
  companyName?: string;
  department?: string;
  floor?: string;
}

// Business User Info - stored in business.users map
interface IBusinessUserInfo {
  userId: string; // Redundant but useful for iteration
  userName: string; // Display name for quick access
  email: string; // Email for quick access
  role: BusinessUserRole; // User's role in this business
  permissions: string[]; // Specific permissions array
  isActive: boolean; // Whether user is active in this business
  joinedAt: Timestamp; // When user joined the business
  lastActiveAt?: Timestamp; // Last activity timestamp
}

// Main Business Entity
interface IBusiness extends IFirestoreEntity {
  // Basic Business Information
  companyName: string;
  taxNumber: string;
  taxNumberType: TaxNumberType;
  identityNumber?: string; // For individual business owners
  taxOffice: string;

  // Contact & Location
  address: IBusinessAddress;
  phone: string;
  email: string; // Business primary email
  website?: string;

  // Business Details
  industry: string;
  companySize: CompanySize;
  mainCategoryId: string;
  subCategoryIds: string[];
  description?: string;

  // Verification & Compliance
  verificationStatus: BusinessVerificationStatus;
  documents: IBusinessDocument[];
  isApproved: boolean;
  approvedAt?: Timestamp;
  approvedBy?: string; // Admin user ID
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;

  // Ownership & Team
  ownerId: string; // Reference to user who owns the business
  users: Record<string, IBusinessUserInfo>; // Map of userId -> user info for quick access

  // Status
  isActive: boolean;
}

// Business Invitation Entity (subcollection)
interface IBusinessInvitation extends IFirestoreEntity {
  // Invitation Details
  invitedEmail: string;
  invitedRole: BusinessUserRole;
  invitedBy: string; // User ID of who sent invitation

  // Invitation Content
  message?: string; // Optional personal message
  token: string; // Secure invitation token for acceptance

  // Status & Workflow
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'pending_approval';

  // Approval Process (for non-owner invitations)
  requiresApproval: boolean; // True if invited by non-owner
  approvedBy?: string; // Admin user ID who approved (if applicable)
  approvedAt?: Timestamp; // When invitation was approved

  // Additional Timestamps
  expiresAt: Timestamp; // Invitations expire after 7 days
  respondedAt?: Timestamp; // When user accepted/declined
}

// Business Permissions Interface
interface IBusinessPermissions {
  // Business Management
  canEditBusinessInfo: boolean;
  canDeleteBusiness: boolean;
  canManageDocuments: boolean;

  // User Management & Invitations
  canInviteUsers: boolean;
  canApproveInvitations: boolean;
  canRemoveUsers: boolean;
  canChangeUserRoles: boolean;

  // Invitation Restrictions
  canInviteOwners: boolean;
  canInviteManagers: boolean;
  canInviteTechnicians: boolean;
  canInviteSupport: boolean;

  // Operations
  canViewOrders: boolean;
  canManageOrders: boolean;
  canViewAnalytics: boolean;
  canManageInventory: boolean;

  // Financial
  canViewFinancials: boolean;
  canManagePayments: boolean;
}

// Business Creation Data
interface IBusinessCreateData {
  // Basic Information
  companyName: string;
  taxNumber: string;
  taxNumberType: TaxNumberType;
  identityNumber?: string;
  taxOffice: string;

  // Contact & Location
  address: IBusinessAddress;
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

// User with Business Information
interface IUserWithBusiness {
  user: IAppUser;
  business?: IBusiness;
  businessRole?: BusinessUserRole;
  businessPermissions?: IBusinessPermissions;
}

// Business Registration Data (extends user registration)
interface IBusinessRegistrationData {
  // User data
  firstName: string;
  lastName: string;
  email: string;
  password: string;

  // Business data
  companyName: string;
  taxNumber: string;
  taxNumberType: TaxNumberType;
  identityNumber?: string;
  taxOffice: string;
  address: IBusinessAddress;
  phone: string;
  website?: string;
  industry: string;
  companySize: CompanySize;
  mainCategoryId: string;
  subCategoryIds: string[];
  description?: string;
}

// Enhanced IAppUser for business architecture (this will replace the one in auth-types.ts)
interface IAppUser extends IFirestoreEntity {
  // Personal Information
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  personalAddress?: IAddress; // Personal/home address

  // Account Details
  accountType: AccountType;
  isEmailVerified: boolean;
  preferences: IUserPreferences;

  // Business Association (One-to-One Constraint)
  businessId?: string; // Reference to business (null for individual users)
  businessRole?: BusinessUserRole; // OWNER | MANAGER | TECHNICIAN | SUPPORT
  businessPermissions?: string[]; // Granular permissions array
  joinedBusinessAt?: Timestamp;

  // Status
  isActive: boolean;
  lastLoginAt?: Timestamp;
}

export type {
  IAppUser, IBusiness,
  IBusinessAddress,
  IBusinessCreateData,
  IBusinessDocument,
  IBusinessInvitation,
  IBusinessPermissions,
  IBusinessRegistrationData,
  IBusinessUserInfo,
  IFirestoreEntity,
  IUserWithBusiness
};

