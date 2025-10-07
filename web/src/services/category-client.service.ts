// Client-side category service - uses Firebase Client SDK only
import { db } from '@/config/firebase-client-only';
import {
  FB_COLL_NAMES,
  ICategory,
  ICategoryFilter,
  IOperationResult
} from '@/shared';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Query,
  where
} from 'firebase/firestore';

class ClientCategoryService {
  // Get all categories for client-side operations (end users)
  async getAll(filter?: ICategoryFilter): Promise<IOperationResult<ICategory[]>> {
    try {
      console.log('🔥 ClientCategoryService.getAll: Fetching categories for client', filter);

      let categoriesQuery: Query = collection(db, FB_COLL_NAMES.categories);

      // Apply filters
      if (filter?.parentCategoryId !== undefined) {
        categoriesQuery = query(categoriesQuery, where('parentCategoryId', '==', filter.parentCategoryId));
      }

      if (filter?.isActive !== undefined) {
        categoriesQuery = query(categoriesQuery, where('isActive', '==', filter.isActive));
      }

      // Always order by name
      categoriesQuery = query(categoriesQuery, orderBy('name', 'asc'));

      const snapshot = await getDocs(categoriesQuery);

      if (snapshot.empty) {
        console.log('🔥 ClientCategoryService.getAll: No categories found');
        return { success: true, data: [] };
      }

      const categories: ICategory[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as ICategory;
        categories.push({
          ...data,
          id: doc.id
        });
      });

      console.log(`🔥 ClientCategoryService.getAll: Found ${categories.length} categories for client`);
      return { success: true, data: categories };

    } catch (error: any) {
      console.error('🔥 ClientCategoryService.getAll: Error occurred', error);
      return { success: false, error: error.message || 'Failed to fetch categories' };
    }
  }

  // Get main categories (parent categories) for client
  async getMainCategories(): Promise<IOperationResult<ICategory[]>> {
    return this.getAll({ parentCategoryId: null, isActive: true });
  }

  // Get sub categories for a specific parent for client
  async getSubCategories(parentCategoryId: string): Promise<IOperationResult<ICategory[]>> {
    return this.getAll({ parentCategoryId, isActive: true });
  }
}

// Export a singleton instance
export const clientCategoryService = new ClientCategoryService();