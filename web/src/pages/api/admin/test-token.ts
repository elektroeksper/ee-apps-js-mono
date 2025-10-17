/**
 * Simple test endpoint to debug token verification
 */

import { adminAuth, verifyIdToken } from '@/lib/firebase-admin'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('=== TOKEN TEST ENDPOINT ===')
    console.log('Headers:', JSON.stringify(req.headers, null, 2))

    // Check for Authorization header
    const authHeader = req.headers.authorization
    console.log('Auth Header:', authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization token provided')
      return res.status(401).json({
        error: 'No authorization token provided',
        authHeader: authHeader,
      })
    }

    const idToken = authHeader.substring(7)
    console.log('Token (first 50 chars):', idToken.substring(0, 50) + '...')

    // Verify token
    console.log('🔍 Verifying token...')
    const decodedResult = await verifyIdToken(idToken)
    console.log('Decoded Result:', decodedResult)

    if (!decodedResult.success || !decodedResult.user) {
      console.log('❌ Token verification failed')
      return res.status(401).json({
        error: 'Invalid token',
        details: decodedResult.error || 'Unknown verification error',
      })
    }

    const user = decodedResult.user
    console.log('✅ Token verified for user:', user.email)
    console.log('User UID:', user.uid)
    console.log('Custom Claims:', JSON.stringify(user.customClaims, null, 2))

    // Get claims from token
    const tokenClaims = user.customClaims || {}

    // Fetch fresh claims from Firebase Auth
    const userRecord = await adminAuth.getUser(user.uid)
    const freshClaims = userRecord.customClaims || {}

    // Check admin status - check both direct property and customClaims
    const directAdmin = (user as any).admin === true
    const claimsAdmin = freshClaims.admin === true
    const isAdmin = directAdmin || claimsAdmin

    console.log('Admin Check Results:', {
      hasCustomClaims: !!user.customClaims,
      tokenAdminClaim: tokenClaims.admin,
      directAdmin: directAdmin,
      freshAdminClaim: freshClaims.admin,
      isAdmin: isAdmin,
    })

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
        directAdminValue: directAdmin,
        claimsComparison: {
          tokenAdmin: tokenClaims.admin,
          freshAdmin: freshClaims.admin,
          directAdmin: directAdmin,
          areEqual: tokenClaims.admin === freshClaims.admin,
        },
        tokenIssuedAt: new Date(user.iat * 1000).toISOString(),
        tokenExpiresAt: new Date(user.exp * 1000).toISOString(),
      },
    })
  } catch (error) {
    console.error('❌ ERROR in token test:', error)
    return res.status(500).json({
      success: false,
      error: 'Server error during token verification',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
