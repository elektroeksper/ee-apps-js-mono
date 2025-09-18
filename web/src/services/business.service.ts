import { functions } from '@/config/firebase';
import {
  IBusiness,
  IBusinessFilter,
  IOperationResult
} from '@/shared-generated';
import { httpsCallable } from 'firebase/functions';

export class BusinessService {
  // Create business
  async create(businessData: Partial<IBusiness>): Promise<IOperationResult<IBusiness>> {
    try {
      const createBusinessFunction = httpsCallable(functions, 'createBusiness');
      const result = await createBusinessFunction({ businessData });
      return result.data as IOperationResult<IBusiness>;
    } catch (error: any) {
      console.error('BusinessService.create error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create business'
      };
    }
  }

  // Get all businesses (Admin only)
  async getAll(filter?: IBusinessFilter): Promise<IOperationResult<IBusiness[]>> {
    try {
      const getAllBusinessesFunction = httpsCallable(functions, 'getAllBusinesses');
      const result = await getAllBusinessesFunction({ filter });
      return result.data as IOperationResult<IBusiness[]>;
    } catch (error: any) {
      console.error('BusinessService.getAll error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch businesses'
      };
    }
  }

  // Get business by ID
  async getById(businessId: string): Promise<IOperationResult<IBusiness>> {
    try {
      const getBusinessFunction = httpsCallable(functions, 'getBusiness');
      const result = await getBusinessFunction({ businessId });
      return result.data as IOperationResult<IBusiness>;
    } catch (error: any) {
      console.error('BusinessService.getById error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch business'
      };
    }
  }

  // Update business
  async update(businessId: string, updates: Partial<IBusiness>): Promise<IOperationResult<IBusiness>> {
    try {
      const updateBusinessFunction = httpsCallable(functions, 'updateBusiness');
      const result = await updateBusinessFunction({ businessId, updates });
      return result.data as IOperationResult<IBusiness>;
    } catch (error: any) {
      console.error('BusinessService.update error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update business'
      };
    }
  }

  // Approve business (Admin only)
  async approve(businessId: string): Promise<IOperationResult<void>> {
    try {
      const approveBusinessFunction = httpsCallable(functions, 'approveBusiness');
      const result = await approveBusinessFunction({ businessId });
      return result.data as IOperationResult<void>;
    } catch (error: any) {
      console.error('BusinessService.approve error:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve business'
      };
    }
  }

  // Reject business (Admin only)
  async reject(businessId: string, reason?: string): Promise<IOperationResult<void>> {
    try {
      const rejectBusinessFunction = httpsCallable(functions, 'rejectBusiness');
      const result = await rejectBusinessFunction({ businessId, reason });
      return result.data as IOperationResult<void>;
    } catch (error: any) {
      console.error('BusinessService.reject error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reject business'
      };
    }
  }

  // Remove user from business
  async removeUser(businessId: string, userId: string): Promise<IOperationResult<void>> {
    try {
      const removeUserFunction = httpsCallable(functions, 'removeUserFromBusiness');
      const result = await removeUserFunction({ businessId, userId });
      return result.data as IOperationResult<void>;
    } catch (error: any) {
      console.error('BusinessService.removeUser error:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove user from business'
      };
    }
  }
}

export const businessService = new BusinessService();