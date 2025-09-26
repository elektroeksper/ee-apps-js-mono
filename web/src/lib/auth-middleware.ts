/**
 * Authentication Middleware for API Routes
 * Verifies session cookies and adds user context
 */

import { adminAuth } from '@/lib/firebase-admin'
import { NextApiRequest, NextApiResponse } from 'next'

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    uid: string
    email?: string
    admin?: boolean
  }
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options: { requireAuth?: boolean; requireAdmin?: boolean } = {}
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const sessionCookie = req.cookies.session

      if (sessionCookie) {
        // Verify session cookie
        const decodedToken = await adminAuth.verifySessionCookie(
          sessionCookie,
          true
        )

        // Get user record for additional claims
        const userRecord = await adminAuth.getUser(decodedToken.uid)

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          admin: userRecord.customClaims?.admin === true,
        }
      }

      // Check authentication requirements
      if (options.requireAuth && !req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        })
      }

      if (options.requireAdmin && !req.user?.admin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        })
      }

      return handler(req, res)
    } catch (error) {
      console.error('Auth middleware error:', error)

      if (options.requireAuth) {
        return res.status(401).json({
          success: false,
          error: 'Invalid session',
        })
      }

      // If auth is not required, continue without user context
      return handler(req, res)
    }
  }
}
