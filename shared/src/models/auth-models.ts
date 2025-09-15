import { Timestamp } from "firebase/firestore";
import { AccountType, BusinessUserRole } from "../enums";
import { IAddress, IAppUser, IUserPreferences } from "../types";

class AppUser implements IAppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isDeleted?: boolean | undefined;
  displayName: string;
  photoURL?: string | undefined;
  phone?: string | undefined;
  accountType: AccountType;
  isEmailVerified: boolean;
  preferences: IUserPreferences;
  personalAddress?: IAddress | undefined;

  // Business Association
  businessId?: string | undefined;
  businessRole?: BusinessUserRole | undefined;
  businessPermissions?: string[] | undefined;
  joinedBusinessAt?: Timestamp | undefined;

  // Status
  isActive: boolean;
  lastLoginAt?: Timestamp | undefined;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy?: string | undefined;

  constructor(id: string, data: Partial<IAppUser> = {}) {
    this.id = id;
    this.email = data.email || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.displayName = data.displayName || `${this.firstName} ${this.lastName}`.trim();
    this.photoURL = data.photoURL;
    this.phone = data.phone;
    this.accountType = data.accountType ?? AccountType.INDIVIDUAL;
    this.isEmailVerified = data.isEmailVerified ?? false;
    this.preferences = data.preferences ?? {} as IUserPreferences;
    this.personalAddress = data.personalAddress;

    // Business fields
    this.businessId = data.businessId;
    this.businessRole = data.businessRole;
    this.businessPermissions = data.businessPermissions;
    this.joinedBusinessAt = data.joinedBusinessAt;

    // Status
    this.isActive = data.isActive ?? true;
    this.lastLoginAt = data.lastLoginAt;

    // Timestamps
    this.createdAt = data.createdAt || Timestamp.now();
    this.updatedAt = data.updatedAt || Timestamp.now();
    this.updatedBy = data.updatedBy;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get isBusiness(): boolean {
    return this.accountType === AccountType.BUSINESS;
  }

  get hasBusinessAssociation(): boolean {
    return !!this.businessId;
  }
}

export { AppUser };
