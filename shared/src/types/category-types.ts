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


export type { ICategory, ICategoryWithSubCategories };
