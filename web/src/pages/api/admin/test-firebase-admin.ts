/**
 * Firebase Admin Test Endpoint
 * Tests if Firebase Admin SDK is properly initialized and can verify tokens
 */

import { adminAuth } from '@/lib/firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('=== FIREBASE ADMIN TEST ===');

    // Test 1: Check if Firebase Admin is initialized
    try {
      const adminUser = await adminAuth.getUser('0JQmH7IjuCZfwMHWyXkJi69EOgD3'); // Your UID
      console.log('✅ Firebase Admin initialized successfully');
      console.log('📧 User email:', adminUser.email);
      console.log('🔒 Custom claims:', adminUser.customClaims);

      return res.status(200).json({
        success: true,
        message: 'Firebase Admin is working',
        userEmail: adminUser.email,
        customClaims: adminUser.customClaims,
        isAdmin: adminUser.customClaims?.admin === true
      });
    } catch (adminError) {
      console.error('❌ Firebase Admin error:', adminError);
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin not properly initialized',
        details: adminError instanceof Error ? adminError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ General error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}