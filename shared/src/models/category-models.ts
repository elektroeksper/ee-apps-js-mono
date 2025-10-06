import { Timestamp } from "firebase/firestore";
import { ICategory } from "../types";

export class Category implements ICategory {
  id?: string | undefined;
  slug: string;
  name: string;
  description?: string | undefined;
  parentCategoryId?: string | undefined;
  isActive?: boolean | undefined;
  isDeleted?: boolean | undefined;
  createdAt?: Date | Timestamp | undefined;
  updatedAt?: Date | Timestamp | undefined;
  updatedBy?: string | undefined;

  constructor(id?: string, data?: ICategory) {
    if (id) this.id = id;
    if (data) {
      this.slug = data.slug;
      this.name = data.name;
      this.description = data.description;
      this.parentCategoryId = data.parentCategoryId;
      this.isActive = data.isActive ?? true;
      this.isDeleted = data.isDeleted ?? false;
      this.createdAt = data.createdAt;
      this.updatedAt = data.updatedAt;
      this.updatedBy = data.updatedBy;
    } else {
      this.slug = "";
      this.name = "";
      this.isActive = true;
      this.isDeleted = false;
    }
  }
}