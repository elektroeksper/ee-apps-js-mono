/**
 * Debug endpoint to check current user's claims
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
    console.log('=== DEBUG MY CLAIMS ENDPOINT ===');

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
      return res.status(401).json({ error: 'No authentication token found' });
    }

    const decodedResult = await verifyIdToken(token);

    if (!decodedResult.success || !decodedResult.user) {
      return res.status(401).json({
        error: 'Invalid token',
        details: decodedResult.error
      });
    }

    const user = decodedResult.user;

    // Get fresh custom claims from Firebase Auth
    const userRecord = await adminAuth.getUser(user.uid);
    const userClaims = userRecord.customClaims || {};

    // Check admin status using ONLY custom claims admin field
    const isAdmin = userClaims.admin === true;

    // Return debug information
    return res.status(200).json({
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.email_verified,
        tokenClaims: user.customClaims || {},
        freshClaims: userClaims,
        directAdmin: user.admin,
        directRole: user.role,
        adminCheck: {
          isAdmin,
          adminClaimValue: userClaims.admin,
          adminClaimType: typeof userClaims.admin,
          note: 'Using fresh Firebase Auth custom claims lookup'
        },
        claimsComparison: {
          tokenAdminClaim: (user.customClaims || {}).admin,
          freshAdminClaim: userClaims.admin,
          areEqual: (user.customClaims || {}).admin === userClaims.admin
        },
        allUserProperties: Object.keys(user),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in debug claims endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}