/**
 * User Service
 * Handles user profile operations using Next.js API routes
 */

import { IAppUser, IOperationResult, IUserFilter, IUserService } from '@/shared-generated';

export class UserService implements IUserService {
  private baseUrl = '/api/user';

  async getById(id: string): Promise<IOperationResult<IAppUser>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        credentials: 'include', // Include session cookies
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'User not found' };
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
        return { success: false, error: result.error || 'Failed to fetch user' };
      }
    } catch (error) {
      console.error('UserService.getById error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user'
      };
    }
  }

  async update(id: string, data: Partial<IAppUser>): Promise<IOperationResult<IAppUser>> {
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
          return { success: false, error: 'Forbidden - cannot update this user' };
        }
        if (response.status === 404) {
          return { success: false, error: 'User not found' };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to update user' };
      }
    } catch (error) {
      console.error('UserService.update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user'
      };
    }
  }

  async checkExists(uid: string): Promise<boolean> {
    try {
      const result = await this.getById(uid);
      return result.success;
    } catch (error) {
      console.error('UserService.checkExists error:', error);
      return false;
    }
  }

  async getAll(filter?: IUserFilter): Promise<IOperationResult<IAppUser[]>> {
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (filter) {
        if (filter.accountType) params.append('accountType', filter.accountType);
        if (filter.email) params.append('email', filter.email);
        if (filter.firstName) params.append('firstName', filter.firstName);
        if (filter.lastName) params.append('lastName', filter.lastName);
        if (filter.isDeleted !== undefined) params.append('isDeleted', filter.isDeleted.toString());
      }

      const url = `/api/users${params.toString() ? `?${params.toString()}` : ''}`;

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
        return { success: false, error: result.error || 'Failed to fetch users' };
      }
    } catch (error) {
      console.error('UserService.getAll error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      };
    }
  }

  async create(data: Partial<IAppUser>): Promise<IOperationResult<IAppUser>> {
    try {
      const response = await fetch('/api/users', {
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
        if (response.status === 403) {
          return { success: false, error: 'Insufficient permissions' };
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
        return { success: false, error: result.error || 'Failed to create user' };
      }
    } catch (error) {
      console.error('UserService.create error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
    }
  }

  async delete(uid: string): Promise<IOperationResult<void>> {
    // TODO: Implement DELETE /api/user/[uid] endpoint
    return {
      success: false,
      error: 'delete method not yet implemented with API routes'
    };
  }
}

// Export a singleton instance
export const userService = new UserService();