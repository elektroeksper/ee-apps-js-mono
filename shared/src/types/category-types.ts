import { IEntity } from "./common-types";

interface ICategory extends IEntity {
  id?: string;
  order?: number;
  slug: string;
  name: string;
  description?: string;
  parentCategoryId?: string | null;
  isActive?: boolean;
}

interface ICategoryWithSubCategories extends ICategory {
  subCategories?: ICategoryWithSubCategories[];
}

interface ICategoryFilter {
  isActive?: boolean;
  parentCategoryId?: string | null; // null means top-level categories
}


export type { ICategory, ICategoryFilter, ICategoryWithSubCategories };

