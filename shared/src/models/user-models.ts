import { Timestamp } from "firebase/firestore";
import { AccountType } from "../enums";
import { IAddress } from "../types";
import { IAppUser, IUserBusinessInfo, IUserPreferences } from "../types/user-types";

class AppUser implements IAppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string | undefined;
  phoneNumber?: string | undefined
  accountType: AccountType;
  isEmailVerified: boolean;
  preferences: IUserPreferences;
  address?: IAddress | undefined;
  // Business related fields
  businessInfo?: IUserBusinessInfo | null;

  // Status
  isActive: boolean;
  lastLoginAt?: Date | Timestamp | undefined;

  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  updatedBy?: string | undefined;

  isPhoneVerified: boolean = false;
  isDeleted: boolean = false;


  constructor(id: string, data: Partial<IAppUser>) {
    this.id = id;
    this.email = data.email || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.displayName = data.displayName || `${this.firstName} ${this.lastName}`.trim();
    this.photoURL = data.photoURL;
    this.phoneNumber = data.phoneNumber;
    this.accountType = data.accountType ?? AccountType.INDIVIDUAL;
    this.isEmailVerified = data.isEmailVerified ?? false;
    this.preferences = data.preferences ?? {} as IUserPreferences;
    this.address = data.address;
    this.isPhoneVerified = data.isPhoneVerified ?? false;
    this.isDeleted = data.isDeleted ?? false;

    // Business fields
    this.businessInfo = data.businessInfo ?? null;

    // Status
    this.isActive = data.isActive ?? true;
    this.lastLoginAt = data.lastLoginAt || new Date();

    // Timestamps
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.updatedBy = data.updatedBy;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get hasBusinessAssociation(): boolean {
    return this.businessInfo !== null;
  }
}

export { AppUser };
