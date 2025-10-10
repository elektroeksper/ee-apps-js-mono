/**
 * Public Category Service - Client-side service for category operations
 * This service is used by client components to interact with the categories API
 * without requiring admin privileges
 */

import { ICategory } from '../shared-generated/types';

export interface PublicCategoryService {
  getMainCategories(): Promise<{ success: boolean; data?: ICategory[]; error?: string }>;
  getSubCategories(parentCategoryId: string): Promise<{ success: boolean; data?: ICategory[]; error?: string }>;
  getAllActiveCategories(): Promise<{ success: boolean; data?: ICategory[]; error?: string }>;
}

class CategoryPublicService implements PublicCategoryService {
  private baseUrl = '/api/categories';

  /**
   * Fetch main categories (parentCategoryId = null)
   */
  async getMainCategories(): Promise<{ success: boolean; data?: ICategory[]; error?: string }> {
    try {
      console.log('🔥 Public Category Service: Fetching main categories');

      const response = await fetch(`${this.baseUrl}?parentCategoryId=null`);
      const result = await response.json();

      if (!response.ok) {
        console.error('🔥 Public Category Service: API error', result);
        return {
          success: false,
          error: result.error || 'Failed to fetch main categories'
        };
      }

      console.log(`🔥 Public Category Service: Retrieved ${result.data?.length || 0} main categories`);

      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      console.error('🔥 Public Category Service: Network error', error);
      return {
        success: false,
        error: 'Network error while fetching main categories'
      };
    }
  }

  /**
   * Fetch subcategories for a specific parent category
   */
  async getSubCategories(parentCategoryId: string): Promise<{ success: boolean; data?: ICategory[]; error?: string }> {
    try {
      console.log('🔥 Public Category Service: Fetching subcategories for parent:', parentCategoryId);

      const response = await fetch(`${this.baseUrl}?parentCategoryId=${encodeURIComponent(parentCategoryId)}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('🔥 Public Category Service: API error', result);
        return {
          success: false,
          error: result.error || 'Failed to fetch subcategories'
        };
      }

      console.log(`🔥 Public Category Service: Retrieved ${result.data?.length || 0} subcategories for parent ${parentCategoryId}`);

      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      console.error('🔥 Public Category Service: Network error', error);
      return {
        success: false,
        error: 'Network error while fetching subcategories'
      };
    }
  }

  /**
   * Fetch all active categories (both main and sub)
   */
  async getAllActiveCategories(): Promise<{ success: boolean; data?: ICategory[]; error?: string }> {
    try {
      console.log('🔥 Public Category Service: Fetching all active categories');

      // Fetch without parentCategoryId filter to get all active categories
      const response = await fetch(`${this.baseUrl}?all=true`);
      const result = await response.json();

      if (!response.ok) {
        console.error('🔥 Public Category Service: API error', result);
        return {
          success: false,
          error: result.error || 'Failed to fetch all categories'
        };
      }

      console.log(`🔥 Public Category Service: Retrieved ${result.data?.length || 0} total active categories`);

      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      console.error('🔥 Public Category Service: Network error', error);
      return {
        success: false,
        error: 'Network error while fetching all categories'
      };
    }
  }
}

// Export singleton instance
export const categoryPublicService = new CategoryPublicService();

// Helper functions for React Query
export const categoryPublicApi = {
  getMainCategories: () => categoryPublicService.getMainCategories(),
  getSubCategories: (parentCategoryId: string) => categoryPublicService.getSubCategories(parentCategoryId),
  getAllActiveCategories: () => categoryPublicService.getAllActiveCategories(),
};