import { serverCategoryService } from '@/services/category-server.service';
import { IApiResponse } from '@/shared';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IApiResponse<boolean>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { categoryId } = req.query;

    if (!categoryId || typeof categoryId !== 'string') {
      return res.status(400).json({ success: false, error: 'Category ID is required' });
    }

    const result = await serverCategoryService.checkHasSubCategories(categoryId);

    if (result.success) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('🔥 API /admin/categories/has-subcategories: Error occurred', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check subcategories'
    });
  }
}