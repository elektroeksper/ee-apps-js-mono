/**
 * Repair Request Service
 * Handles repair request operations using Next.js API routes
 */

import {
  ICreateRepairRequestDTO,
  IOperationResult,
  IRepairRequestFilter,
  IUpdateRepairRequestDTO,
  RepairRequestStatus
} from '@/shared-generated';

export class RepairRequestService {
  private baseUrl = '/api/repair-requests';

  async getMyRepairRequests(customerId?: string): Promise<IOperationResult<any[]>> {
    try {
      const params = new URLSearchParams();
      if (customerId) {
        params.append('customerId', customerId);
      }

      const url = `${this.baseUrl}/my${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include session cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 403) {
          return { success: false, error: 'Insufficient permissions' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to fetch repair requests' };
      }
    } catch (error) {
      console.error('RepairRequestService.getMyRepairRequests error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch repair requests'
      };
    }
  }

  async getRepairRequestById(id: string): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to fetch repair request' };
      }
    } catch (error) {
      console.error('RepairRequestService.getRepairRequestById error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch repair request'
      };
    }
  }

  async createRepairRequest(data: ICreateRepairRequestDTO): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 400) {
          const result = await response.json();
          return { success: false, error: result.error || 'Invalid data' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to create repair request' };
      }
    } catch (error) {
      console.error('RepairRequestService.createRepairRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create repair request'
      };
    }
  }

  async cancelRepairRequest(id: string, reason?: string): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to cancel repair request' };
      }
    } catch (error) {
      console.error('RepairRequestService.cancelRepairRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel repair request'
      };
    }
  }

  async getAssignedRepairRequests(filter?: IRepairRequestFilter): Promise<IOperationResult<any[]>> {
    try {
      const params = new URLSearchParams();

      if (filter) {
        if (filter.status) {
          if (Array.isArray(filter.status)) {
            filter.status.forEach(status => params.append('status', status));
          } else {
            params.append('status', filter.status);
          }
        }
        if (filter.assignedTechnicianId) params.append('assignedTechnicianId', filter.assignedTechnicianId);
        if (filter.assignedDealerId) params.append('assignedDealerId', filter.assignedDealerId);
        if (filter.customerId) params.append('customerId', filter.customerId);
      }

      const url = `${this.baseUrl}/assigned${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to fetch assigned repair requests' };
      }
    } catch (error) {
      console.error('RepairRequestService.getAssignedRepairRequests error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch assigned repair requests'
      };
    }
  }

  async acceptRepairRequest(id: string, estimatedCost?: number): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ estimatedCost }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to accept repair request' };
      }
    } catch (error) {
      console.error('RepairRequestService.acceptRepairRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to accept repair request'
      };
    }
  }

  async rejectRepairRequest(id: string, reason?: string): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to reject repair request' };
      }
    } catch (error) {
      console.error('RepairRequestService.rejectRepairRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject repair request'
      };
    }
  }

  async updateRepairRequestStatus(id: string, status: RepairRequestStatus, comment?: string): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, comment }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to update status' };
      }
    } catch (error) {
      console.error('RepairRequestService.updateRepairRequestStatus error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update status'
      };
    }
  }

  async updateRepairRequest(id: string, data: IUpdateRepairRequestDTO): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to update repair request' };
      }
    } catch (error) {
      console.error('RepairRequestService.updateRepairRequest error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update repair request'
      };
    }
  }

  async assignTechnician(requestId: string, technicianId: string): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${requestId}/assign-technician`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ technicianId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to assign technician' };
      }
    } catch (error) {
      console.error('RepairRequestService.assignTechnician error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign technician'
      };
    }
  }

  async addNote(requestId: string, note: string, isInternal: boolean = false, attachments?: string[]): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${requestId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ note, isInternal, attachments }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to add note' };
      }
    } catch (error) {
      console.error('RepairRequestService.addNote error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add note'
      };
    }
  }

  async getNotes(requestId: string): Promise<IOperationResult<any[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/${requestId}/notes`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to fetch notes' };
      }
    } catch (error) {
      console.error('RepairRequestService.getNotes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notes'
      };
    }
  }

  async getAllRepairRequests(filter?: IRepairRequestFilter): Promise<IOperationResult<any[]>> {
    try {
      const params = new URLSearchParams();

      if (filter) {
        if (filter.status) {
          if (Array.isArray(filter.status)) {
            filter.status.forEach(status => params.append('status', status));
          } else {
            params.append('status', filter.status);
          }
        }
        if (filter.assignedTechnicianId) params.append('assignedTechnicianId', filter.assignedTechnicianId);
        if (filter.assignedDealerId) params.append('assignedDealerId', filter.assignedDealerId);
        if (filter.customerId) params.append('customerId', filter.customerId);
      }

      const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to fetch repair requests' };
      }
    } catch (error) {
      console.error('RepairRequestService.getAllRepairRequests error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch repair requests'
      };
    }
  }

  async assignDealer(requestId: string, dealerId: string): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${requestId}/assign-dealer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ dealerId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Repair request not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to assign dealer' };
      }
    } catch (error) {
      console.error('RepairRequestService.assignDealer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign dealer'
      };
    }
  }

  async getRepairRequestStats(): Promise<IOperationResult<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to fetch stats' };
      }
    } catch (error) {
      console.error('RepairRequestService.getRepairRequestStats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats'
      };
    }
  }
}

// Export a singleton instance
export const repairRequestService = new RepairRequestService();