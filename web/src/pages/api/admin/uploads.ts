/**
 * Admin File Management API
 * Handles file uploads and listing for admin purposes (images for sliders, etc.)
 */

import { adminAuth, adminDb, verifyIdToken } from '@/lib/firebase-admin';
import { FB_COLL_NAMES, IUploadItem, IUploadListResponse, IUploadResponse } from '@/shared-generated';
import { getStorage } from 'firebase-admin/storage';
import { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IUploadResponse | IUploadListResponse>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetFiles(req, res);
      case 'POST':
        return await handleUploadFile(req, res);
      case 'DELETE':
        return await handleDeleteFile(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed', success: false });
    }
  } catch (error) {
    console.error('Admin Files API error:', error);
    return res.status(500).json({ error: 'Internal server error', success: false });
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
  const userRecord = await adminAuth.getUser(decodedResult.user.uid);
  const userClaims = userRecord.customClaims || {};
  const isAdmin = userClaims.admin === true || userClaims.role === 'admin' || decodedResult.user.admin === true;

  if (!isAdmin) {
    throw new Error('Insufficient permissions');
  }

  return decodedResult.user;
}

async function handleGetFiles(req: NextApiRequest, res: NextApiResponse<IUploadListResponse>) {
  try {
    await verifyAdminAuth(req);

    const { category = 'all' } = req.query;

    // Get files from database
    const filesCollection = adminDb.collection(FB_COLL_NAMES.files);
    let query = category !== 'all' && typeof category === 'string'
      ? filesCollection.where('category', '==', category)
      : filesCollection;

    const snapshot = await query.orderBy('uploadedAt', 'desc').get();

    const files: IUploadItem[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IUploadItem));

    return res.status(200).json({
      success: true,
      data: files
    });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    if (error.message.includes('token') || error.message.includes('permissions')) {
      return res.status(401).json({ error: error.message, success: false });
    }
    return res.status(500).json({ error: 'Failed to fetch files', success: false });
  }
}

async function handleUploadFile(req: NextApiRequest, res: NextApiResponse<IUploadResponse>) {
  try {
    const user = await verifyAdminAuth(req);
    const { fileName, fileData, category = 'general', metadata } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'File name and data are required', success: false });
    }

    // Validate file type (only images for now)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const extension = fileName.toLowerCase().split('.').pop();

    if (!extension || !allowedExtensions.includes(extension)) {
      return res.status(400).json({
        error: 'Only image files are allowed (jpg, jpeg, png, gif, webp, bmp)',
        success: false
      });
    }

    // Initialize Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();

    // Generate file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `files/${category}/${timestamp}_${sanitizedFileName}`;

    // Convert base64 to buffer
    const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Upload to Firebase Storage
    const file = bucket.file(filePath);
    await file.save(fileBuffer, {
      metadata: {
        contentType: getContentType(fileName),
        metadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
          originalName: fileName,
          category,
          ...metadata
        }
      }
    });

    // Generate public URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

    // Save file metadata to database
    const fileRecord: Omit<IUploadItem, 'id'> = {
      name: fileName,
      url: publicUrl,
      size: fileBuffer.length,
      type: getContentType(fileName),
      category,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.uid
    };

    const docRef = await adminDb.collection(FB_COLL_NAMES.files).add(fileRecord);
    const createdFile: IUploadItem = { id: docRef.id, ...fileRecord };

    return res.status(201).json({
      success: true,
      data: createdFile
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    if (error.message.includes('token') || error.message.includes('permissions')) {
      return res.status(401).json({ error: error.message, success: false });
    }
    return res.status(500).json({ error: 'Failed to upload file', success: false });
  }
}

async function handleDeleteFile(req: NextApiRequest, res: NextApiResponse<{ success: boolean; error?: string }>) {
  try {
    await verifyAdminAuth(req);
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'File ID is required', success: false });
    }

    // Get file metadata from database
    const fileDoc = await adminDb.collection(FB_COLL_NAMES.files).doc(id).get();

    if (!fileDoc.exists) {
      return res.status(404).json({ error: 'File not found', success: false });
    }

    const fileData = fileDoc.data() as IUploadItem;

    // Delete from Firebase Storage
    try {
      const storage = getStorage();
      const bucket = storage.bucket();

      // Extract file path from URL
      const urlParts = fileData.url.split('/o/')[1];
      const filePath = decodeURIComponent(urlParts.split('?')[0]);

      const file = bucket.file(filePath);
      await file.delete();
    } catch (storageError) {
      console.warn('Failed to delete file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await adminDb.collection(FB_COLL_NAMES.files).doc(id).delete();

    return res.status(200).json({
      success: true
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    if (error.message.includes('token') || error.message.includes('permissions')) {
      return res.status(401).json({ error: error.message, success: false });
    }
    return res.status(500).json({ error: 'Failed to delete file', success: false });
  }
}

function getContentType(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'application/octet-stream';
  }
}