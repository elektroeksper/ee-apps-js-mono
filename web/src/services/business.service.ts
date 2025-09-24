/**
 * Business Service
 * Handles business entity operations using Next.js API routes
 * Focuses on business document management, not user-business relationships
 */

import { auth } from '@/lib/firebase-auth-config';
import { IBusiness, IBusinessFilter, IOperationResult } from '@/shared-generated';

export class BusinessService {
  private baseUrl = '/api/business';

  /**
   * Get current user's ID token for authentication
   * @private
   */
  private async getIdToken(): Promise<string | null> {
    try {
      if (!auth?.currentUser) {
        console.warn('No authenticated user found');
        return null;
      }

      const token = await auth.currentUser.getIdToken(true); // Force refresh
      return token;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Get request headers with authentication
   * @private
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Get all businesses with optional filtering
   * Admin-only operation
   */
  async getAll(filter?: IBusinessFilter): Promise<IOperationResult<IBusiness[]>> {
    try {
      const params = new URLSearchParams();

      if (filter?.status) {
        params.append('verificationStatus', filter.status);
      }

      if (filter?.ownerId) {
        params.append('ownerId', filter.ownerId);
      }

      if (filter?.userIds && filter.userIds.length > 0) {
        params.append('userIds', filter.userIds.join(','));
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Include session cookies as fallback
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 403) {
          return { success: false, error: 'Insufficient permissions - admin access required' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to fetch businesses' };
      }
    } catch (error) {
      console.error('BusinessService.getAll error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch businesses'
      };
    }
  }

  /**
   * Create a new business
   * Creates business document and links user as owner
   */
  async create(data: Partial<IBusiness>): Promise<IOperationResult<IBusiness>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 400) {
          const errorResult = await response.json();
          return { success: false, error: errorResult.error || 'Invalid business data' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to create business' };
      }
    } catch (error) {
      console.error('BusinessService.create error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create business'
      };
    }
  }

  /**
   * Get business by ID
   */
  async getById(id: string): Promise<IOperationResult<IBusiness>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Business not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to fetch business' };
      }
    } catch (error) {
      console.error('BusinessService.getById error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch business'
      };
    }
  }

  /**
   * Update business by ID
   */
  async update(id: string, data: Partial<IBusiness>): Promise<IOperationResult<IBusiness>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 403) {
          return { success: false, error: 'Insufficient permissions' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Business not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to update business' };
      }
    } catch (error) {
      console.error('BusinessService.update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update business'
      };
    }
  }

  /**
   * Delete business by ID (soft delete)
   */
  async delete(id: string): Promise<IOperationResult<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 403) {
          return { success: false, error: 'Insufficient permissions' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Business not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: undefined };
      } else {
        return { success: false, error: result.error || 'Failed to delete business' };
      }
    } catch (error) {
      console.error('BusinessService.delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete business'
      };
    }
  }

  /**
   * Verify business (approve/reject)
   * Admin-only operation
   */
  async verifyBusiness(id: string, approve: boolean, adminId: string, reason?: string): Promise<IOperationResult<void>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/verification/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include', // Include session cookies as fallback
        body: JSON.stringify({
          action: approve ? 'approve' : 'reject',
          adminId,
          reason: reason || undefined
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 403) {
          return { success: false, error: 'Insufficient permissions - admin access required' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Business not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return { success: true, data: undefined };
      } else {
        return { success: false, error: result.error || 'Failed to verify business' };
      }
    } catch (error) {
      console.error('BusinessService.verifyBusiness error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify business'
      };
    }
  }

  /**
   * Approve a business for verification
   * Admin-only operation - convenience method
   */
  async approveBusiness(businessId: string): Promise<IOperationResult<IBusiness>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/verification/${businessId}`, {
        method: 'PUT',
        headers,
        credentials: 'include', // Include session cookies as fallback
        body: JSON.stringify({
          action: 'approve'
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 403) {
          return { success: false, error: 'Insufficient permissions - admin access required' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Business not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to approve business' };
      }
    } catch (error) {
      console.error('BusinessService.approveBusiness error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve business'
      };
    }
  }

  /**
   * Reject a business for verification
   * Admin-only operation - convenience method
   */
  async rejectBusiness(businessId: string, reason: string): Promise<IOperationResult<IBusiness>> {
    try {
      if (!reason || reason.trim().length === 0) {
        return { success: false, error: 'Rejection reason is required' };
      }

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/verification/${businessId}`, {
        method: 'PUT',
        headers,
        credentials: 'include', // Include session cookies as fallback
        body: JSON.stringify({
          action: 'reject',
          reason: reason.trim()
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 403) {
          return { success: false, error: 'Insufficient permissions - admin access required' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Business not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to reject business' };
      }
    } catch (error) {
      console.error('BusinessService.rejectBusiness error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject business'
      };
    }
  }

  /**
   * Clear business rejection status
   * Admin-only operation - convenience method
   */
  async clearBusinessRejection(businessId: string): Promise<IOperationResult<IBusiness>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/verification/${businessId}`, {
        method: 'PUT',
        headers,
        credentials: 'include', // Include session cookies as fallback
        body: JSON.stringify({
          action: 'clear-rejection'
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized' };
        }
        if (response.status === 403) {
          return { success: false, error: 'Insufficient permissions - admin access required' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Business not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to clear business rejection' };
      }
    } catch (error) {
      console.error('BusinessService.clearBusinessRejection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear business rejection'
      };
    }
  }
}

// Export a singleton instance
export const businessService = new BusinessService();