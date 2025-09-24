/**
 * Debug Claims API route
 * Shows current user's Firebase claims for debugging admin access
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

    // Return debug information
    return res.status(200).json({
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.email_verified,
        customClaims: userClaims,
        hasAdminClaim: userClaims.admin === true,
        isAdmin: userClaims.admin === true,
        note: 'Only checking customClaims.admin === true for admin permissions',
        tokenIssuedAt: new Date(user.iat * 1000).toISOString(),
        tokenExpiresAt: new Date(user.exp * 1000).toISOString(),
        authTime: user.auth_time ? new Date(user.auth_time * 1000).toISOString() : null,
        firebase: {
          sign_in_provider: user.firebase?.sign_in_provider,
          identities: user.firebase?.identities
        }
      }
    });

  } catch (error) {
    console.error('Error checking claims:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check user claims',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}