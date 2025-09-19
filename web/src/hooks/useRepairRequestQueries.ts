/**
 * Repair Request Queries
 * 
 * React Query hooks for repair request operations using the repairRequestService
 * which in turn calls Next.js API routes under /pages/api/repair-requests
 */

import { repairRequestService } from '@/services/repairRequestService';
import {
  ICreateRepairRequestDTO,
  IRepairRequestFilter,
  IUpdateRepairRequestDTO,
  RepairRequestStatus
} from '@/shared-generated';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Query Keys
export const repairRequestQueryKeys = {
  all: ['repairRequests'] as const,
  lists: () => [...repairRequestQueryKeys.all, 'list'] as const,
  list: (filter?: IRepairRequestFilter) => [...repairRequestQueryKeys.lists(), filter] as const,
  details: () => [...repairRequestQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...repairRequestQueryKeys.details(), id] as const,
  myRequests: (customerId?: string) => [...repairRequestQueryKeys.all, 'my', customerId] as const,
  assigned: (filter?: IRepairRequestFilter) => [...repairRequestQueryKeys.all, 'assigned', filter] as const,
  notes: (requestId: string) => [...repairRequestQueryKeys.all, 'notes', requestId] as const,
  stats: () => [...repairRequestQueryKeys.all, 'stats'] as const,
};

// Queries
export const useMyRepairRequests = (customerId?: string) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.myRequests(customerId),
    queryFn: async () => {
      const result = await repairRequestService.getMyRepairRequests(customerId);

      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Failed to fetch repair requests');
      }
    },
    enabled: !!customerId,
  });
};

export const useRepairRequestDetails = (id: string) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.detail(id),
    queryFn: async () => {
      const result = await repairRequestService.getRepairRequestById(id);

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch repair request details');
      }
    },
    enabled: !!id,
  });
};

export const useCreateRepairRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateRepairRequestDTO) =>
      repairRequestService.createRepairRequest(data),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate and refetch my requests
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.myRequests() });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.lists() });

        toast.success('Repair request created successfully');
      } else {
        toast.error(result.error || 'Failed to create repair request');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create repair request');
    },
  });
};

export const useCancelRepairRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      repairRequestService.cancelRepairRequest(id, reason),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.myRequests() });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.lists() });

        toast.success('Repair request cancelled successfully');
      } else {
        toast.error(result.error || 'Failed to cancel repair request');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to cancel repair request');
    },
  });
};

// Technician/Dealer queries
export const useAssignedRepairRequests = (filter?: IRepairRequestFilter) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.assigned(filter),
    queryFn: async () => {
      const result = await repairRequestService.getAssignedRepairRequests(filter);

      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Failed to fetch assigned repair requests');
      }
    },
  });
};

export const useAcceptRepairRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estimatedCost }: { id: string; estimatedCost?: number }) =>
      repairRequestService.acceptRepairRequest(id, estimatedCost),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.assigned() });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.lists() });

        toast.success('Repair request accepted successfully');
      } else {
        toast.error(result.error || 'Failed to accept repair request');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to accept repair request');
    },
  });
};

export const useRejectRepairRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      repairRequestService.rejectRepairRequest(id, reason),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.assigned() });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.lists() });

        toast.success('Repair request rejected');
      } else {
        toast.error(result.error || 'Failed to reject repair request');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reject repair request');
    },
  });
};

export const useUpdateRepairRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: RepairRequestStatus; comment?: string }) =>
      repairRequestService.updateRepairRequestStatus(id, status, comment),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.assigned() });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.lists() });

        toast.success('Status updated successfully');
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update status');
    },
  });
};

export const useUpdateRepairRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateRepairRequestDTO }) =>
      repairRequestService.updateRepairRequest(id, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.assigned() });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.lists() });

        toast.success('Repair request updated successfully');
      } else {
        toast.error(result.error || 'Failed to update repair request');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update repair request');
    },
  });
};

export const useAssignTechnician = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, technicianId }: { requestId: string; technicianId: string }) =>
      repairRequestService.assignTechnician(requestId, technicianId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.detail(variables.requestId) });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.assigned() });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.lists() });

        toast.success('Technician assigned successfully');
      } else {
        toast.error(result.error || 'Failed to assign technician');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to assign technician');
    },
  });
};

// Notes
export const useRepairRequestNotes = (requestId: string) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.notes(requestId),
    queryFn: async () => {
      const result = await repairRequestService.getNotes(requestId);

      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Failed to fetch notes');
      }
    },
    enabled: !!requestId,
  });
};

export const useAddRepairRequestNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, note, isInternal, attachments }: {
      requestId: string;
      note: string;
      isInternal?: boolean;
      attachments?: string[]
    }) => repairRequestService.addNote(requestId, note, isInternal || false, attachments),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate notes and detail queries
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.notes(variables.requestId) });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.detail(variables.requestId) });

        toast.success('Note added successfully');
      } else {
        toast.error(result.error || 'Failed to add note');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add note');
    },
  });
};

// Admin queries
export const useAllRepairRequests = (filter?: IRepairRequestFilter) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.list(filter),
    queryFn: async () => {
      const result = await repairRequestService.getAllRepairRequests(filter);

      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Failed to fetch repair requests');
      }
    },
  });
};

export const useAssignDealer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, dealerId }: { requestId: string; dealerId: string }) =>
      repairRequestService.assignDealer(requestId, dealerId),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.detail(variables.requestId) });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.assigned() });
        queryClient.invalidateQueries({ queryKey: repairRequestQueryKeys.lists() });

        toast.success('Dealer assigned successfully');
      } else {
        toast.error(result.error || 'Failed to assign dealer');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to assign dealer');
    },
  });
};

export const useRepairRequestStats = () => {
  return useQuery({
    queryKey: repairRequestQueryKeys.stats(),
    queryFn: async () => {
      const result = await repairRequestService.getRepairRequestStats();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch repair request stats');
      }
    },
  });
};
