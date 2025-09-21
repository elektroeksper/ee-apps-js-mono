/**
 * Business by ID API route
 * Handles GET, PUT, DELETE operations for individual business entities
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { DocumentCategory, DocumentFileType, IBusiness, IDocument, StorageDocumentStatus, StorageDocumentType } from '@/shared-generated';
import { Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
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
    console.log('🏢 Business API GET: Requesting business ID:', businessId);

    let decodedToken;
    let userId;

    // Try session cookie first
    const sessionCookie = req.cookies.session;
    console.log('🔑 Business API: Session cookie present:', !!sessionCookie);

    if (sessionCookie) {
      try {
        // Verify session cookie
        decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        userId = decodedToken.uid;
        console.log('🔑 Business API: Session verified for user:', userId);
      } catch (sessionError) {
        console.log('🔑 Business API: Session cookie verification failed:', sessionError instanceof Error ? sessionError.message : 'Unknown error');
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
          console.log('🔑 Business API: ID token verified for user:', userId);
        } catch (tokenError) {
          console.log('🔑 Business API: ID token verification failed:', tokenError instanceof Error ? tokenError.message : 'Unknown error');
        }
      }
    }

    // If both failed, return 401
    if (!decodedToken || !userId) {
      console.log('❌ Business API: Authentication failed - no valid session or ID token');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user record for custom claims
    const userRecord = await adminAuth.getUser(userId);
    const userClaims = userRecord.customClaims || {};
    const isAdmin = userClaims.admin === true || userClaims.role === 'admin';
    console.log('👤 Business API: User permissions - isAdmin:', isAdmin);

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

    // Fetch documents from Firebase Storage if user is accessing their own business or admin
    if (isAdmin || businessData.ownerId === userId || businessData.users?.[userId]) {
      try {
        console.log('📄 Fetching documents for ownerId:', businessData.ownerId);
        const documents = await fetchBusinessDocuments(businessData.ownerId);
        business.documents = documents;
        console.log('📄 Fetched', documents.length, 'documents for business');
        console.log('📄 Document details:', documents.map(d => ({ name: d.name, category: d.category, type: d.type })));
      } catch (docError) {
        console.warn('⚠️ Could not fetch documents:', docError);
        // Don't fail the request if documents can't be fetched
        business.documents = [];
      }
    } else {
      console.log('❌ No permission to fetch documents. isAdmin:', isAdmin, 'ownerId:', businessData.ownerId, 'userId:', userId);
    }

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

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;
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

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    // Get user record for custom claims
    const userRecord = await adminAuth.getUser(userId);
    const userClaims = userRecord.customClaims || {};
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

// Helper function to fetch business documents from Firebase Storage
async function fetchBusinessDocuments(ownerId: string): Promise<IDocument[]> {
  try {
    const storage = getStorage();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'elektro-ekspert-apps.firebasestorage.app';
    const bucket = storage.bucket(bucketName);

    // Get files from storage that belong to this user
    const prefixes = ['business-documents/', 'tax-certificates/', 'place-photos/', 'identity-documents/'];
    const documents: IDocument[] = [];

    for (const prefix of prefixes) {
      const userPrefix = `${prefix}${ownerId}/`;
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
            uploadedBy: (metadata.metadata?.uploadedBy as string) || ownerId,
            status: (metadata.metadata?.status as StorageDocumentStatus) || StorageDocumentStatus.PENDING,
            fullPath: file.name,
            fileType: getFileTypeFromContentType(metadata.contentType || ''),
            category: getDocumentCategoryFromPath(file.name),
            metadata: {
              originalName: (metadata.metadata?.originalName as string) || file.name.split('/').pop() || '',
              uploadedBy: (metadata.metadata?.uploadedBy as string) || ownerId,
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

    return documents;
  } catch (error) {
    console.error('Error fetching business documents:', error);
    return [];
  }
}

// Helper functions for document processing
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