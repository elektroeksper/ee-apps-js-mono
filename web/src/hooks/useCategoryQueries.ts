/**
 * Category Query Hooks - Client-side operations only
 * React Query hooks for category entity operations
 * All operations use API routes to enable client-side usage
 * For server-side admin operations, use useCategoryQueriesServer.ts
 */

import {
  IApiResponse,
  ICategory,
  ICategoryFilter,
  IOperationResult,
} from '@/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Admin API functions (client-side compatible - uses API routes)
const adminCategoryApi = {
  getAll: async (filter: ICategoryFilter = {}): Promise<IOperationResult<ICategory[]>> => {
    const params = new URLSearchParams();
    if (filter.parentCategoryId !== undefined) {
      params.append('parentCategoryId', filter.parentCategoryId === null ? 'null' : filter.parentCategoryId);
    }
    if (filter.isActive !== undefined) {
      params.append('isActive', filter.isActive.toString());
    }

    const response = await fetch(`/api/admin/categories?${params.toString()}`);
    const result: IApiResponse<ICategory[]> = await response.json();

    if (result.success) {
      return { success: true, data: result.data || [] };
    } else {
      return { success: false, error: result.error || 'Failed to fetch categories' };
    }
  },

  create: async (category: Partial<ICategory>): Promise<IOperationResult<ICategory>> => {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    const result: IApiResponse<ICategory> = await response.json();

    if (result.success && result.data) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Failed to create category' };
    }
  },

  update: async (categoryId: string, category: Partial<ICategory>): Promise<IOperationResult<ICategory>> => {
    const response = await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, ...category }),
    });
    const result: IApiResponse<ICategory> = await response.json();

    if (result.success && result.data) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Failed to update category' };
    }
  },

  delete: async (categoryId: string): Promise<IOperationResult<void>> => {
    const response = await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId }),
    });
    const result: IApiResponse<void> = await response.json();

    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to delete category' };
    }
  },

  checkHasSubCategories: async (categoryId: string): Promise<IOperationResult<boolean>> => {
    const response = await fetch(`/api/admin/categories/has-subcategories?categoryId=${categoryId}`);
    const result: IApiResponse<boolean> = await response.json();

    if (result.success) {
      return { success: true, data: result.data || false };
    } else {
      return { success: false, error: result.error || 'Failed to check subcategories' };
    }
  },

  validateSubCategoryActivation: async (categoryId: string): Promise<IOperationResult<{ canActivate: boolean; parentName?: string }>> => {
    const response = await fetch(`/api/admin/categories/validate-activation?categoryId=${categoryId}`);
    const result: IApiResponse<{ canActivate: boolean; parentName?: string }> = await response.json();

    if (result.success && result.data) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Failed to validate activation' };
    }
  },
};

// API functions for public operations (no auth required)
const publicCategoryApi = {
  getMainCategories: async (): Promise<IOperationResult<ICategory[]>> => {
    console.log('🔍 publicCategoryApi: Fetching main categories');
    const response = await fetch('/api/categories?parentCategoryId=null');
    const result: IApiResponse<ICategory[]> = await response.json();

    if (result.success && result.data) {
      console.log(`🔍 publicCategoryApi: Retrieved ${result.data.length} main categories`);
      return { success: true, data: result.data };
    } else {
      console.error('🔍 publicCategoryApi: Failed to fetch main categories', result.error);
      return { success: false, error: result.error || 'Failed to fetch categories' };
    }
  },

  getSubCategories: async (parentCategoryId: string): Promise<IOperationResult<ICategory[]>> => {
    console.log('🔍 publicCategoryApi: Fetching subcategories for parent:', parentCategoryId);
    const response = await fetch(`/api/categories?parentCategoryId=${encodeURIComponent(parentCategoryId)}`);
    const result: IApiResponse<ICategory[]> = await response.json();

    if (result.success && result.data) {
      console.log(`🔍 publicCategoryApi: Retrieved ${result.data.length} subcategories for parent ${parentCategoryId}`);
      return { success: true, data: result.data };
    } else {
      console.error('🔍 publicCategoryApi: Failed to fetch subcategories', result.error);
      return { success: false, error: result.error || 'Failed to fetch subcategories' };
    }
  },

  getAllActiveCategories: async (): Promise<IOperationResult<ICategory[]>> => {
    console.log('🔍 publicCategoryApi: Fetching all active categories');
    const response = await fetch('/api/categories?all=true');
    const result: IApiResponse<ICategory[]> = await response.json();

    if (result.success && result.data) {
      console.log(`🔍 publicCategoryApi: Retrieved ${result.data.length} total active categories`);
      return { success: true, data: result.data };
    } else {
      console.error('🔍 publicCategoryApi: Failed to fetch all categories', result.error);
      return { success: false, error: result.error || 'Failed to fetch all categories' };
    }
  },
};

// Query keys for caching
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filter: ICategoryFilter | undefined) =>
    [...categoryKeys.lists(), { filter }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  // Public category keys
  public: ['categories', 'public'] as const,
  publicMain: () => [...categoryKeys.public, 'main'] as const,
  publicSub: (parentId: string) => [...categoryKeys.public, 'sub', parentId] as const,
  publicAll: () => [...categoryKeys.public, 'all'] as const,
}

/**
 * Get all categories with optional filtering - for admin panel
 * Uses API endpoint to enable client-side usage
 */
export function useCategories(filter?: ICategoryFilter) {
  console.log('🔍 useCategories: Hook called with filter', filter)
  const result = useQuery({
    queryKey: categoryKeys.list(filter),
    queryFn: () => {
      console.log('🔍 useCategories: Query function executing with filter', filter)
      return adminCategoryApi.getAll(filter || {})
    },
    select: (data: IOperationResult<ICategory[]>) => {
      console.log('🔍 useCategories: Select function called with data', data)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
  console.log('🔍 useCategories: Query result', result)
  return result
}

/**
 * Get main categories (no parent) - for admin panel
 */
export function useMainCategories() {
  return useCategories({ parentCategoryId: null })
}

/**
 * Get subcategories for a specific parent - for admin panel
 */
export function useSubCategories(parentCategoryId: string | null | undefined) {
  return useCategories(
    parentCategoryId ? { parentCategoryId } : undefined
  )
}

/**
 * Get all categories without any filters (for admin)
 */
export function useAllCategories() {
  return useCategories({})
}

/**
 * Create a new category - Admin operation using API route (client-side compatible)
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (category: Partial<ICategory>) => {
      console.log('🔥 useCreateCategory: Creating category', category)
      return adminCategoryApi.create(category)
    },
    onSuccess: (result) => {
      console.log('🔥 useCreateCategory: Category created successfully', result)
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: (error) => {
      console.error('🔥 useCreateCategory: Create category failed:', error)
    },
  })
}

/**
 * Update an existing category - Admin operation using API route (client-side compatible)
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      categoryId,
      category,
    }: {
      categoryId: string
      category: Partial<ICategory>
    }) => {
      console.log('🔥 useUpdateCategory: Updating category', categoryId, category)
      return adminCategoryApi.update(categoryId, category)
    },
    onSuccess: (result, { categoryId }) => {
      console.log('🔥 useUpdateCategory: Category updated successfully', result)
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      if (result.success && result.data) {
        queryClient.setQueryData(categoryKeys.detail(categoryId), result)
      }
    },
    onError: (error) => {
      console.error('🔥 useUpdateCategory: Update category failed:', error)
    },
  })
}

/**
 * Delete a category - Admin operation using API route (client-side compatible)
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: string) => {
      console.log('🔥 useDeleteCategory: Deleting category', categoryId)
      return adminCategoryApi.delete(categoryId)
    },
    onSuccess: (result) => {
      console.log('🔥 useDeleteCategory: Category deleted successfully', result)
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: (error) => {
      console.error('🔥 useDeleteCategory: Delete category failed:', error)
    },
  })
}

/**
 * Check if a category has subcategories - Admin operation using API route (client-side compatible)
 */
export function useCheckHasSubCategories(categoryId: string | undefined) {
  return useQuery({
    queryKey: [...categoryKeys.all, 'hasSubCategories', categoryId],
    queryFn: async () => {
      if (!categoryId) {
        return { success: true, data: false } as IOperationResult<boolean>
      }
      console.log('🔥 useCheckHasSubCategories: Checking subcategories for', categoryId)
      return adminCategoryApi.checkHasSubCategories(categoryId)
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Validate subcategory activation - Admin operation using API route (client-side compatible)
 */
export function useValidateSubCategoryActivation(categoryId: string | undefined) {
  return useQuery({
    queryKey: [...categoryKeys.all, 'validateActivation', categoryId],
    queryFn: async () => {
      if (!categoryId) {
        return { success: true, data: { canActivate: true } } as IOperationResult<{ canActivate: boolean; parentName?: string }>
      }
      console.log('🔥 useValidateSubCategoryActivation: Validating activation for', categoryId)
      return adminCategoryApi.validateSubCategoryActivation(categoryId)
    },
    enabled: !!categoryId,
    staleTime: 1 * 60 * 1000, // 1 minute (shorter cache for validation)
  })
}

// ======================================
// PUBLIC HOOKS (No auth required)
// ======================================

/**
 * Get main categories for public use (business registration, etc.)
 * Uses public API that doesn't require authentication
 */
export function usePublicMainCategories() {
  return useQuery({
    queryKey: categoryKeys.publicMain(),
    queryFn: () => {
      console.log('🔍 usePublicMainCategories: Fetching main categories for public use')
      return publicCategoryApi.getMainCategories()
    },
    select: (data: IOperationResult<ICategory[]>) => {
      console.log('🔍 usePublicMainCategories: Select function called with data', data)
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (longer cache for public data)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Get subcategories for a specific parent - for public use
 * Uses public API that doesn't require authentication
 */
export function usePublicSubCategories(parentCategoryId: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.publicSub(parentCategoryId || ''),
    queryFn: () => {
      if (!parentCategoryId) {
        return Promise.resolve({ success: true, data: [] } as IOperationResult<ICategory[]>)
      }
      console.log('🔍 usePublicSubCategories: Fetching subcategories for parent:', parentCategoryId)
      return publicCategoryApi.getSubCategories(parentCategoryId)
    },
    enabled: !!parentCategoryId,
    select: (data: IOperationResult<ICategory[]>) => {
      console.log('🔍 usePublicSubCategories: Select function called with data', data)
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Get all active categories (both main and sub) for public use
 * Uses public API that doesn't require authentication
 */
export function usePublicAllCategories() {
  return useQuery({
    queryKey: categoryKeys.publicAll(),
    queryFn: () => {
      console.log('🔍 usePublicAllCategories: Fetching all active categories for public use')
      return publicCategoryApi.getAllActiveCategories()
    },
    select: (data: IOperationResult<ICategory[]>) => {
      console.log('🔍 usePublicAllCategories: Select function called with data', data)
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}