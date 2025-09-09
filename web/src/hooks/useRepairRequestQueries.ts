import { repairRequestService } from '@/services/repairRequest.service';
import {
  IRepairRequest,
  ICreateRepairRequestDTO,
  IUpdateRepairRequestDTO,
  IRepairRequestFilter,
  IRepairNote,
  IRepairRequestStats,
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

// ============================================
// Customer Hooks
// ============================================

// Hook to get customer's repair requests
export const useMyRepairRequests = (customerId?: string) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.myRequests(customerId),
    queryFn: async () => {
      const result = await repairRequestService.getMyRepairRequests(customerId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch repair requests');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get single repair request
export const useRepairRequest = (id: string) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.detail(id),
    queryFn: async () => {
      const result = await repairRequestService.getRepairRequestById(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch repair request');
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to create repair request
export const useCreateRepairRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateRepairRequestDTO) => 
      repairRequestService.createRepairRequest(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.all 
        });
        toast.success('Repair request created successfully');
      } else {
        toast.error(result.error || 'Failed to create repair request');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to create repair request:', error);
      toast.error('Failed to create repair request');
    },
  });
};

// Hook to cancel repair request
export const useCancelRepairRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      repairRequestService.cancelRepairRequest(id, reason),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.detail(variables.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.lists() 
        });
        toast.success('Repair request cancelled');
      } else {
        toast.error(result.error || 'Failed to cancel repair request');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to cancel repair request:', error);
      toast.error('Failed to cancel repair request');
    },
  });
};

// ============================================
// Dealer/Technician Hooks
// ============================================

// Hook to get assigned repair requests
export const useAssignedRepairRequests = (filter?: IRepairRequestFilter) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.assigned(filter),
    queryFn: async () => {
      const result = await repairRequestService.getAssignedRepairRequests(filter);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch assigned requests');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to accept repair request
export const useAcceptRepairRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estimatedCost }: { id: string; estimatedCost?: number }) =>
      repairRequestService.acceptRepairRequest(id, estimatedCost),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.detail(variables.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.lists() 
        });
        toast.success('Repair request accepted');
      } else {
        toast.error(result.error || 'Failed to accept repair request');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to accept repair request:', error);
      toast.error('Failed to accept repair request');
    },
  });
};

// Hook to reject repair request
export const useRejectRepairRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      repairRequestService.rejectRepairRequest(id, reason),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.detail(variables.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.lists() 
        });
        toast.success('Repair request rejected');
      } else {
        toast.error(result.error || 'Failed to reject repair request');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to reject repair request:', error);
      toast.error('Failed to reject repair request');
    },
  });
};

// Hook to update repair request status
export const useUpdateRepairRequestStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      status, 
      comment 
    }: { 
      id: string; 
      status: RepairRequestStatus; 
      comment?: string 
    }) =>
      repairRequestService.updateRepairRequestStatus(id, status, comment),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.detail(variables.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.lists() 
        });
        toast.success('Status updated successfully');
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to update status:', error);
      toast.error('Failed to update status');
    },
  });
};

// Hook to update repair request
export const useUpdateRepairRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateRepairRequestDTO }) =>
      repairRequestService.updateRepairRequest(id, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.detail(variables.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.lists() 
        });
        toast.success('Repair request updated');
      } else {
        toast.error(result.error || 'Failed to update repair request');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to update repair request:', error);
      toast.error('Failed to update repair request');
    },
  });
};

// Hook to assign technician
export const useAssignTechnicianMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      requestId, 
      technicianId 
    }: { 
      requestId: string; 
      technicianId: string 
    }) =>
      repairRequestService.assignTechnician(requestId, technicianId),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.detail(variables.requestId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.lists() 
        });
        toast.success('Technician assigned successfully');
      } else {
        toast.error(result.error || 'Failed to assign technician');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to assign technician:', error);
      toast.error('Failed to assign technician');
    },
  });
};

// ============================================
// Notes Hooks
// ============================================

// Hook to get notes for a repair request
export const useRepairRequestNotes = (requestId: string) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.notes(requestId),
    queryFn: async () => {
      const result = await repairRequestService.getNotes(requestId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notes');
      }
      return result.data || [];
    },
    enabled: !!requestId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to add note
export const useAddNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      requestId, 
      note, 
      isInternal, 
      attachments 
    }: { 
      requestId: string; 
      note: string; 
      isInternal: boolean; 
      attachments?: string[] 
    }) =>
      repairRequestService.addNote(requestId, note, isInternal, attachments),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.notes(variables.requestId) 
        });
        toast.success('Note added successfully');
      } else {
        toast.error(result.error || 'Failed to add note');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to add note:', error);
      toast.error('Failed to add note');
    },
  });
};

// ============================================
// Admin Hooks
// ============================================

// Hook to get all repair requests (admin)
export const useAllRepairRequests = (filter?: IRepairRequestFilter) => {
  return useQuery({
    queryKey: repairRequestQueryKeys.list(filter),
    queryFn: async () => {
      const result = await repairRequestService.getAllRepairRequests(filter);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch repair requests');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to assign dealer
export const useAssignDealerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      requestId, 
      dealerId 
    }: { 
      requestId: string; 
      dealerId: string 
    }) =>
      repairRequestService.assignDealer(requestId, dealerId),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.detail(variables.requestId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: repairRequestQueryKeys.lists() 
        });
        toast.success('Dealer assigned successfully');
      } else {
        toast.error(result.error || 'Failed to assign dealer');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to assign dealer:', error);
      toast.error('Failed to assign dealer');
    },
  });
};

// ============================================
// Statistics Hooks
// ============================================

// Hook to get repair request statistics
export const useRepairRequestStats = () => {
  return useQuery({
    queryKey: repairRequestQueryKeys.stats(),
    queryFn: async () => {
      const result = await repairRequestService.getRepairRequestStats();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch statistics');
      }
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// ============================================
// Utility Hooks
// ============================================

// Hook to get status color
export const useRepairRequestStatusColor = (status: RepairRequestStatus): string => {
  const statusColors: Record<RepairRequestStatus, string> = {
    [RepairRequestStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [RepairRequestStatus.ACCEPTED]: 'bg-blue-100 text-blue-800',
    [RepairRequestStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800',
    [RepairRequestStatus.WAITING_FOR_PARTS]: 'bg-orange-100 text-orange-800',
    [RepairRequestStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [RepairRequestStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    [RepairRequestStatus.REJECTED]: 'bg-red-100 text-red-800',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

// Hook to get urgency color
export const useUrgencyLevelColor = (urgency: string): string => {
  const urgencyColors: Record<string, string> = {
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800',
  };

  return urgencyColors[urgency] || 'bg-gray-100 text-gray-800';
};
