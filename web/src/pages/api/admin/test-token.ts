/**
 * Simple test endpoint to debug token verification
 */

import { adminAuth, verifyIdToken } from '@/lib/firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== TOKEN TEST ENDPOINT ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    // Try to get token from session cookie first, then from Authorization header
    let token = req.cookies.session;
    console.log('Session Cookie:', token ? 'present' : 'not found');

    if (!token) {
      // Fallback to Authorization header (for ID tokens)
      const authHeader = req.headers.authorization;
      console.log('Auth Header:', authHeader);
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log('❌ No authentication token found');
      return res.status(401).json({ error: 'No authentication token found' });
    }

    const idToken = token;
    console.log('Token (first 50 chars):', idToken.substring(0, 50) + '...');

    // Verify token
    console.log('🔍 Verifying token...');
    const decodedResult = await verifyIdToken(idToken);
    console.log('Decoded Result:', decodedResult);

    if (!decodedResult.success || !decodedResult.user) {
      console.log('❌ Token verification failed');
      return res.status(401).json({
        error: 'Invalid token',
        details: decodedResult.error || 'Unknown verification error'
      });
    }

    const user = decodedResult.user;
    console.log('✅ Token verified for user:', user.email);
    console.log('User UID:', user.uid);
    console.log('Custom Claims:', JSON.stringify(user.customClaims, null, 2));

    // Get fresh custom claims from Firebase Auth
    const userRecord = await adminAuth.getUser(user.uid);
    const freshClaims = userRecord.customClaims || {};
    const tokenClaims = user.customClaims || {};
    const isAdmin = freshClaims.admin === true;

    console.log('Admin Check Results:', {
      hasTokenClaims: !!user.customClaims,
      hasFreshClaims: !!freshClaims,
      tokenAdminClaim: tokenClaims.admin,
      freshAdminClaim: freshClaims.admin,
      tokenRoleClaim: tokenClaims.role,
      freshRoleClaim: freshClaims.role,
      isAdmin: isAdmin
    });

    return res.status(200).json({
      success: true,
      message: 'Token verification successful',
      data: {
        uid: user.uid,
        email: user.email,
        tokenClaims: tokenClaims,
        freshClaims: freshClaims,
        isAdmin: isAdmin,
        adminClaimValue: freshClaims.admin,
        roleClaimValue: freshClaims.role,
        claimsComparison: {
          tokenAdmin: tokenClaims.admin,
          freshAdmin: freshClaims.admin,
          areEqual: tokenClaims.admin === freshClaims.admin
        },
        tokenIssuedAt: new Date(user.iat * 1000).toISOString(),
        tokenExpiresAt: new Date(user.exp * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ERROR in token test:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during token verification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}