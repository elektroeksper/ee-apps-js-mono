/**
 * Admin Sliders API route
 * Handles CRUD operations for slider content using Firebase Admin SDK
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin';
import { ISliderItem } from '@/shared-generated';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetSliders(req, res);
      case 'POST':
        return await handleCreateSlider(req, res);
      case 'PUT':
        return await handleUpdateSlider(req, res);
      case 'DELETE':
        return await handleDeleteSlider(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin Sliders API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function verifyAdminAuth(req: NextApiRequest) {
  // Try to get token from session cookie first, then from Authorization header
  let token = req.cookies.session;

  if (!token) {
    // Fallback to Authorization header (for ID tokens)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    throw new Error('No authentication token found');
  }

  const decodedResult = await verifyIdToken(token);

  if (!decodedResult.success || !decodedResult.user) {
    throw new Error('Invalid token');
  }

  // Check if user has admin privileges
  const isAdmin = decodedResult.user.admin === true;

  if (!isAdmin) {
    throw new Error('Insufficient permissions');
  }

  return decodedResult.user;
}

async function handleGetSliders(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminAuth(req);

    const collection = adminDb.collection('content').doc('sliders').collection('items');
    const snapshot = await collection.orderBy('order', 'asc').get();

    const sliders: ISliderItem[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ISliderItem));

    return res.status(200).json({
      success: true,
      data: sliders
    });
  } catch (error: any) {
    console.error('Error fetching sliders:', error);
    if (error.message.includes('token') || error.message.includes('permissions')) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to fetch sliders' });
  }
}

async function handleCreateSlider(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await verifyAdminAuth(req);
    const sliderData = req.body;

    if (!sliderData || !sliderData.title || !sliderData.imageUrl) {
      return res.status(400).json({ error: 'Title and image URL are required' });
    }

    const newSlider = {
      ...sliderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.uid
    };

    const collection = adminDb.collection('content').doc('sliders').collection('items');
    const docRef = await collection.add(newSlider);

    const createdSlider = { id: docRef.id, ...newSlider } as ISliderItem;

    return res.status(201).json({
      success: true,
      data: createdSlider
    });
  } catch (error: any) {
    console.error('Error creating slider:', error);
    if (error.message.includes('token') || error.message.includes('permissions')) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to create slider' });
  }
}

async function handleUpdateSlider(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await verifyAdminAuth(req);
    const { id } = req.query;
    const updateData = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Slider ID is required' });
    }

    const updatedData = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid
    };

    const docRef = adminDb.collection('content').doc('sliders').collection('items').doc(id);
    await docRef.update(updatedData);

    return res.status(200).json({
      success: true,
      data: { id, ...updatedData }
    });
  } catch (error: any) {
    console.error('Error updating slider:', error);
    if (error.message.includes('token') || error.message.includes('permissions')) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to update slider' });
  }
}

async function handleDeleteSlider(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminAuth(req);
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Slider ID is required' });
    }

    const docRef = adminDb.collection('content').doc('sliders').collection('items').doc(id);
    await docRef.delete();

    return res.status(200).json({
      success: true,
      message: 'Slider deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting slider:', error);
    if (error.message.includes('token') || error.message.includes('permissions')) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to delete slider' });
  }
}