/**
 * Business-related type definitions
 * Shared across web and functions packages
 */

import { Timestamp } from 'firebase/firestore';
import { BusinessUserRole, BusinessVerificationStatus, CompanySize, DocumentStatus, DocumentType, TaxNumberType } from '../enums';
import { IEntity, IOperationResult } from './common-types';
import { IAddress } from './map-types';

interface IBusinessFilter {
  status?: BusinessVerificationStatus;
  ownerId?: string;
  userIds: string[];
}

interface IBusinessService {
  getAll: (filter?: IBusinessFilter) => Promise<IOperationResult<IBusiness[]>>;
  create: (data: IBusiness) => Promise<IOperationResult<IBusiness>>;
  update: (id: string, data: Partial<IBusiness>) => Promise<IOperationResult<IBusiness>>;
  getById: (id: string) => Promise<IOperationResult<IBusiness>>;
  delete: (id: string) => Promise<IOperationResult<void>>;
  verifyBusiness: (id: string, approve: boolean, adminId: string, reason?: string) => Promise<IOperationResult<void>>;
}

interface IBusinessUserInfo {
  businessId: string; // Reference to the business this user is associated with
  userId: string; // Redundant but useful for iteration
  businessTitle: string; // e.g., Owner, Manager
  displayName: string; // Display name for quick access
  email: string; // Email for quick access
  role: BusinessUserRole; // User's role in this business
  permissions: IBusinessPermissions; // Specific permissions array
  isActive: boolean; // Whether user is active in this business
  addedAt?: Timestamp | Date; // When the user was added
  lastActiveAt?: Timestamp | Date; // Last activity timestamp
}

interface IBusinessDocument {
  type: DocumentType;
  url: string; // Storage URL or public URL
  uploadedAt: Timestamp;
  uploadedBy: string; // User ID who uploaded
  status: DocumentStatus;
  reviewedAt?: Timestamp;
  reviewedBy?: string; // Admin user ID who reviewed
  rejectionReason?: string; // Reason if rejected
  expiresAt?: Timestamp; // Optional expiration date
}


interface IBusinessSetupData {
  subCategoryIds: string[];
  companySize?: CompanySize;
  address?: IAddress;
  phone?: string;
  documents: IBusinessDocument[];
  otherAddresses?: IAddress[];
  website?: string;
}

// Main Business Entity
interface IBusiness extends IEntity {
  businessName: string;
  taxNumber?: string;
  taxOffice?: string;
  taxNumberType?: TaxNumberType;
  identityNumber?: string;
  addresses?: IAddress[];
  phone?: string;
  website?: string;
  companySize?: CompanySize;
  documents?: IBusinessDocument[];
  mainCategoryId?: string;
  subCategoryIds?: string[]; // Business sub-categories
  verification: {
    status: BusinessVerificationStatus;
    history: {
      approvedAt?: Date | Timestamp | null;
      approvedBy?: string | null; // Admin user ID who approved
      rejectedAt?: Date | Timestamp | null;
      rejectedBy?: string | null; // Admin user ID who rejected
      rejectionReason?: string | null;
    }[]
  };

  ownerId: string; // Reference to user who owns the business
  users: Record<string, IBusinessUserInfo>; // Map of userId -> user info for quick access
  isActive: boolean;
}

// Business Invitation Entity (subcollection)
interface IBusinessInvitation extends IEntity {
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


export type {
  IBusiness,
  IBusinessDocument, IBusinessFilter, IBusinessInvitation,
  IBusinessPermissions,
  IBusinessService,
  IBusinessSetupData, IBusinessUserInfo
};

