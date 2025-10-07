import { Timestamp } from "firebase/firestore";
import { ICategory } from "../types";

export class Category implements ICategory {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  order?: number;
  parentCategoryId?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  updatedBy?: string;

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
      this.order = data.order;
    } else {
      this.slug = "";
      this.name = "";
      this.isActive = true;
      this.isDeleted = false;
    }
  }
}