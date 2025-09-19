import { Timestamp } from "firebase/firestore";
import { BusinessVerificationStatus, CompanySize, TaxNumberType } from "../enums";
import { IAddress, IBusiness, IBusinessUserInfo, IDocument } from "../types";

class Business implements IBusiness {
  businessName: string = '';
  taxNumber?: string | undefined;
  taxOffice?: string | undefined;
  taxNumberType?: TaxNumberType | undefined;
  identityNumber?: string | undefined;
  addresses?: IAddress[] | undefined;
  phone?: string | undefined;
  website?: string | undefined;
  companySize?: CompanySize | undefined;
  documents?: IDocument[] | undefined;
  verification: { status: BusinessVerificationStatus; history: { approvedAt?: Date | Timestamp | null; approvedBy?: string | null; rejectedAt?: Date | Timestamp | null; rejectedBy?: string | null; rejectionReason?: string | null; }[]; } = { status: BusinessVerificationStatus.PENDING, history: [] };
  ownerId: string = '';
  users: Record<string, IBusinessUserInfo> = {};
  isActive: boolean = true;
  id?: string | undefined;
  isDeleted?: boolean | undefined;
  createdAt?: Timestamp | Date | undefined;
  updatedAt?: Timestamp | Date | undefined;
  updatedBy?: string | undefined;

  constructor(id?: string, data?: Partial<IBusiness>) {
    this.id = id;
    if (data) {
      this.businessName = data.businessName || '';
      this.taxNumber = data.taxNumber;
      this.taxNumberType = data.taxNumberType;
      this.identityNumber = data.identityNumber;
      this.addresses = data.addresses;
      this.phone = data.phone;
      this.website = data.website;
      this.companySize = data.companySize;
      this.documents = data.documents;
      this.verification = data.verification || { status: BusinessVerificationStatus.PENDING, history: [] };
      this.ownerId = data.ownerId || '';
      this.users = data.users || {};
      this.isActive = data.isActive ?? true;

      // Metadata
      this.id = data.id;
      this.isDeleted = data.isDeleted ?? false;
      this.createdAt = data.createdAt || Timestamp.now();
      this.updatedAt = data.updatedAt || Timestamp.now();
      this.updatedBy = data.updatedBy;
    }
  }

}

export { Business };
