/**
 * Server-side Category Query Hooks
 * React Query hooks for server-side admin operations
 * These hooks can only be used in server-side contexts (getServerSideProps, API routes, etc.)
 */

import { serverCategoryService } from '@/services/category-server.service';
import {
  ICategory,
  ICategoryFilter,
  IOperationResult,
} from '@/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query keys for server-side operations
export const serverCategoryKeys = {
  all: ['categories', 'server'] as const,
  lists: () => [...serverCategoryKeys.all, 'list'] as const,
  list: (filter: ICategoryFilter | undefined) =>
    [...serverCategoryKeys.lists(), { filter }] as const,
  details: () => [...serverCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...serverCategoryKeys.details(), id] as const,
}

/**
 * Get all categories with optional filtering - Server-side only
 */
export function useServerCategories(filter?: ICategoryFilter) {
  console.log('🔍 useServerCategories: Hook called with filter', filter)
  const result = useQuery({
    queryKey: serverCategoryKeys.list(filter),
    queryFn: () => {
      console.log('🔍 useServerCategories: Query function executing with filter', filter)
      return serverCategoryService.getAll(filter || {})
    },
    select: (data: IOperationResult<ICategory[]>) => {
      console.log('🔍 useServerCategories: Select function called with data', data)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
  console.log('🔍 useServerCategories: Query result', result)
  return result
}

/**
 * Get main categories (no parent) - Server-side only
 */
export function useServerMainCategories() {
  return useServerCategories({ parentCategoryId: null })
}

/**
 * Get subcategories for a specific parent - Server-side only
 */
export function useServerSubCategories(parentCategoryId: string | null | undefined) {
  return useServerCategories(
    parentCategoryId ? { parentCategoryId } : undefined
  )
}

/**
 * Get all categories without any filters - Server-side only
 */
export function useServerAllCategories() {
  return useServerCategories({})
}

/**
 * Create a new category - Server-side admin operation
 */
export function useServerCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (category: Partial<ICategory>) => {
      console.log('🔥 useServerCreateCategory: Creating category', category)
      return serverCategoryService.create(category)
    },
    onSuccess: (result) => {
      console.log('🔥 useServerCreateCategory: Category created successfully', result)
      queryClient.invalidateQueries({ queryKey: serverCategoryKeys.all })
    },
    onError: (error) => {
      console.error('🔥 useServerCreateCategory: Create category failed:', error)
    },
  })
}

/**
 * Update an existing category - Server-side admin operation
 */
export function useServerUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      categoryId,
      category,
    }: {
      categoryId: string
      category: Partial<ICategory>
    }) => {
      console.log('🔥 useServerUpdateCategory: Updating category', categoryId, category)
      return serverCategoryService.update(categoryId, category)
    },
    onSuccess: (result, { categoryId }) => {
      console.log('🔥 useServerUpdateCategory: Category updated successfully', result)
      queryClient.invalidateQueries({ queryKey: serverCategoryKeys.all })
      if (result.success && result.data) {
        queryClient.setQueryData(serverCategoryKeys.detail(categoryId), result)
      }
    },
    onError: (error) => {
      console.error('🔥 useServerUpdateCategory: Update category failed:', error)
    },
  })
}

/**
 * Delete a category - Server-side admin operation
 */
export function useServerDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: string) => {
      console.log('🔥 useServerDeleteCategory: Deleting category', categoryId)
      return serverCategoryService.delete(categoryId)
    },
    onSuccess: (result) => {
      console.log('🔥 useServerDeleteCategory: Category deleted successfully', result)
      queryClient.invalidateQueries({ queryKey: serverCategoryKeys.all })
    },
    onError: (error) => {
      console.error('🔥 useServerDeleteCategory: Delete category failed:', error)
    },
  })
}

/**
 * Check if a category has subcategories - Server-side admin operation
 */
export function useServerCheckHasSubCategories(categoryId: string | undefined) {
  return useQuery({
    queryKey: [...serverCategoryKeys.all, 'hasSubCategories', categoryId],
    queryFn: async () => {
      if (!categoryId) {
        return { success: true, data: false } as IOperationResult<boolean>
      }
      console.log('🔥 useServerCheckHasSubCategories: Checking subcategories for', categoryId)
      return serverCategoryService.checkHasSubCategories(categoryId)
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Validate subcategory activation - Server-side admin operation
 */
export function useServerValidateSubCategoryActivation(categoryId: string | undefined) {
  return useQuery({
    queryKey: [...serverCategoryKeys.all, 'validateActivation', categoryId],
    queryFn: async () => {
      if (!categoryId) {
        return { success: true, data: { canActivate: true } } as IOperationResult<{ canActivate: boolean; parentName?: string }>
      }
      console.log('🔥 useServerValidateSubCategoryActivation: Validating activation for', categoryId)
      return serverCategoryService.validateSubCategoryActivation(categoryId)
    },
    enabled: !!categoryId,
    staleTime: 1 * 60 * 1000, // 1 minute (shorter cache for validation)
  })
}