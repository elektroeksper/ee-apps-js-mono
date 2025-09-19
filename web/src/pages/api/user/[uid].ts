/**
 * User API route for managing user documents
 * Handles user CRUD operations using Firebase Admin SDK
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin';
import { IAppUser } from '@/shared-generated';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { uid } = req.query;

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, uid);
      case 'PUT':
        return await handleUpdate(req, res, uid);
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string
) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data() as IAppUser;
    return res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function handleUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string
) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.split(' ')[1];
    const decodedResult = await verifyIdToken(token);

    if (!decodedResult.success || !decodedResult.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Users can only update their own data
    if (decodedResult.user.uid !== uid) {
      return res.status(403).json({ error: 'Unauthorized to update this user' });
    }

    const updateData = req.body;

    // Remove undefined values and validate
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length === 0) {
      return res.status(400).json({ error: 'No valid data to update' });
    }

    // Update the user document
    await adminDb.collection('users').doc(uid).update({
      ...cleanedData,
      updatedAt: new Date().toISOString()
    });

    // Fetch and return updated document
    const updatedDoc = await adminDb.collection('users').doc(uid).get();
    const updatedData = updatedDoc.data() as IAppUser;

    return res.status(200).json({
      success: true,
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}