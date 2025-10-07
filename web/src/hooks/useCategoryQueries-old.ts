/**
 * Category Query Hooks
 * React Query hooks for category entity operations
 * Follows the established pattern /**
 * Delete a category
 * TODO: Implement server-side API route for admin operations
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      // TODO: Replace with API call to server-side endpoint
      throw new Error('Delete operation not yet implemented - requires server-side API')
    },
    onSuccess: () => {
      // Invalidate category queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: (error) => {
      console.error('Delete category failed:', error)
    },
  })
}ks
 */

import {
  ICategory,
  ICategoryFilter,
  IOperationResult,
} from '@/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientCategoryService } from '../services/category-client.service'

// Query keys for caching
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filter: ICategoryFilter | undefined) =>
    [...categoryKeys.lists(), { filter }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

/**
 * Get all categories with optional filtering
 */
export function useCategories(filter?: ICategoryFilter) {
  console.log('🔍 useCategories: Hook called with filter', filter)
  const result = useQuery({
    queryKey: categoryKeys.list(filter),
    queryFn: () => {
      console.log('🔍 useCategories: Query function executing with filter', filter)
      return clientCategoryService.getAll(filter || {})
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
 * Get main categories (parentCategoryId: null)
 */
export function useMainCategories() {
  console.log('🔍 useMainCategories: Hook called')
  const result = useCategories({ parentCategoryId: null })
  console.log('🔍 useMainCategories: Result', result)
  return result
}

/**
 * Get subcategories for a specific parent category
 */
export function useSubCategories(parentCategoryId: string | null) {
  return useCategories(
    parentCategoryId ? { parentCategoryId } : undefined
  )
}

/**
 * Create a new category
 * TODO: Implement server-side API route for admin operations
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: ICategory) => {
      // TODO: Replace with API call to server-side endpoint
      throw new Error('Create operation not yet implemented - requires server-side API')
    },
    onSuccess: (result) => {
      // Invalidate category queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: (error) => {
      console.error('Create category failed:', error)
    },
  })
}

/**
 * Update an existing category
 * TODO: Implement server-side API route for admin operations
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      categoryId,
      category,
    }: {
      categoryId: string
      category: Partial<ICategory>
    }) => {
      // TODO: Replace with API call to server-side endpoint
      throw new Error('Update operation not yet implemented - requires server-side API')
    },
    onSuccess: (result, { categoryId }) => {
      // Invalidate category queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: (error) => {
      console.error('Update category failed:', error)
    },
  })
}

/**
 * Delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: string) => categoriesService.delete(categoryId),
    onSuccess: () => {
      // Invalidate category lists to refetch after deletion
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
    onError: (error) => {
      console.error('Failed to delete category:', error)
    },
  })
}

/**
 * Check if a category has subcategories
 */
export function useCheckHasSubCategories(categoryId: string | undefined) {
  return useQuery({
    queryKey: [...categoryKeys.all, 'hasSubCategories', categoryId],
    queryFn: () => categoriesService.checkHasSubCategories(categoryId!),
    enabled: !!categoryId,
    select: (data: IOperationResult<boolean>) => data,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Validate if a subcategory can be activated
 */
export function useValidateSubCategoryActivation(categoryId: string | undefined) {
  return useQuery({
    queryKey: [...categoryKeys.all, 'validateActivation', categoryId],
    queryFn: () => categoriesService.validateSubCategoryActivation(categoryId!),
    enabled: !!categoryId,
    select: (data: IOperationResult<{ canActivate: boolean; parentName?: string }>) => data,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}