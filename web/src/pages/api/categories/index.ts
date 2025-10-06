
import { categoriesService } from '@/services/categories.service';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const categoriesResult = await categoriesService.getAll();

    if (categoriesResult.success) {
      return res.status(200).json({
        success: true,
        data: categoriesResult.data
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch categories'
      });
    }
  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}