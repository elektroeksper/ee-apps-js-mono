/**
 * Business API route for managing business entities
 * Handles business CRUD operations using Firebase Admin SDK
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin';
import { AccountType, BusinessUserRole, BusinessVerificationStatus, IBusiness, IBusinessUserInfo } from '@/shared-generated';
import { Timestamp } from 'firebase/firestore';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetBusinesses(req, res);
      case 'POST':
        return await handleCreateBusiness(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Business API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetBusinesses(
  req: NextApiRequest,
  res: NextApiResponse
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

    // Check if user has admin privileges
    const userClaims = decodedResult.user.customClaims || {};
    const isAdmin = userClaims.admin === true || userClaims.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Parse query parameters for filtering
    const verificationStatus = req.query.verificationStatus as BusinessVerificationStatus;
    const ownerId = req.query.ownerId as string;
    const searchText = req.query.searchText as string;

    // Build Firestore query
    let query: any = adminDb.collection('businesses');

    // Apply filters
    if (verificationStatus) {
      query = query.where('verification.status', '==', verificationStatus);
    }

    if (ownerId) {
      query = query.where('ownerId', '==', ownerId);
    }

    // Add pagination support
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    if (limit > 0) {
      query = query.limit(Math.min(limit, 100)); // Max 100 businesses per request
    }

    const snapshot = await query.get();

    let businesses: IBusiness[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as IBusiness));

    // Apply search filter if provided (client-side filtering for simplicity)
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      businesses = businesses.filter(business =>
        business.businessName?.toLowerCase().includes(searchLower) ||
        business.phone?.toLowerCase().includes(searchLower) ||
        business.taxNumber?.toLowerCase().includes(searchLower)
      );
    }

    return res.status(200).json({
      success: true,
      data: businesses,
      total: businesses.length
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return res.status(500).json({ error: 'Failed to fetch businesses' });
  }
}

async function handleCreateBusiness(
  req: NextApiRequest,
  res: NextApiResponse
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
    const businessData = req.body;

    // Validate required fields
    if (!businessData.businessName) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    // Check if user already has a business
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.businessInfo?.businessId) {
      return res.status(400).json({ error: 'User already has a business associated' });
    }

    // Start a transaction to create business and update user atomically
    const batch = adminDb.batch();

    // Create business document reference first to get the ID
    const businessRef = adminDb.collection('businesses').doc();
    const businessId = businessRef.id;

    // Get user info for business creation
    const user = decodedResult.user;

    const newBusiness: Partial<IBusiness> = {
      businessName: businessData.businessName,
      taxNumber: businessData.taxNumber,
      taxOffice: businessData.taxOffice,
      taxNumberType: businessData.taxNumberType,
      identityNumber: businessData.identityNumber,
      addresses: businessData.addresses || [],
      phone: businessData.phone,
      email: businessData.email,
      description: businessData.description,
      website: businessData.website,
      companySize: businessData.companySize,
      documents: businessData.documents || [],
      mainCategoryId: businessData.mainCategoryId,
      subCategoryIds: businessData.subCategoryIds || [],
      verification: {
        status: BusinessVerificationStatus.UNVERIFIED,
        history: []
      },
      ownerId: userId,
      users: {
        [userId]: {
          businessId,
          userId: userId,
          businessTitle: 'Owner',
          displayName: user.displayName || user.email || 'Unknown',
          email: user.email || '',
          role: BusinessUserRole.OWNER,
          permissions: {
            canEditBusinessInfo: true,
            canDeleteBusiness: true,
            canManageDocuments: true,
            canInviteUsers: true,
            canApproveInvitations: true,
            canRemoveUsers: true,
            canChangeUserRoles: true,
            canInviteOwners: false, // Only system can create owners
            canInviteManagers: true,
            canInviteTechnicians: true,
            canInviteSupport: true,
            canViewOrders: true,
            canManageOrders: true,
            canViewAnalytics: true,
            canManageInventory: true,
            canViewFinancials: true,
            canManagePayments: true
          },
          isActive: true,
          addedAt: Timestamp.now(),
          lastActiveAt: Timestamp.now()
        }
      },
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add business creation to batch
    batch.set(businessRef, newBusiness);

    // Update user document to link to business
    const userRef = adminDb.collection('users').doc(userId);
    const businessUserInfo: IBusinessUserInfo = {
      businessId: businessId,
      userId: userId,
      businessTitle: 'Owner',
      displayName: user.displayName || user.email || 'Unknown',
      email: user.email || '',
      role: BusinessUserRole.OWNER,
      permissions: {
        canEditBusinessInfo: true,
        canDeleteBusiness: true,
        canManageDocuments: true,
        canInviteUsers: true,
        canApproveInvitations: true,
        canRemoveUsers: true,
        canChangeUserRoles: true,
        canInviteOwners: false,
        canInviteManagers: true,
        canInviteTechnicians: true,
        canInviteSupport: true,
        canViewOrders: true,
        canManageOrders: true,
        canViewAnalytics: true,
        canManageInventory: true,
        canViewFinancials: true,
        canManagePayments: true
      },
      isActive: true,
      addedAt: Timestamp.now(),
      lastActiveAt: Timestamp.now()
    };

    batch.update(userRef, {
      accountType: AccountType.BUSINESS,
      businessInfo: businessUserInfo,
      updatedAt: Timestamp.now()
    });

    // Commit the transaction
    await batch.commit();

    // Return the created business with the ID
    const createdBusiness: IBusiness = {
      id: businessId,
      ...newBusiness
    } as IBusiness;

    return res.status(201).json({
      success: true,
      data: createdBusiness,
      message: 'Business created successfully'
    });
  } catch (error) {
    console.error('Error creating business:', error);
    return res.status(500).json({ error: 'Failed to create business' });
  }
}