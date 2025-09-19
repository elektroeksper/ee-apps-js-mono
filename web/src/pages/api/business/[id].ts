/**
 * Business by ID API route
 * Handles GET, PUT, DELETE operations for individual business entities
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin';
import { IBusiness } from '@/shared-generated';
import { Timestamp } from 'firebase-admin/firestore';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGetBusiness(req, res, id);
      case 'PUT':
        return await handleUpdateBusiness(req, res, id);
      case 'DELETE':
        return await handleDeleteBusiness(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Business by ID API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetBusiness(
  req: NextApiRequest,
  res: NextApiResponse,
  businessId: string
) {
  try {
    // Verify authentication via session cookie
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
      return res.status(401).json({ error: 'No session found' });
    }

    const decodedResult = await verifyIdToken(sessionCookie);

    if (!decodedResult.success || !decodedResult.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const userId = decodedResult.user.uid;
    const userClaims = decodedResult.user.customClaims || {};
    const isAdmin = userClaims.admin === true || userClaims.role === 'admin';

    // Get business document
    const businessDoc = await adminDb.collection('businesses').doc(businessId).get();

    if (!businessDoc.exists) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const businessData = businessDoc.data() as IBusiness;

    // Check permissions: Admin can access any business, users can only access their own
    if (!isAdmin && businessData.ownerId !== userId && !businessData.users?.[userId]) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const business: IBusiness = {
      id: businessDoc.id,
      ...businessData
    };

    return res.status(200).json({
      success: true,
      data: business
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return res.status(500).json({ error: 'Failed to fetch business' });
  }
}

async function handleUpdateBusiness(
  req: NextApiRequest,
  res: NextApiResponse,
  businessId: string
) {
  try {
    // Verify authentication via session cookie
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
      return res.status(401).json({ error: 'No session found' });
    }

    const decodedResult = await verifyIdToken(sessionCookie);

    if (!decodedResult.success || !decodedResult.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const userId = decodedResult.user.uid;
    const updateData = req.body;

    // Get business document
    const businessDoc = await adminDb.collection('businesses').doc(businessId).get();

    if (!businessDoc.exists) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const businessData = businessDoc.data() as IBusiness;

    // Check permissions: Only owner or users with edit permissions can update
    const userInfo = businessData.users?.[userId];
    const isOwner = businessData.ownerId === userId;
    const hasEditPermission = userInfo?.permissions?.canEditBusinessInfo;

    if (!isOwner && !hasEditPermission) {
      return res.status(403).json({ error: 'Insufficient permissions to edit business' });
    }

    // Prepare update object (exclude sensitive fields)
    const allowedFields = [
      'businessName',
      'taxNumber',
      'taxOffice',
      'taxNumberType',
      'identityNumber',
      'addresses',
      'phone',
      'email',
      'description',
      'website',
      'companySize',
      'documents',
      'mainCategoryId',
      'subCategoryIds'
    ];

    const filteredUpdateData: Partial<IBusiness> = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field as keyof IBusiness] = updateData[field];
      }
    });

    // Add update metadata
    (filteredUpdateData as any).updatedAt = Timestamp.now();

    // Update business document
    await adminDb.collection('businesses').doc(businessId).update(filteredUpdateData);

    // Fetch updated business
    const updatedDoc = await adminDb.collection('businesses').doc(businessId).get();
    const updatedBusiness: IBusiness = {
      id: businessId,
      ...updatedDoc.data()
    } as IBusiness;

    return res.status(200).json({
      success: true,
      data: updatedBusiness,
      message: 'Business updated successfully'
    });
  } catch (error) {
    console.error('Error updating business:', error);
    return res.status(500).json({ error: 'Failed to update business' });
  }
}

async function handleDeleteBusiness(
  req: NextApiRequest,
  res: NextApiResponse,
  businessId: string
) {
  try {
    // Verify authentication via session cookie
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
      return res.status(401).json({ error: 'No session found' });
    }

    const decodedResult = await verifyIdToken(sessionCookie);

    if (!decodedResult.success || !decodedResult.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const userId = decodedResult.user.uid;
    const userClaims = decodedResult.user.customClaims || {};
    const isAdmin = userClaims.admin === true || userClaims.role === 'admin';

    // Get business document
    const businessDoc = await adminDb.collection('businesses').doc(businessId).get();

    if (!businessDoc.exists) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const businessData = businessDoc.data() as IBusiness;

    // Check permissions: Only admin or owner with delete permissions can delete
    const userInfo = businessData.users?.[userId];
    const isOwner = businessData.ownerId === userId;
    const hasDeletePermission = userInfo?.permissions?.canDeleteBusiness;

    if (!isAdmin && !isOwner && !hasDeletePermission) {
      return res.status(403).json({ error: 'Insufficient permissions to delete business' });
    }

    // Start a transaction to handle business deletion and user updates
    const batch = adminDb.batch();

    // Soft delete: Mark business as inactive instead of hard delete
    const businessRef = adminDb.collection('businesses').doc(businessId);
    batch.update(businessRef, {
      isActive: false,
      updatedAt: Timestamp.now()
    });

    // Update all associated users to remove business info
    const userIds = Object.keys(businessData.users || {});
    for (const userIdToUpdate of userIds) {
      const userRef = adminDb.collection('users').doc(userIdToUpdate);
      batch.update(userRef, {
        businessInfo: null,
        updatedAt: Timestamp.now()
      });
    }

    // Commit the transaction
    await batch.commit();

    return res.status(200).json({
      success: true,
      message: 'Business deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting business:', error);
    return res.status(500).json({ error: 'Failed to delete business' });
  }
}