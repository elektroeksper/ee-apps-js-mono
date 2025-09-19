/**
 * Business Documents API Route - Handles business document operations
 * Upload, retrieve, and manage business verification documents
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { DocumentStatus, UserDocument, UserDocumentCategory } from '@/shared-generated';
import { randomUUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

interface DocumentsResponse {
  success: boolean;
  data?: UserDocument[] | UserDocument;
  error?: string;
  code?: number;
}

interface UploadDocumentRequest {
  fileName: string;
  category: UserDocumentCategory;
  fileData: string; // base64 encoded file
  metadata?: {
    description?: string;
    tags?: string[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DocumentsResponse>
) {
  try {
    // Verify authentication
    const sessionCookie = req.cookies.session;
    if (!sessionCookie) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 401
      });
    }

    // Verify session cookie
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // Check if user is a business user
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 404
      });
    }

    const userData = userDoc.data();
    if (userData?.accountType !== 'business') {
      return res.status(403).json({
        success: false,
        error: 'Business account required',
        code: 403
      });
    }

    switch (req.method) {
      case 'GET':
        return await getDocuments(req, res, userId);
      case 'POST':
        return await uploadDocument(req, res, userId);
      case 'DELETE':
        return await deleteDocument(req, res, userId);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`
        });
    }
  } catch (error: any) {
    console.error('Business documents API error:', error);

    if (error.code === 'auth/session-cookie-expired') {
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        code: 401
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 500
    });
  }
}

async function getDocuments(
  req: NextApiRequest,
  res: NextApiResponse<DocumentsResponse>,
  userId: string
) {
  try {
    const documentsCollection = adminDb.collection('businessDocuments');
    const query = documentsCollection.where('userId', '==', userId);
    const snapshot = await query.get();

    const documents: UserDocument[] = [];
    snapshot.forEach(doc => {
      const docData = doc.data();
      documents.push({
        name: docData.originalName || docData.fileName,
        url: docData.downloadUrl || docData.fileUrl,
        type: docData.fileType || getFileTypeFromName(docData.fileName),
        fullPath: docData.filePath,
        category: docData.category,
        uploadedAt: docData.uploadedAt,
        size: docData.size || 0,
        metadata: {
          ...docData.metadata,
          documentId: doc.id,
          userId: docData.userId,
          status: docData.status || DocumentStatus.PENDING
        }
      });
    });

    // Sort by upload date (newest first)
    documents.sort((a, b) => {
      const aDate = new Date(a.uploadedAt || 0);
      const bDate = new Date(b.uploadedAt || 0);
      return bDate.getTime() - aDate.getTime();
    });

    return res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching business documents:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
}

async function uploadDocument(
  req: NextApiRequest,
  res: NextApiResponse<DocumentsResponse>,
  userId: string
) {
  try {
    const { fileName, category, fileData, metadata }: UploadDocumentRequest = req.body;

    if (!fileName || !category || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'File name, category, and file data are required',
        code: 400
      });
    }

    // Validate category
    const validCategories: UserDocumentCategory[] = [
      'business-documents',
      'tax-certificates',
      'place-photos',
      'identity-documents',
      'other'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document category',
        code: 400
      });
    }

    // Decode base64 file data to get file size
    let fileSize = 0;
    try {
      const base64Data = fileData.split(',')[1] || fileData;
      fileSize = (base64Data.length * 3) / 4; // Approximate size from base64
    } catch (error) {
      console.warn('Could not calculate file size:', error);
    }

    // Check file size limit (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'File size exceeds 10MB limit',
        code: 413
      });
    }

    // Generate unique file path
    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const filePath = `business-documents/${userId}/${category}/${uniqueFileName}`;

    // Create document record in Firestore
    const documentData = {
      userId,
      fileName: uniqueFileName,
      originalName: fileName,
      filePath,
      downloadUrl: `gs://your-bucket/${filePath}`, // Placeholder URL
      category,
      fileType: getFileTypeFromName(fileName),
      size: fileSize,
      status: DocumentStatus.PENDING,
      uploadedAt: new Date().toISOString(),
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await adminDb.collection('businessDocuments').add(documentData);

    const createdDocument: UserDocument = {
      name: documentData.originalName,
      url: documentData.downloadUrl,
      type: documentData.fileType,
      fullPath: documentData.filePath,
      category: documentData.category,
      uploadedAt: documentData.uploadedAt,
      size: documentData.size,
      metadata: {
        ...documentData.metadata,
        documentId: docRef.id,
        userId: documentData.userId,
        status: documentData.status
      }
    };

    return res.status(201).json({
      success: true,
      data: createdDocument,
      code: 201
    });

  } catch (error) {
    console.error('Error uploading business document:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload document'
    });
  }
}

async function deleteDocument(
  req: NextApiRequest,
  res: NextApiResponse<DocumentsResponse>,
  userId: string
) {
  try {
    const { documentId } = req.query;

    if (!documentId || typeof documentId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        code: 400
      });
    }

    // Check if document exists and belongs to user
    const docRef = adminDb.collection('businessDocuments').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        code: 404
      });
    }

    const docData = doc.data();
    if (docData?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this document',
        code: 403
      });
    }

    // Delete document from Firestore
    await docRef.delete();

    // TODO: Also delete from Firebase Storage
    // const storage = getStorage();
    // await deleteObject(ref(storage, docData.filePath));

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error('Error deleting business document:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
}

// Helper function to determine file type from file name
function getFileTypeFromName(fileName: string): 'pdf' | 'image' | 'other' {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return 'image';
  }

  if (extension === 'pdf') {
    return 'pdf';
  }

  return 'other';
}