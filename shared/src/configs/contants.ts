import { SettingsKey } from "../types";

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
  services: "services"
}

export const ACTIVE_SETTINGS: {
  [key in SettingsKey]: string;
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