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
      // User document doesn't exist - this can happen with Google Auth
      // Return a basic user structure that can be created later
      return res.status(404).json({
        error: 'User not found',
        shouldCreateUser: true
      });
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
    console.log('🔧 handleUpdate called for uid:', uid);

    // Verify authentication via session cookie
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
      console.log('❌ No session cookie found');
      return res.status(401).json({ error: 'No session found' });
    }

    const decodedResult = await verifyIdToken(sessionCookie);

    if (!decodedResult.success || !decodedResult.user) {
      console.log('❌ Session verification failed:', decodedResult.error);
      return res.status(401).json({ error: 'Invalid session' });
    }

    console.log('✅ Session verified for user:', decodedResult.user.uid);

    // Users can only update their own data
    if (decodedResult.user.uid !== uid) {
      console.log('❌ User mismatch:', { sessionUid: decodedResult.user.uid, requestUid: uid });

      // Clear invalid session cookies to force re-authentication
      res.setHeader('Set-Cookie', [
        `session=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/`,
        `user-id=; Max-Age=0; Secure; SameSite=Lax; Path=/`
      ]);

      return res.status(403).json({
        error: 'Session user mismatch - please re-authenticate',
        code: 'USER_MISMATCH',
        shouldLogout: true
      });
    }

    const updateData = req.body;
    console.log('📝 Update data received:', JSON.stringify(updateData, null, 2));

    // Remove undefined values and validate
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length === 0) {
      console.log('❌ No valid data to update');
      return res.status(400).json({ error: 'No valid data to update' });
    }

    console.log('📝 Cleaned data:', JSON.stringify(cleanedData, null, 2));

    // Create or update the user document (use set with merge to handle both cases)
    await adminDb.collection('users').doc(uid).set({
      ...cleanedData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('✅ User document updated successfully');

    // Fetch and return updated document
    const updatedDoc = await adminDb.collection('users').doc(uid).get();
    const updatedData = updatedDoc.data() as IAppUser;

    console.log('✅ Returning updated data for user:', updatedData?.id);

    return res.status(200).json({
      success: true,
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}