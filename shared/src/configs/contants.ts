import { BusinessUserRole } from "../enums";
import { IBusinessPermissions, SystemSettingsKey } from "../types";

export const FB_FUNCTIONS: {
  [key: string]: string;
} = {
  getUserClaims: "getUserClaims",
  addUserClaims: "addUserClaims",
  removeUserClaims: "removeUserClaims",
  approveBusinessAccount: "approveBusinessAccount",
  rejectBusinessAccount: "rejectBusinessAccount",
  updateBusinessProfile: "updateBusinessProfile",
  updateUserProfile: "updateUserProfile",
};

export const FB_COLL_NAMES = {
  settings: "settings",
  users: "users",
  orders: "orders",
  services: "services",
  businesses: "businesses",
  products: "products",
  categories: "categories",
  reviews: "reviews",
  messages: "messages",
  notifications: "notifications",
  logs: "logs",
}

export const ACTIVE_SETTINGS: {
  [key in SystemSettingsKey]: string;
} = {
  emailNotifications: "emailNotifications",
  maintenanceMode: "maintenanceMode",
  userRegistration: "userRegistration",
  emailVerificationRequired: "emailVerificationRequired",
  businessAccountApproval: "businessAccountApproval",
  autoBackup: "autoBackup",
  analyticsEnabled: "analyticsEnabled",
  sessionTimeout: "sessionTimeout",
  maxFileSize: "maxFileSize",
  allowedFileTypes: "allowedFileTypes"
};

export const BUSINESS_CATEGORIES = [
  { id: 'electronics', label: 'Elektronik', icon: '🔌' },
  { id: 'appliances', label: 'Beyaz Eşya', icon: '🏠' },
  { id: 'mobile', label: 'Telefon & Tablet', icon: '📱' },
  { id: 'computer', label: 'Bilgisayar', icon: '💻' },
  { id: 'tv', label: 'TV & Ses Sistemleri', icon: '📺' },
  { id: 'other', label: 'Diğer', icon: '📦' }
]

export const ROLE_PERMISSIONS: Record<BusinessUserRole, IBusinessPermissions> = {
  [BusinessUserRole.OWNER]: {
    canEditBusinessInfo: true,
    canDeleteBusiness: true,
    canManageDocuments: true,
    canInviteUsers: true,
    canApproveInvitations: true,
    canRemoveUsers: true,
    canChangeUserRoles: true,
    canInviteOwners: false, // Only admins can create owners
    canInviteManagers: true,
    canInviteTechnicians: true,
    canInviteSupport: true,
    canViewOrders: true,
    canManageOrders: true,
    canViewAnalytics: true,
    canManageInventory: true,
    canViewFinancials: true,
    canManagePayments: true,
  },
  [BusinessUserRole.MANAGER]: {
    canEditBusinessInfo: false,
    canDeleteBusiness: false,
    canManageDocuments: false,
    canInviteUsers: true, // Limited to technicians/support with approval
    canApproveInvitations: false,
    canRemoveUsers: false,
    canChangeUserRoles: false,
    canInviteOwners: false,
    canInviteManagers: false,
    canInviteTechnicians: true, // Requires approval
    canInviteSupport: true, // Requires approval
    canViewOrders: true,
    canManageOrders: true,
    canViewAnalytics: true,
    canManageInventory: true,
    canViewFinancials: false,
    canManagePayments: false,
  },
  [BusinessUserRole.TECHNICIAN]: {
    canEditBusinessInfo: false,
    canDeleteBusiness: false,
    canManageDocuments: false,
    canInviteUsers: false,
    canApproveInvitations: false,
    canRemoveUsers: false,
    canChangeUserRoles: false,
    canInviteOwners: false,
    canInviteManagers: false,
    canInviteTechnicians: false,
    canInviteSupport: false,
    canViewOrders: true,
    canManageOrders: true,
    canViewAnalytics: false,
    canManageInventory: true,
    canViewFinancials: false,
    canManagePayments: false,
  },
  [BusinessUserRole.SUPPORT]: {
    canEditBusinessInfo: false,
    canDeleteBusiness: false,
    canManageDocuments: false,
    canInviteUsers: false,
    canApproveInvitations: false,
    canRemoveUsers: false,
    canChangeUserRoles: false,
    canInviteOwners: false,
    canInviteManagers: false,
    canInviteTechnicians: false,
    canInviteSupport: false,
    canViewOrders: true,
    canManageOrders: false,
    canViewAnalytics: false,
    canManageInventory: false,
    canViewFinancials: false,
    canManagePayments: false,
  },
};
