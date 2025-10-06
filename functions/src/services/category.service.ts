// import { BUSINESS_CATEGORIES } from "@shared/configs/contants";

import { BUSINESS_CATEGORIES, FB_COLL_NAMES, ICategory, IOperationResult } from "@shared";
import { db } from "@utils/firebase-admin";
import { logger } from "firebase-functions/v2";

export class CategoryService {
  async getAll(): Promise<IOperationResult<ICategory[]>> {
    try {
      const categoriesSnapshot = await db
        .collection('categories')
        .orderBy('name', 'asc')
        .get()
      const categories = categoriesSnapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as ICategory
      )

      return {
        success: true,
        data: categories,
        code: 200,
      }
    } catch (error) {
      logger.error('Error getting categories:', error)
      return {
        success: false,
        error: 'Failed to fetch categories',
        code: 500,
      }
    }
  }

  async getById(_id: string) {
    // Implementation for fetching a category by ID
  }

  async create(_data: any) {
    // Implementation for creating a new category
  }
  async update(_id: string, _data: any) {
    // Implementation for updating a category by ID
  }
  async delete(_id: string) {
    // Implementation for deleting a category by ID
  }

  async initialize() {
    const catsResult: IOperationResult<ICategory[]> = await this.getAll();
    if (catsResult && catsResult.data && catsResult.data.length > 0) {
      logger.info('Categories already initialized.');
      return;
    }

    const initialCategories: ICategory[] = BUSINESS_CATEGORIES;
    const batch = db.batch();
    initialCategories.forEach(category => {
      const docRef = db.collection(FB_COLL_NAMES.categories).doc(category.id!);
      batch.set(docRef, category);
    });
    await batch.commit();
  }

}


export default new CategoryService();