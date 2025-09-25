/**
 * Business Documents API Route - Handles business document operations
 * Upload, retrieve, and manage business verification documents
 * Updated to use unified storage system with Firebase Storage
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  BusinessVerificationStatus,
  DocumentCategory,
  DocumentFileType,
  IDocument,
  StorageDocumentStatus,
  StorageDocumentType
} from '@/shared-generated';
import { randomUUID } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { NextApiRequest, NextApiResponse } from 'next';

interface DocumentsResponse {
  success: boolean;
  data?: IDocument[] | IDocument;
  error?: string;
  code?: number;
}

interface UploadDocumentRequest {
  fileName: string;
  category: DocumentCategory;
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
    // Debug: Log incoming request
    console.log('📥 Business documents API called:', req.method);
    console.log('🍪 All cookies received:', req.cookies);
    console.log('🍪 Headers:', req.headers.cookie);
    console.log('🔑 Authorization header:', req.headers.authorization ? 'Present' : 'Missing');

    let decodedToken;
    let userId;

    // Try session cookie first
    const sessionCookie = req.cookies.session;
    console.log('🔑 Session cookie:', sessionCookie ? 'Present' : 'Missing');

    if (sessionCookie) {
      try {
        // Verify session cookie
        decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        userId = decodedToken.uid;
        console.log('🔑 Session verified for user:', userId);
      } catch (sessionError) {
        console.log('🔑 Session cookie verification failed:', sessionError instanceof Error ? sessionError.message : 'Unknown error');
      }
    }

    // If session cookie failed, try ID token
    if (!decodedToken) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
          decodedToken = await adminAuth.verifyIdToken(idToken);
          userId = decodedToken.uid;
          console.log('🔑 ID token verified for user:', userId);
        } catch (tokenError) {
          console.log('🔑 ID token verification failed:', tokenError instanceof Error ? tokenError.message : 'Unknown error');
        }
      }
    }

    // If both failed, return 401
    if (!decodedToken || !userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 401
      });
    }

    // Check if user is a business user
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('❌ User document not found for:', userId);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 404
      });
    }

    const userData = userDoc.data();
    console.log('👤 User data:', {
      uid: userId,
      accountType: userData?.accountType,
      email: userData?.email
    });

    if (userData?.accountType !== 'business') {
      console.log('❌ Account type mismatch. Expected: business, Got:', userData?.accountType);
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
    const storage = getStorage();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ee-prod-apps.firebasestorage.app';
    const bucket = storage.bucket(bucketName);

    // Get files from storage that belong to this user
    const prefixes = ['business-documents/', 'tax-certificates/', 'place-photos/', 'identity-documents/'];
    const documents: IDocument[] = [];

    for (const prefix of prefixes) {
      const userPrefix = `${prefix}${userId}/`;
      const [files] = await bucket.getFiles({ prefix: userPrefix });

      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          const document: IDocument = {
            type: getDocumentTypeFromCategory(getDocumentCategoryFromPath(file.name)),
            name: (metadata.metadata?.originalName as string) || file.name.split('/').pop() || '',
            url: signedUrl,
            uploadedAt: metadata.timeCreated || new Date().toISOString(),
            uploadedBy: (metadata.metadata?.uploadedBy as string) || userId,
            status: (metadata.metadata?.status as StorageDocumentStatus) || StorageDocumentStatus.PENDING,
            fullPath: file.name,
            fileType: getFileTypeFromContentType(metadata.contentType || ''),
            category: getDocumentCategoryFromPath(file.name),
            metadata: {
              originalName: (metadata.metadata?.originalName as string) || file.name.split('/').pop() || '',
              uploadedBy: (metadata.metadata?.uploadedBy as string) || userId,
              size: typeof metadata.size === 'string' ? parseInt(metadata.size) : metadata.size || 0,
              ...metadata.metadata
            }
          };

          documents.push(document);
        } catch (error) {
          console.warn('Error processing file:', file.name, error);
          // Continue with other files
        }
      }
    }

    // Sort by upload date (newest first)
    documents.sort((a, b) => {
      const getDateValue = (date: any): number => {
        if (!date) return 0;
        if (typeof date === 'string') return new Date(date).getTime();
        if (date instanceof Date) return date.getTime();
        if (date.toDate && typeof date.toDate === 'function') return date.toDate().getTime(); // Timestamp
        return 0;
      };

      const aTime = getDateValue(a.uploadedAt);
      const bTime = getDateValue(b.uploadedAt);
      return bTime - aTime;
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
    console.log('📤 Upload document called for user:', userId);
    const { fileName, category, fileData, metadata }: UploadDocumentRequest = req.body;
    console.log('📤 Upload request:', { fileName, category, fileDataLength: fileData?.length });

    if (!fileName || !category || !fileData) {
      console.log('❌ Missing required fields:', { fileName: !!fileName, category: !!category, fileData: !!fileData });
      return res.status(400).json({
        success: false,
        error: 'File name, category, and file data are required',
        code: 400
      });
    }

    // Validate category
    const validCategories: DocumentCategory[] = [
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
    let fileBuffer: Buffer;
    try {
      console.log('🔄 Processing file data...');
      const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      console.log('🔄 Base64 data length:', base64Data.length);
      fileBuffer = Buffer.from(base64Data, 'base64');
      fileSize = fileBuffer.length;
      console.log('✅ File processed successfully. Size:', fileSize);
    } catch (error) {
      console.error('❌ Error processing file data:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid file data format',
        code: 400
      });
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

    // Generate unique file path with UUID naming
    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const storagePath = `${category}/${userId}/${uniqueFileName}`;

    // Upload to Firebase Storage
    const storage = getStorage();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ee-prod-apps.firebasestorage.app';
    const bucket = storage.bucket(bucketName);
    console.log('🪣 Using storage bucket:', bucketName);
    const file = bucket.file(storagePath);

    const contentType = getContentTypeFromFileName(fileName);
    await file.save(fileBuffer, {
      metadata: {
        contentType,
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          originalName: fileName,
          category: category,
          source: 'business-upload',
          ...metadata
        }
      }
    });

    // Generate signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Update business verification status when documents are uploaded
    await updateBusinessVerificationStatus(userId);

    const document: IDocument = {
      type: getDocumentTypeFromCategory(category),
      name: fileName,
      url: signedUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      status: StorageDocumentStatus.PENDING,
      fullPath: storagePath,
      fileType: getFileTypeFromContentType(contentType),
      category: category,
      metadata: {
        originalName: fileName,
        uploadedBy: userId,
        size: fileSize,
        source: 'business-upload',
        ...metadata
      }
    };

    return res.status(201).json({
      success: true,
      data: document,
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
    const { documentPath } = req.query;

    if (!documentPath || typeof documentPath !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Document path is required',
        code: 400
      });
    }

    // Verify the document belongs to the user (check if path contains user ID)
    if (!documentPath.includes(`/${userId}/`)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this document',
        code: 403
      });
    }

    // Delete from Firebase Storage
    const storage = getStorage();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ee-prod-apps.firebasestorage.app';
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(documentPath);

    try {
      await file.delete();
    } catch (storageError: any) {
      if (storageError.code === 404) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
          code: 404
        });
      }
      throw storageError;
    }

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

// Helper functions
function getDocumentCategoryFromPath(filePath: string): DocumentCategory {
  if (filePath.startsWith('business-documents/')) return 'business-documents';
  if (filePath.startsWith('tax-certificates/')) return 'tax-certificates';
  if (filePath.startsWith('place-photos/')) return 'place-photos';
  if (filePath.startsWith('identity-documents/')) return 'identity-documents';
  if (filePath.startsWith('content-uploads/')) return 'content-uploads';
  return 'other';
}

function getDocumentTypeFromCategory(category: DocumentCategory): StorageDocumentType {
  switch (category) {
    case 'business-documents':
      return StorageDocumentType.BUSINESS_LICENSE;
    case 'tax-certificates':
      return StorageDocumentType.TAX_CERTIFICATE;
    case 'identity-documents':
      return StorageDocumentType.ARTICLES_OF_INCORPORATION; // Map to closest available type
    case 'place-photos':
      return StorageDocumentType.OTHER; // Photos don't have specific document type
    default:
      return StorageDocumentType.OTHER;
  }
}

function getFileTypeFromContentType(contentType: string): DocumentFileType {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType === 'application/pdf') return 'pdf';
  return 'other';
}

function getContentTypeFromFileName(fileName: string): string {
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
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

// Helper function to determine file type from file name (legacy support)
function getFileTypeFromName(fileName: string): DocumentFileType {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return 'image';
  }

  if (extension === 'pdf') {
    return 'pdf';
  }

  return 'other';
}

// Helper function to update business verification status when documents are uploaded
async function updateBusinessVerificationStatus(userId: string) {
  try {
    console.log('🔄 Updating business verification status for user:', userId);
    // Find the user's business
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error('User not found for verification status update:', userId);
      return;
    }

    const userData = userDoc.data();
    const businessId = userData?.businessInfo?.businessId;
    console.log('🏢 Found business ID:', businessId);

    if (!businessId) {
      console.error('No business ID found for user:', userId);
      return;
    }

    // Get the business document
    const businessDoc = await adminDb.collection('businesses').doc(businessId).get();
    if (!businessDoc.exists) {
      console.error('Business not found:', businessId);
      return;
    }

    const businessData = businessDoc.data();
    const currentStatus = businessData?.verification?.status;
    console.log('🔍 Current verification status:', currentStatus);

    // Only update if status is UNVERIFIED or undefined (new business)
    if (!currentStatus || currentStatus === BusinessVerificationStatus.UNVERIFIED) {
      const now = Timestamp.now();

      // Update verification status to PENDING with history entry
      const verificationUpdate = {
        'verification.status': BusinessVerificationStatus.PENDING,
        'verification.history': [
          ...(businessData?.verification?.history || []),
          {
            status: BusinessVerificationStatus.PENDING,
            changedAt: now,
            changedBy: userId,
            reason: 'Documents uploaded - pending admin review'
          }
        ],
        updatedAt: now
      };

      await adminDb.collection('businesses').doc(businessId).update(verificationUpdate);

      console.log(`✅ Business verification status updated to PENDING for business: ${businessId}`);
    } else {
      console.log(`ℹ️ Business verification status not updated. Current status: ${currentStatus}`);
    }
  } catch (error) {
    console.error('Error updating business verification status:', error);
    // Don't throw error to avoid failing document upload
  }
}