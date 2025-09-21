/**
 * Content API Route - Server-side content operations
 * Handles all content CRUD operations using Firebase Admin SDK
 * Solves Next.js 15 build issues by moving Firebase operations to API routes
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';

type ContentType = 'about' | 'branding' | 'contact';

interface ContentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContentResponse>
) {
  const { type } = req.query;

  if (!type || typeof type !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Content type is required'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getContent(req, res, type as ContentType);
      case 'POST':
      case 'PUT':
        return await updateContent(req, res, type as ContentType);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('Content API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function getContent(
  req: NextApiRequest,
  res: NextApiResponse<ContentResponse>,
  type: ContentType
) {
  try {
    const docRef = adminDb.collection('content').doc(type);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: `${type} content not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    console.error(`Error fetching ${type} content:`, error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch ${type} content`
    });
  }
}

async function updateContent(
  req: NextApiRequest,
  res: NextApiResponse<ContentResponse>,
  type: ContentType
) {
  try {
    // Verify admin authentication for updates
    let token = req.cookies.session;

    if (!token) {
      // Fallback to Authorization header (for ID tokens)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token found'
      });
    }

    const decodedResult = await verifyIdToken(token);

    if (!decodedResult.success || !decodedResult.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Check if user has admin privileges
    const isAdmin = decodedResult.user.admin === true;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    const contentData = req.body;

    if (!contentData) {
      return res.status(400).json({
        success: false,
        error: 'Content data is required'
      });
    }

    const docRef = adminDb.collection('content').doc(type);

    // Update with timestamp
    const updateData = {
      ...contentData,
      updatedAt: new Date().toISOString(),
      updatedBy: decodedResult.user.uid
    };

    await docRef.set(updateData, { merge: true });

    return res.status(200).json({
      success: true,
      data: updateData
    });
  } catch (error) {
    console.error(`Error updating ${type} content:`, error);
    return res.status(500).json({
      success: false,
      error: `Failed to update ${type} content`
    });
  }
}