/**
 * Business Query Hooks
 * React Query hooks for business entity operations
 * Follows the established pattern from user hooks
 */

import {
  IBusiness,
  IBusinessFilter,
  IOperationResult,
} from '@/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { businessService } from '../services/business.service'

// Query keys for caching
export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (filter: IBusinessFilter | undefined) =>
    [...businessKeys.lists(), { filter }] as const,
  details: () => [...businessKeys.all, 'detail'] as const,
  detail: (id: string) => [...businessKeys.details(), id] as const,
}

/**
 * Get all businesses with optional filtering
 * Admin-only operation
 */
export function useBusinesses(filter?: IBusinessFilter) {
  return useQuery({
    queryKey: businessKeys.list(filter),
    queryFn: () => businessService.getAll(filter),
    select: (data: IOperationResult<IBusiness[]>) => data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Get business by ID
 */
export function useBusiness(id: string | undefined) {
  return useQuery({
    queryKey: businessKeys.detail(id || ''),
    queryFn: () => businessService.getById(id!),
    enabled: !!id,
    select: (data: IOperationResult<IBusiness>) => data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Create a new business
 */
export function useCreateBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<IBusiness>) => businessService.create(data),
    onSuccess: result => {
      if (result.success) {
        // Invalidate and refetch business lists
        queryClient.invalidateQueries({ queryKey: businessKeys.lists() })

        // Add the new business to the cache
        if (result.data) {
          queryClient.setQueryData(businessKeys.detail(result.data.id!), result)
        }
      }
    },
    onError: error => {
      console.error('Create business error:', error)
    },
  })
}

/**
 * Update business by ID
 */
export function useUpdateBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IBusiness> }) =>
      businessService.update(id, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Update the specific business in cache
        queryClient.setQueryData(businessKeys.detail(variables.id), result)

        // Invalidate business lists to refetch
        queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
      }
    },
    onError: error => {
      console.error('Update business error:', error)
    },
  })
}

/**
 * Delete business by ID
 */
export function useDeleteBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => businessService.delete(id),
    onSuccess: (result, id) => {
      if (result.success) {
        // Remove the business from cache
        queryClient.removeQueries({ queryKey: businessKeys.detail(id) })

        // Invalidate business lists to refetch
        queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
      }
    },
    onError: error => {
      console.error('Delete business error:', error)
    },
  })
}

/**
 * Verify business (approve/reject)
 * Admin-only operation
 */
export function useVerifyBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      approve,
      adminId,
      reason,
    }: {
      id: string
      approve: boolean
      adminId: string
      reason?: string
    }) => businessService.verifyBusiness(id, approve, adminId, reason),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate the specific business to refetch updated verification status
        queryClient.invalidateQueries({
          queryKey: businessKeys.detail(variables.id),
        })

        // Invalidate business lists to refetch
        queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
      }
    },
    onError: error => {
      console.error('Verify business error:', error)
    },
  })
}

/**
 * Approve business for verification
 * Admin-only operation
 */
export function useApproveBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (businessId: string) =>
      businessService.approveBusiness(businessId),
    onSuccess: (result, businessId) => {
      if (result.success) {
        // Update the specific business in cache
        if (result.data) {
          queryClient.setQueryData(businessKeys.detail(businessId), result)
        }

        // Invalidate business lists to refetch
        queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
      }
    },
    onError: error => {
      console.error('Approve business error:', error)
    },
  })
}

/**
 * Reject business for verification
 * Admin-only operation
 */
export function useRejectBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      reason,
    }: {
      businessId: string
      reason: string
    }) => businessService.rejectBusiness(businessId, reason),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Update the specific business in cache
        if (result.data) {
          queryClient.setQueryData(
            businessKeys.detail(variables.businessId),
            result
          )
        }

        // Invalidate business lists to refetch
        queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
      }
    },
    onError: error => {
      console.error('Reject business error:', error)
    },
  })
}

/**
 * Clear business rejection status
 * Admin-only operation
 */
export function useClearBusinessRejection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (businessId: string) =>
      businessService.clearBusinessRejection(businessId),
    onSuccess: (result, businessId) => {
      if (result.success) {
        // Update the specific business in cache
        if (result.data) {
          queryClient.setQueryData(businessKeys.detail(businessId), result)
        }

        // Invalidate business lists to refetch
        queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
      }
    },
    onError: error => {
      console.error('Clear business rejection error:', error)
    },
  })
}
