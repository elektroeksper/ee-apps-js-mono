import { AccountType, AuthRole } from "../enums";
import { IAddress, IAppUser, IBusinessDocument, IUserPreferences } from "../types";

class AppUser implements IAppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: AuthRole[];
  isDeleted?: boolean | undefined;
  displayName: string;
  photoURL?: string | undefined;
  phone?: string | undefined;
  accountType: AccountType;
  isEmailVerified: boolean;
  preferences: IUserPreferences;
  address?: IAddress | undefined;
  lastLoginAt?: Date | undefined;

  // Business-specific fields (for business accounts)
  documents?: IBusinessDocument[] | undefined;
  businessInfo?: any; // For business profile data

  constructor(id: string, data: Partial<IAppUser> = {}) {
    this.id = id;
    this.email = data.email || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.roles = data.roles || [];

    this.displayName = data.displayName || `${this.firstName} ${this.lastName}`.trim();
    this.photoURL = data.photoURL;
    this.phone = data.phone;
    this.accountType = data.accountType ?? AccountType.INDIVIDUAL;
    this.isEmailVerified = data.isEmailVerified ?? false;
    this.preferences = data.preferences ?? {} as IUserPreferences;
    this.address = data.address;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLoginAt = data.lastLoginAt;

    // Preserve any additional fields from Firebase document
    // This ensures documents and businessInfo are not lost
    const anyData = data as any;
    if (anyData.documents) {
      this.documents = anyData.documents as IBusinessDocument[];
    }
    if (anyData.businessInfo) {
      this.businessInfo = anyData.businessInfo;
    }
  }
  createdAt: Date;
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  hasRole(role: string): boolean {
    return this.roles.includes(role as AuthRole);
  }
}

export { AppUser };
