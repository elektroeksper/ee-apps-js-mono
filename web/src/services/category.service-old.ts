
import { adminDb } from '@/lib/firebase-admin';
import { db } from '@/config/firebase-client-only';
import {
  FB_COLL_NAMES,
  ICategory,
  ICategoryFilter,
  IOperationResult
} from '@/shared';
import { Category } from '@/shared-generated/models';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  DocumentReference 
} from 'firebase/firestore';


export class CategoriesService {
  // Client-side method for fetching categories (used by React Query hooks)
  async getAllClientSide(filter: ICategoryFilter): Promise<IOperationResult<ICategory[]>> {
    try {
      console.log('🔥 CategoriesService.getAllClientSide: Starting query with filter', filter);
      console.log('🔥 CategoriesService.getAllClientSide: DB instance', db);
      console.log('🔥 CategoriesService.getAllClientSide: Collection name', FB_COLL_NAMES.categories);

      if (!db) {
        console.error('🔥 CategoriesService.getAllClientSide: DB is null, client-side Firebase not initialized');
        return { success: false, error: 'Firebase not initialized', code: 500 };
      }

      const categoriesRef = collection(db, FB_COLL_NAMES.categories);
      console.log('🔥 CategoriesService.getAllClientSide: Collection reference created', categoriesRef);

      let firestoreQuery = query(categoriesRef);

      if (filter.isActive !== undefined) {
        firestoreQuery = query(firestoreQuery, where('isActive', '==', filter.isActive));
      }

      if (filter.parentCategoryId === null) {
        firestoreQuery = query(firestoreQuery, where('parentCategoryId', '==', null));
      } else if (filter.parentCategoryId) {
        firestoreQuery = query(firestoreQuery, where('parentCategoryId', '==', filter.parentCategoryId));
      }

      console.log('🔥 CategoriesService.getAllClientSide: Executing Firestore query');
      const snapshot = await getDocs(firestoreQuery);
      console.log('🔥 CategoriesService.getAllClientSide: Query completed, found', snapshot.docs.length, 'documents');

      const categories: ICategory[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as ICategory;
        console.log('🔥 CategoriesService.getAllClientSide: Processing document', docSnapshot.id, data);
        return new Category(docSnapshot.id, data);
      });
      console.log('🔥 CategoriesService.getAllClientSide: Mapped categories', categories);

      return { success: true, data: categories };
    } catch (error) {
      console.error('🔥 CategoriesService.getAllClientSide: Error occurred', error);
      return { success: false, error: (error as Error).message, code: 500 };
    }
  }

  // Admin server-side method for management operations using Firebase Admin SDK
  async getAll(filter: ICategoryFilter): Promise<IOperationResult<ICategory[]>> {
    try {
      console.log('🔥 CategoriesService.getAll (Admin): Starting query with filter', filter);
      
      let query: FirebaseFirestore.Query = adminDb.collection(FB_COLL_NAMES.categories);

      if (filter.isActive !== undefined) {
        query = query.where('isActive', '==', filter.isActive);
      }

      if (filter.parentCategoryId === null) {
        query = query.where('parentCategoryId', '==', null);
      } else if (filter.parentCategoryId) {
        query = query.where('parentCategoryId', '==', filter.parentCategoryId);
      }

      console.log('🔥 CategoriesService.getAll (Admin): Executing Firestore Admin query');
      const snapshot = await query.get();
      console.log('🔥 CategoriesService.getAll (Admin): Query completed, found', snapshot.docs.length, 'documents');

      const categories: ICategory[] = snapshot.docs.map((doc) => {
        const data = doc.data() as ICategory;
        console.log('🔥 CategoriesService.getAll (Admin): Processing document', doc.id, data);
        return new Category(doc.id, data);
      });
      console.log('🔥 CategoriesService.getAll (Admin): Mapped categories', categories);

      return { success: true, data: categories };
    } catch (error) {
      console.error('🔥 CategoriesService.getAll (Admin): Error occurred', error);
      return { success: false, error: (error as Error).message, code: 500 };
    }
  }

  async create(category: ICategory): Promise<IOperationResult<ICategory>> {
    try {
      console.log('🔥 CategoriesService.create (Admin): Creating category', category);
      
      const docRef = await adminDb.collection(FB_COLL_NAMES.categories).add(category);
      const newCategory = new Category(docRef.id, category);
      
      console.log('🔥 CategoriesService.create (Admin): Category created', newCategory);
      return { success: true, data: newCategory };
    } catch (error) {
      console.error('🔥 CategoriesService.create (Admin): Error occurred', error);
      return { success: false, error: (error as Error).message, code: 500 };
    }
  }

  async update(categoryId: string, category: Partial<ICategory>): Promise<IOperationResult<ICategory>> {
    try {
      console.log('🔥 CategoriesService.update (Admin): Updating category', categoryId, category);
      
      await adminDb.collection(FB_COLL_NAMES.categories).doc(categoryId).update(category);
      const updatedDoc = await adminDb.collection(FB_COLL_NAMES.categories).doc(categoryId).get();
      
      if (!updatedDoc.exists) {
        return { success: false, error: 'Category not found', code: 404 };
      }
      
      const updatedCategory = new Category(updatedDoc.id, updatedDoc.data() as ICategory);
      
      console.log('🔥 CategoriesService.update (Admin): Category updated', updatedCategory);
      return { success: true, data: updatedCategory };
    } catch (error) {
      console.error('🔥 CategoriesService.update (Admin): Error occurred', error);
      return { success: false, error: (error as Error).message, code: 500 };
    }
  }

  async updateWithParentChildLogic(categoryId: string, category: Partial<ICategory>): Promise<IOperationResult<ICategory>> {
    try {
      console.log('🔥 CategoriesService.updateWithParentChildLogic (Admin): Updating category', categoryId, category);
      
      const categoriesRef = adminDb.collection(FB_COLL_NAMES.categories);

      // Get the current category first
      const currentDoc = await categoriesRef.doc(categoryId).get();
      if (!currentDoc.exists) {
        return { success: false, error: 'Category not found', code: 404 };
      }

      const currentCategory = currentDoc.data() as ICategory;
      const isMainCategory = !currentCategory.parentCategoryId;
      const isBeingDeactivated = category.isActive === false && currentCategory.isActive === true;
      const isBeingActivated = category.isActive === true && currentCategory.isActive === false;

      // If this is a subcategory being activated, check if parent is active
      if (!isMainCategory && isBeingActivated) {
        const parentDoc = await categoriesRef.doc(currentCategory.parentCategoryId!).get();
        if (parentDoc.exists) {
          const parentData = parentDoc.data() as ICategory;
          if (!parentData.isActive) {
            return {
              success: false,
              error: 'Parent category must be active before activating subcategory',
              code: 400
            };
          }
        }
      }

      // Update the category
      await categoriesRef.doc(categoryId).update(category);

      // If this is a main category being deactivated, deactivate all subcategories
      if (isMainCategory && isBeingDeactivated) {
        const subCategoriesSnapshot = await categoriesRef
          .where('parentCategoryId', '==', categoryId)
          .get();

        const updatePromises = subCategoriesSnapshot.docs.map((doc: any) =>
          categoriesRef.doc(doc.id).update({ isActive: false })
        );

        await Promise.all(updatePromises);
      }

      // Get the updated category
      const updatedDoc = await categoriesRef.doc(categoryId).get();
      const updatedCategory = new Category(updatedDoc.id, updatedDoc.data() as ICategory);

      console.log('🔥 CategoriesService.updateWithParentChildLogic (Admin): Category updated with logic', updatedCategory);
      return { success: true, data: updatedCategory };
    } catch (error) {
      console.error('🔥 CategoriesService.updateWithParentChildLogic (Admin): Error occurred', error);
      return { success: false, error: (error as Error).message, code: 500 };
    }
  }

  async delete(categoryId: string): Promise<IOperationResult<void>> {
    try {
      console.log('🔥 CategoriesService.delete (Admin): Deleting category', categoryId);
      
      const categoriesRef = adminDb.collection(FB_COLL_NAMES.categories);

      // Find subcategories with parentCategoryId === categoryId
      const subCategoriesSnapshot = await categoriesRef.where('parentCategoryId', '==', categoryId).get();

      // Delete all subcategories
      const deletePromises = subCategoriesSnapshot.docs.map((doc: any) => categoriesRef.doc(doc.id).delete());
      await Promise.all(deletePromises);

      // Delete the main category
      await categoriesRef.doc(categoryId).delete();

      console.log('🔥 CategoriesService.delete (Admin): Category and subcategories deleted');
      return { success: true };
    } catch (error) {
      console.error('🔥 CategoriesService.delete (Admin): Error occurred', error);
      return { success: false, error: (error as Error).message, code: 500 };
    }
  }

  async checkHasSubCategories(categoryId: string): Promise<IOperationResult<boolean>> {
    try {
      console.log('🔥 CategoriesService.checkHasSubCategories (Admin): Checking for subcategories', categoryId);
      
      const snapshot = await adminDb.collection(FB_COLL_NAMES.categories)
        .where('parentCategoryId', '==', categoryId)
        .limit(1)
        .get();
      
      console.log('🔥 CategoriesService.checkHasSubCategories (Admin): Has subcategories:', !snapshot.empty);
      return { success: true, data: !snapshot.empty };
    } catch (error) {
      console.error('🔥 CategoriesService.checkHasSubCategories (Admin): Error occurred', error);
      return { success: false, error: (error as Error).message, code: 500 };
    }
  }

  async validateSubCategoryActivation(categoryId: string): Promise<IOperationResult<{ canActivate: boolean; parentName?: string }>> {
    try {
      console.log('🔥 CategoriesService.validateSubCategoryActivation (Admin): Validating activation', categoryId);
      
      const categoryDoc = await adminDb.collection(FB_COLL_NAMES.categories).doc(categoryId).get();
      if (!categoryDoc.exists) {
        return { success: false, error: 'Category not found', code: 404 };
      }

      const categoryData = categoryDoc.data() as ICategory;

      // If it's a main category, it can always be activated
      if (!categoryData.parentCategoryId) {
        return { success: true, data: { canActivate: true } };
      }

      // Check parent category status
      const parentDoc = await adminDb.collection(FB_COLL_NAMES.categories).doc(categoryData.parentCategoryId).get();
      if (!parentDoc.exists) {
        return { success: false, error: 'Parent category not found', code: 404 };
      }

      const parentData = parentDoc.data() as ICategory;
      const result = {
        canActivate: parentData.isActive ?? false,
        parentName: parentData.name
      };
      
      console.log('🔥 CategoriesService.validateSubCategoryActivation (Admin): Validation result', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('🔥 CategoriesService.validateSubCategoryActivation (Admin): Error occurred', error);
      return { success: false, error: (error as Error).message, code: 500 };
    }
  }
}

// Export a singleton instance
export const categoriesService = new CategoriesService()
