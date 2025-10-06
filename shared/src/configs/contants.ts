import { BusinessUserRole } from '../enums'
import { IBusinessPermissions, ICategory, SystemSettingsKey } from '../types'

export const FB_FUNCTIONS: {
  [key: string]: string
} = {
  getUserClaims: 'getUserClaims',
  addUserClaims: 'addUserClaims',
  removeUserClaims: 'removeUserClaims',
  approveBusinessAccount: 'approveBusinessAccount',
  rejectBusinessAccount: 'rejectBusinessAccount',
  updateBusinessProfile: 'updateBusinessProfile',
  updateUserProfile: 'updateUserProfile',
}

export const FB_COLL_NAMES = {
  settings: 'settings',
  users: 'users',
  orders: 'orders',
  services: 'services',
  businesses: 'businesses',
  products: 'products',
  categories: 'categories',
  reviews: 'reviews',
  messages: 'messages',
  notifications: 'notifications',
  logs: 'logs',
  documents: 'documents',
  files: 'files',
}

export const ACTIVE_SETTINGS: {
  [key in SystemSettingsKey]: string
} = {
  emailNotifications: 'emailNotifications',
  maintenanceMode: 'maintenanceMode',
  userRegistration: 'userRegistration',
  emailVerificationRequired: 'emailVerificationRequired',
  businessAccountApproval: 'businessAccountApproval',
  autoBackup: 'autoBackup',
  analyticsEnabled: 'analyticsEnabled',
  sessionTimeout: 'sessionTimeout',
  maxFileSize: 'maxFileSize',
  allowedFileTypes: 'allowedFileTypes',
}

export const BUSINESS_CATEGORIES: ICategory[] = [
  {
    id: 'b1a2c3d4e5f6g7h8i9j0',
    name: 'Elektronik',
    slug: 'elektronik',
    description: 'Elektronik ürünler ve servisler',
    isActive: true
  },
  {
    id: 'k1l2m3n4o5p6q7r8s9t0',
    name: 'Beyaz Eşya',
    slug: 'beyaz-esya',
    description: 'Beyaz eşya ürünleri ve servisleri',
    isActive: true
  },
  {
    id: 'u1v2w3x4y5z6a7b8c9d0',
    name: 'Telefon & Tablet',
    slug: 'telefon-tablet',
    description: 'Telefon ve tablet ürünleri',
    isActive: true
  },
  {
    id: 'e1f2g3h4i5j6k7l8m9n0',
    name: 'Bilgisayar',
    slug: 'bilgisayar',
    description: 'Bilgisayar ve aksesuarları',
    isActive: true
  },
  {
    id: 'o1p2q3r4s5t6u7v8w9x0',
    name: 'TV & Ses Sistemleri',
    slug: 'tv-ses-sistemleri',
    description: 'TV ve ses sistemleri',
    isActive: true
  },
  {
    id: 'y1z2a3b4c5d6e7f8g9h0',
    name: 'Diğer',
    slug: 'diger',
    description: 'Diğer kategoriler',
    isActive: true
  },
]

export const BUSINESS_CATEGORY_ICONS: Record<string, string> = {
  'elektronik': '🔌',
  'beyaz-esya': '🏠',
  'telefon-tablet': '📱',
  'bilgisayar': '💻',
  'tv-ses-sistemleri': '📺',
  'diger': '📦',
}

export const ROLE_PERMISSIONS: Record<BusinessUserRole, IBusinessPermissions> =
{
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
}
