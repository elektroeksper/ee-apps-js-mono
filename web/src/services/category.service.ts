
import { db } from '@/config/firebase-client-only';
import {
  FB_COLL_NAMES,
  ICategory,
  ICategoryFilter,
  IOperationResult
} from '@/shared';
import { Category } from '@/shared-generated/models';


export class CategoriesService {
  async getAll(filter: ICategoryFilter): Promise<IOperationResult<ICategory[]>> {
    let query = db.collection(FB_COLL_NAMES.categories) as FirebaseFirestore.Query;

    if (filter.isActive !== undefined) {
      query = query.where('isActive', '==', filter.isActive);
    }

    if (filter.parentCategoryId === null) {
      query = query.where('parentCategoryId', '==', null);
    } else if (filter.parentCategoryId) {
      query = query.where('parentCategoryId', '==', filter.parentCategoryId);
    }
    const snapshot = await query.get();
    const categories: ICategory[] = snapshot.docs.map((doc) => new Category(doc.id, doc.data() as ICategory));
    return { success: true, data: categories };
  }
}

// Export a singleton instance
export const categoriesService = new CategoriesService()
