/**
 * Business hooks for business data and operations
 */

import { BusinessUserRole, IBusiness } from '@/shared-generated';
import { BusinessService } from '@/shared-generated/services/business.service';
import { UserService } from '@/shared-generated/services/user.service';
import { useCallback, useEffect, useState } from 'react';

// Business service instances
const businessService = new BusinessService();
const userService = new UserService();

/**
 * Hook to fetch and manage business data for a user
 */
export function useBusiness(userId: string | null) {
  const [business, setBusiness] = useState<IBusiness | null>(null);
  const [businessRole, setBusinessRole] = useState<BusinessUserRole | null>(null);
  const [businessPermissions, setBusinessPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    if (!userId) {
      setBusiness(null);
      setBusinessRole(null);
      setBusinessPermissions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await userService.getUserWithBusiness(userId);

      if (result.success && result.data) {
        const userWithBusiness: IUserWithBusiness = result.data;
        setBusiness(userWithBusiness.business || null);
        setBusinessRole(userWithBusiness.businessRole || null);

        // Convert business permissions object to array of permissions
        const permissions: string[] = [];
        if (userWithBusiness.businessPermissions) {
          Object.entries(userWithBusiness.businessPermissions).forEach(([key, value]) => {
            if (value === true) {
              permissions.push(key);
            }
          });
        }
        setBusinessPermissions(permissions);
      } else {
        setBusiness(null);
        setBusinessRole(null);
        setBusinessPermissions([]);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err: any) {
      console.error('Error fetching business data:', err);
      setError(err.message || 'Failed to fetch business data');
      setBusiness(null);
      setBusinessRole(null);
      setBusinessPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const refresh = useCallback(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const leaveBusiness = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await userService.leaveBusiness(userId);
      if (result.success) {
        // Refresh the data to reflect changes
        await refresh();
      }
      return result;
    } catch (err: any) {
      console.error('Error leaving business:', err);
      return { success: false, error: err.message || 'Failed to leave business' };
    }
  }, [userId, refresh]);

  const acceptInvitation = useCallback(async (token: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await userService.acceptBusinessInvitation(userId, token);
      if (result.success) {
        // Refresh the data to reflect changes
        await refresh();
      }
      return result;
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      return { success: false, error: err.message || 'Failed to accept invitation' };
    }
  }, [userId, refresh]);

  // Permission helper functions
  const hasPermission = useCallback((permission: string): boolean => {
    return businessPermissions.includes(permission);
  }, [businessPermissions]);

  const canEditBusiness = hasPermission('canEditBusinessInfo');
  const canInviteUsers = hasPermission('canInviteUsers');
  const canManageUsers = hasPermission('canRemoveUsers') || hasPermission('canChangeUserRoles');
  const canViewOrders = hasPermission('canViewOrders');
  const canManageOrders = hasPermission('canManageOrders');

  return {
    business,
    businessRole,
    businessPermissions,
    isLoading,
    error,
    refresh,
    leaveBusiness,
    acceptInvitation,
    hasPermission,
    canEditBusiness,
    canInviteUsers,
    canManageUsers,
    canViewOrders,
    canManageOrders,
  };
}

/**
 * Hook for business operations (create, update, manage users)
 */
export function useBusinessOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBusiness = useCallback(async (businessData: any): Promise<{ success: boolean; data?: IBusiness; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await businessService.createBusiness(businessData);
      return result;
    } catch (err: any) {
      console.error('Error creating business:', err);
      const errorMsg = err.message || 'Failed to create business';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBusiness = useCallback(async (businessId: string, updates: Partial<IBusiness>): Promise<{ success: boolean; data?: IBusiness; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await businessService.updateBusiness(businessId, updates);
      return result;
    } catch (err: any) {
      console.error('Error updating business:', err);
      const errorMsg = err.message || 'Failed to update business';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const inviteUser = useCallback(async (businessId: string, email: string, role: BusinessUserRole, invitedBy: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await businessService.inviteUser(businessId, email, role, invitedBy, name);
      return result;
    } catch (err: any) {
      console.error('Error inviting user:', err);
      const errorMsg = err.message || 'Failed to invite user';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeUser = useCallback(async (businessId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await businessService.removeUser(businessId, userId);
      return result;
    } catch (err: any) {
      console.error('Error removing user:', err);
      const errorMsg = err.message || 'Failed to remove user';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (businessId: string, userId: string, newRole: BusinessUserRole): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await businessService.updateUserRole(businessId, userId, newRole);
      return result;
    } catch (err: any) {
      console.error('Error updating user role:', err);
      const errorMsg = err.message || 'Failed to update user role';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createBusiness,
    updateBusiness,
    inviteUser,
    removeUser,
    updateUserRole,
  };
}
