
import { categoriesService } from '@/services/category.service';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔥 Public Categories API: Query params', req.query);

    // Build filter from query parameters
    const filter: any = {
      isActive: true, // Always return only active categories for public API
    };

    // Handle special "all" parameter to fetch all active categories
    if (req.query.all === 'true') {
      // Don't filter by parentCategoryId - return all active categories
    } else if (req.query.parentCategoryId !== undefined) {
      if (req.query.parentCategoryId === 'null') {
        filter.parentCategoryId = null; // Main categories
      } else {
        filter.parentCategoryId = req.query.parentCategoryId as string; // Subcategories
      }
    } else {
      // Default: return main categories only if no parentCategoryId specified
      filter.parentCategoryId = null;
    }

    console.log('🔥 Public Categories API: Using filter', filter);

    const categoriesResult = await categoriesService.getAll(filter);

    if (categoriesResult.success) {
      // Sort categories by order, then by name
      const sortedCategories = (categoriesResult.data || []).sort((a, b) => {
        if (a.order && b.order) {
          return a.order - b.order;
        }
        if (a.order) return -1;
        if (b.order) return 1;
        return a.name.localeCompare(b.name);
      });

      console.log(`🔥 Public Categories API: Returning ${sortedCategories.length} categories`);

      return res.status(200).json({
        success: true,
        data: sortedCategories
      });
    } else {
      console.error('🔥 Public Categories API: Service error', categoriesResult.error);
      return res.status(500).json({
        success: false,
        error: categoriesResult.error || 'Failed to fetch categories'
      });
    }
  } catch (error) {
    console.error('🔥 Public Categories API: Unexpected error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}