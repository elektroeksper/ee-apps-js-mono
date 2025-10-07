// Server-side category service - uses Firebase Admin SDK only
// This file should only be imported in server-side code (API routes, getServerSideProps, etc.)
import { adminDb } from '@/lib/firebase-admin';
import {
  FB_COLL_NAMES,
  ICategory,
  ICategoryFilter,
  IOperationResult
} from '@/shared';

class ServerCategoryService {
  // Get all categories for admin operations
  async getAll(filter?: ICategoryFilter): Promise<IOperationResult<ICategory[]>> {
    try {
      console.log('🔥 ServerCategoryService.getAll: Fetching categories for admin', filter);

      // Always get all categories to avoid Firestore indexing issues
      // We'll filter client-side
      const query: FirebaseFirestore.Query = adminDb.collection(FB_COLL_NAMES.categories);
      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('🔥 ServerCategoryService.getAll: No categories found');
        return { success: true, data: [] };
      }

      const categories: ICategory[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as ICategory;
        const category = {
          ...data,
          id: doc.id
        };
        categories.push(category);
      });

      console.log(`🔥 ServerCategoryService.getAll: Fetched ${categories.length} total categories from Firestore`);

      // Client-side filtering to avoid Firestore indexing issues
      let filteredCategories = categories;

      // Apply parentCategoryId filter
      if (filter?.parentCategoryId !== undefined) {
        if (filter.parentCategoryId === null) {
          // Filter for main categories - those with null parentCategoryId (explicitly null in database)
          filteredCategories = filteredCategories.filter(cat => cat.parentCategoryId === null);
          console.log(`🔥 ServerCategoryService.getAll: After main category filtering: ${filteredCategories.length} categories`);

          // Debug: Show what we found
          filteredCategories.forEach(cat => {
            console.log(`🔍 Main Category - Name: "${cat.name}", parentCategoryId: ${JSON.stringify(cat.parentCategoryId)}`);
          });
        } else {
          // Filter for subcategories with specific parent
          filteredCategories = filteredCategories.filter(cat => cat.parentCategoryId === filter.parentCategoryId);
          console.log(`🔥 ServerCategoryService.getAll: After subcategory filtering (parent: ${filter.parentCategoryId}): ${filteredCategories.length} categories`);
        }
      }

      // Apply isActive filter
      if (filter?.isActive !== undefined) {
        filteredCategories = filteredCategories.filter(cat => cat.isActive === filter.isActive);
        console.log(`🔥 ServerCategoryService.getAll: After active filtering (${filter.isActive}): ${filteredCategories.length} categories`);
      }

      // Sort by name
      filteredCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      console.log(`🔥 ServerCategoryService.getAll: Final result: ${filteredCategories.length} categories for admin`);
      return { success: true, data: filteredCategories };

    } catch (error: any) {
      console.error('🔥 ServerCategoryService.getAll: Error occurred', error);
      return { success: false, error: error.message || 'Failed to fetch categories' };
    }
  }

  // Create a new category
  async create(categoryData: Partial<ICategory>): Promise<IOperationResult<ICategory>> {
    try {
      console.log('🔥 ServerCategoryService.create: Starting category creation');
      console.log('🔥 ServerCategoryService.create: Raw input data:', JSON.stringify(categoryData, null, 2));

      // Handle parentCategoryId explicitly - keep null as null, don't convert to undefined  
      const parentCategoryId = categoryData.parentCategoryId === undefined ? null : categoryData.parentCategoryId;

      const category: any = {
        name: categoryData.name || '',
        slug: categoryData.slug || (categoryData.name || '').toLowerCase().replace(/\s+/g, '-'),
        parentCategoryId: parentCategoryId,
        isActive: categoryData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Only add description if it's not undefined
      if (categoryData.description !== undefined) {
        category.description = categoryData.description;
      }

      console.log('🔥 ServerCategoryService.create: Processed category data:', JSON.stringify(category, null, 2));
      console.log('🔥 ServerCategoryService.create: parentCategoryId value:', parentCategoryId, 'type:', typeof parentCategoryId);

      const docRef = await adminDb.collection(FB_COLL_NAMES.categories).add(category);
      console.log('🔥 ServerCategoryService.create: Document added with ID:', docRef.id);

      const result: ICategory = { ...category, id: docRef.id };
      console.log('🔥 ServerCategoryService.create: Category created successfully:', JSON.stringify(result, null, 2));

      return { success: true, data: result };
    } catch (error: any) {
      console.error('🔥 ServerCategoryService.create: Error occurred', error);
      console.error('🔥 ServerCategoryService.create: Error stack:', error.stack);
      return { success: false, error: error.message || 'Failed to create category' };
    }
  }

  // Update an existing category
  async update(categoryId: string, categoryData: Partial<ICategory>): Promise<IOperationResult<ICategory>> {
    try {
      console.log('🔥 ServerCategoryService.update: Updating category', categoryId, categoryData);

      // Check if this is a parent category being deactivated
      const isDeactivatingParent = categoryData.isActive === false;

      await adminDb.collection(FB_COLL_NAMES.categories).doc(categoryId).update(categoryData);
      const updatedDoc = await adminDb.collection(FB_COLL_NAMES.categories).doc(categoryId).get();

      if (!updatedDoc.exists) {
        return { success: false, error: 'Category not found after update' };
      }

      const result: ICategory = { ...updatedDoc.data() as ICategory, id: categoryId };
      console.log('🔥 ServerCategoryService.update: Category updated successfully', result);

      // If deactivating a parent category, cascade deactivation to all subcategories
      if (isDeactivatingParent && !result.parentCategoryId) {
        console.log('🔥 ServerCategoryService.update: Cascading deactivation to subcategories of parent category', categoryId);

        try {
          // Get all subcategories of this parent
          const subcategoriesSnapshot = await adminDb.collection(FB_COLL_NAMES.categories)
            .where('parentCategoryId', '==', categoryId)
            .get();

          if (!subcategoriesSnapshot.empty) {
            console.log(`🔥 ServerCategoryService.update: Found ${subcategoriesSnapshot.docs.length} subcategories to deactivate`);

            // Use batch to update all subcategories at once
            const batch = adminDb.batch();

            subcategoriesSnapshot.docs.forEach((doc) => {
              const subcategory = doc.data() as ICategory;
              console.log(`🔥 ServerCategoryService.update: Deactivating subcategory "${subcategory.name}" (${doc.id})`);
              batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
            });

            await batch.commit();
            console.log('🔥 ServerCategoryService.update: Successfully deactivated all subcategories');
          } else {
            console.log('🔥 ServerCategoryService.update: No subcategories found to deactivate');
          }
        } catch (cascadeError: any) {
          console.error('🔥 ServerCategoryService.update: Error during cascade deactivation', cascadeError);
          // Don't fail the main update, just log the cascade error
        }
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error('🔥 ServerCategoryService.update: Error occurred', error);
      return { success: false, error: error.message || 'Failed to update category' };
    }
  }

  // Delete a category
  async delete(categoryId: string): Promise<IOperationResult<void>> {
    try {
      console.log('🔥 ServerCategoryService.delete: Deleting category', categoryId);

      // Check if category has subcategories
      const hasSubCategories = await this.checkHasSubCategories(categoryId);
      if (!hasSubCategories.success) {
        return { success: false, error: hasSubCategories.error || 'Failed to check subcategories' };
      }

      if (hasSubCategories.data) {
        return {
          success: false,
          error: 'Cannot delete category that has subcategories. Please delete or move subcategories first.'
        };
      }

      // Check if category is used by any businesses (this would need to be implemented based on your business model)
      // For now, we'll proceed with deletion

      await adminDb.collection(FB_COLL_NAMES.categories).doc(categoryId).delete();
      console.log('🔥 ServerCategoryService.delete: Category deleted successfully');

      return { success: true };
    } catch (error: any) {
      console.error('🔥 ServerCategoryService.delete: Error occurred', error);
      return { success: false, error: error.message || 'Failed to delete category' };
    }
  }

  // Get main categories (parent categories)
  async getMainCategories(): Promise<IOperationResult<ICategory[]>> {
    return this.getAll({ parentCategoryId: null });
  }

  // Get sub categories for a specific parent
  async getSubCategories(parentCategoryId: string): Promise<IOperationResult<ICategory[]>> {
    return this.getAll({ parentCategoryId });
  }

  // Check if a category has subcategories
  async checkHasSubCategories(categoryId: string): Promise<IOperationResult<boolean>> {
    try {
      console.log('🔥 ServerCategoryService.checkHasSubCategories: Checking subcategories for', categoryId);

      const snapshot = await adminDb.collection(FB_COLL_NAMES.categories)
        .where('parentCategoryId', '==', categoryId)
        .limit(1)
        .get();

      const hasSubCategories = !snapshot.empty;
      console.log(`🔥 ServerCategoryService.checkHasSubCategories: Category ${categoryId} has subcategories: ${hasSubCategories}`);

      return { success: true, data: hasSubCategories };
    } catch (error: any) {
      console.error('🔥 ServerCategoryService.checkHasSubCategories: Error occurred', error);
      return { success: false, error: error.message || 'Failed to check subcategories' };
    }
  }

  // Validate if a subcategory can be activated based on parent status
  async validateSubCategoryActivation(categoryId: string): Promise<IOperationResult<{ canActivate: boolean; parentName?: string; }>> {
    try {
      console.log('🔥 ServerCategoryService.validateSubCategoryActivation: Validating category', categoryId);

      const categoryDoc = await adminDb.collection(FB_COLL_NAMES.categories).doc(categoryId).get();
      if (!categoryDoc.exists) {
        return { success: false, error: 'Category not found' };
      }

      const categoryData = categoryDoc.data() as ICategory;

      // If it's a main category, it can always be activated
      if (!categoryData.parentCategoryId) {
        return { success: true, data: { canActivate: true } };
      }

      // Check parent category status
      const parentDoc = await adminDb.collection(FB_COLL_NAMES.categories).doc(categoryData.parentCategoryId).get();
      if (!parentDoc.exists) {
        return { success: false, error: 'Parent category not found' };
      }

      const parentData = parentDoc.data() as ICategory;
      const result = {
        canActivate: parentData.isActive ?? false,
        parentName: parentData.name
      };

      console.log('🔥 ServerCategoryService.validateSubCategoryActivation: Validation result', result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('🔥 ServerCategoryService.validateSubCategoryActivation: Error occurred', error);
      return { success: false, error: error.message || 'Failed to validate subcategory activation' };
    }
  }
}

// Export a singleton instance
export const serverCategoryService = new ServerCategoryService();