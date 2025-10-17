/**
 * Business verification API route
 * Handles business verification status management using Firebase Admin SDK
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin'
import { BusinessVerificationStatus } from '@/shared'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { businessId } = req.query

  if (!businessId || typeof businessId !== 'string') {
    return res.status(400).json({ error: 'Business ID is required' })
  }

  try {
    switch (req.method) {
      case 'PUT':
        return await handleUpdateVerificationStatus(req, res, businessId)
      default:
        res.setHeader('Allow', ['PUT'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Business verification API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleUpdateVerificationStatus(
  req: NextApiRequest,
  res: NextApiResponse,
  businessId: string
) {
  try {
    // Try to get token from session cookie first, then from Authorization header
    let token = req.cookies.session

    if (!token) {
      // Fallback to Authorization header (for ID tokens)
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'No authentication token found' })
    }

    const decodedResult = await verifyIdToken(token)

    if (!decodedResult.success || !decodedResult.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { action, reason } = req.body

    if (!action || !['approve', 'reject', 'clear-rejection'].includes(action)) {
      return res.status(400).json({
        error: 'Valid action is required (approve, reject, clear-rejection)',
      })
    }

    // For reject action, reason is required
    if (action === 'reject' && !reason) {
      return res.status(400).json({ error: 'Rejection reason is required' })
    }

    // Check if user has admin privileges
    const userClaims = decodedResult.user.customClaims || {}
    const directAdmin = (decodedResult.user as any).admin === true
    const claimsAdmin = userClaims.admin === true
    const isAdmin = directAdmin || claimsAdmin

    console.log('🔐 Admin permission check:', {
      directAdmin,
      claimsAdmin,
      isAdmin,
      userEmail: decodedResult.user.email,
    })

    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Insufficient permissions - admin access required' })
    }

    // Get the business document
    const businessRef = adminDb.collection('businesses').doc(businessId)
    const businessDoc = await businessRef.get()

    if (!businessDoc.exists) {
      return res.status(404).json({ error: 'Business not found' })
    }

    const business = businessDoc.data()
    const currentVerification = business?.verification || {
      status: BusinessVerificationStatus.PENDING,
      history: [],
    }

    let updatedVerification
    const timestamp = new Date().toISOString()
    const adminUserId = decodedResult.user.uid

    switch (action) {
      case 'approve':
        updatedVerification = {
          status: BusinessVerificationStatus.VERIFIED,
          history: [
            ...currentVerification.history,
            {
              approvedAt: timestamp,
              approvedBy: adminUserId,
              rejectedAt: null,
              rejectedBy: null,
              rejectionReason: null,
            },
          ],
        }
        break

      case 'reject':
        updatedVerification = {
          status: BusinessVerificationStatus.REJECTED,
          history: [
            ...currentVerification.history,
            {
              approvedAt: null,
              approvedBy: null,
              rejectedAt: timestamp,
              rejectedBy: adminUserId,
              rejectionReason: reason,
            },
          ],
        }
        break

      case 'clear-rejection':
        // Clear rejection and reset to pending
        updatedVerification = {
          status: BusinessVerificationStatus.PENDING,
          history: [
            ...currentVerification.history,
            {
              approvedAt: null,
              approvedBy: null,
              rejectedAt: null,
              rejectedBy: null,
              rejectionReason: null,
            },
          ],
        }
        break

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

    // Update the business document
    await businessRef.update({
      verification: updatedVerification,
      updatedAt: timestamp,
      updatedBy: adminUserId,
    })

    // Fetch and return updated business
    const updatedDoc = await businessRef.get()
    const updatedBusiness = { id: updatedDoc.id, ...updatedDoc.data() }

    return res.status(200).json({
      success: true,
      data: updatedBusiness,
      message: `Business ${action === 'clear-rejection' ? 'rejection cleared' : action + 'd'} successfully`,
    })
  } catch (error) {
    console.error('Error updating business verification status:', error)
    return res
      .status(500)
      .json({ error: 'Failed to update business verification status' })
  }
}
