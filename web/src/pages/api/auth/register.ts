/**
 * Registration API Route - Handles user creation with profile data
 * Creates Firebase Auth user and associated Firestore profile
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { AccountType, IAppUser, IBusinessRegisterData, IRegisterData } from '@/shared-generated';
import { NextApiRequest, NextApiResponse } from 'next';

interface RegisterRequest {
  userData: IRegisterData | IBusinessRegisterData;
  idToken: string; // Firebase Auth ID token from client
}

interface RegisterResponse {
  success: boolean;
  data?: {
    userId: string;
    user: IAppUser;
  };
  error?: string;
  code?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { userData, idToken }: RegisterRequest = req.body;

    if (!userData || !idToken) {
      return res.status(400).json({
        success: false,
        error: 'User data and ID token are required',
        code: 400
      });
    }

    // Verify the Firebase Auth token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if user profile already exists
    const existingUserDoc = await adminDb.collection('users').doc(userId).get();
    if (existingUserDoc.exists) {
      return res.status(409).json({
        success: false,
        error: 'User profile already exists',
        code: 409
      });
    }

    // Prepare user profile data
    const userProfileData: Partial<IAppUser> = {
      id: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      accountType: userData.accountType,
      isEmailVerified: decodedToken.email_verified || false,
      isPhoneVerified: false,
      isActive: true,
      isDeleted: false,
      preferences: {
        theme: 'system',
        language: 'tr',
        notifications: {
          email: true,
          push: true,
          sms: false,
          marketing: false,
          orderUpdates: true,
          securityAlerts: true
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          allowAnalytics: true
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add business-specific data if this is a business registration
    if (userData.accountType === AccountType.BUSINESS) {
      const businessData = userData as IBusinessRegisterData;
      userProfileData.businessInfo = {
        businessId: '', // Will be set when business is created
        userId: userId,
        businessTitle: businessData.userTitle,
        displayName: `${businessData.firstName} ${businessData.lastName}`,
        email: businessData.email,
        role: 'owner' as any, // BusinessUserRole.OWNER
        permissions: {} as any, // Default permissions will be set
        isActive: true,
        addedAt: new Date()
      };
    }

    // Create user profile in Firestore
    await adminDb.collection('users').doc(userId).set(userProfileData);

    // Fetch the created user profile
    const createdUserDoc = await adminDb.collection('users').doc(userId).get();
    const createdUser = {
      id: createdUserDoc.id,
      ...createdUserDoc.data()
    } as IAppUser;

    // Create session cookie for immediate login
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set secure HTTP-only cookie
    res.setHeader('Set-Cookie', [
      `session=${sessionCookie}; Max-Age=${expiresIn / 1000}; HttpOnly; Secure; SameSite=Lax; Path=/`,
      `user-id=${userId}; Max-Age=${expiresIn / 1000}; Secure; SameSite=Lax; Path=/`
    ]);

    return res.status(201).json({
      success: true,
      data: {
        userId,
        user: createdUser
      },
      code: 201
    });

  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token expired',
        code: 401
      });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
        code: 401
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user profile',
      code: 500
    });
  }
}