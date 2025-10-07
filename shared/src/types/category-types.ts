import { IEntity } from "./common-types";

interface ICategory extends IEntity {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
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

