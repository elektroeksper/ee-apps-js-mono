import { serverCategoryService } from '@/services/category-server.service';
import { IApiResponse, ICategory, ICategoryFilter } from '@/shared';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IApiResponse<ICategory[] | ICategory | void>>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('🔥 API /admin/categories: Unhandled error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// GET /api/admin/categories - Get all categories with optional filtering
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const filter: ICategoryFilter = {};

  console.log('🔥 API handleGet: Raw query params', req.query);

  if (req.query.parentCategoryId !== undefined) {
    filter.parentCategoryId = req.query.parentCategoryId === 'null' ? null : req.query.parentCategoryId as string;
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  console.log('🔥 API handleGet: Processed filter', filter);
  const result = await serverCategoryService.getAll(filter);

  if (result.success) {
    return res.status(200).json({ success: true, data: result.data });
  } else {
    return res.status(500).json({ success: false, error: result.error });
  }
}

// POST /api/admin/categories - Create a new category
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔥 API handlePost: Received category creation request');
  console.log('🔥 API handlePost: Request body:', JSON.stringify(req.body, null, 2));

  const categoryData = req.body;

  const result = await serverCategoryService.create(categoryData);

  console.log('🔥 API handlePost: Service result:', JSON.stringify(result, null, 2));

  if (result.success) {
    return res.status(201).json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
}

// PUT /api/admin/categories - Update a category
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { categoryId, ...categoryData } = req.body;

  if (!categoryId) {
    return res.status(400).json({ success: false, error: 'Category ID is required' });
  }

  const result = await serverCategoryService.update(categoryId, categoryData);

  if (result.success) {
    return res.status(200).json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
}

// DELETE /api/admin/categories - Delete a category
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { categoryId } = req.body;

  if (!categoryId) {
    return res.status(400).json({ success: false, error: 'Category ID is required' });
  }

  const result = await serverCategoryService.delete(categoryId);

  if (result.success) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
}