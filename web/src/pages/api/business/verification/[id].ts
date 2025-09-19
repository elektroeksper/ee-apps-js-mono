/**
 * Business verification API route
 * Admin-only endpoint for approving/rejecting business verification
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin';
import { BusinessVerificationStatus, IBusiness } from '@/shared-generated';
import { Timestamp } from 'firebase/firestore';
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
      case 'PUT':
        return await handleBusinessVerification(req, res, id);
      default:
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Business verification API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleBusinessVerification(
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

    const decodedResult = await verifyIdToken(sessionCookie);

    if (!decodedResult.success || !decodedResult.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Check if user has admin privileges
    const userClaims = decodedResult.user.customClaims || {};
    const isAdmin = userClaims.admin === true || userClaims.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions - admin access required' });
    }

    const adminId = decodedResult.user.uid;
    const { action, reason } = req.body;

    // Validate action
    if (!action || !['approve', 'reject', 'clear-rejection'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approve, reject, or clear-rejection' });
    }

    // Validate reason for rejection
    if (action === 'reject' && (!reason || reason.trim().length === 0)) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get business document
    const businessDoc = await adminDb.collection('businesses').doc(businessId).get();

    if (!businessDoc.exists) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const businessData = businessDoc.data() as IBusiness;
    const currentVerification = businessData.verification || { status: BusinessVerificationStatus.UNVERIFIED, history: [] };

    // Prepare verification update
    let newStatus: BusinessVerificationStatus;
    const historyEntry: any = {
      timestamp: Timestamp.now(),
      adminId: adminId,
      action: action
    };

    switch (action) {
      case 'approve':
        newStatus = BusinessVerificationStatus.VERIFIED;
        historyEntry.approvedAt = Timestamp.now();
        historyEntry.approvedBy = adminId;
        break;
      case 'reject':
        newStatus = BusinessVerificationStatus.REJECTED;
        historyEntry.rejectedAt = Timestamp.now();
        historyEntry.rejectedBy = adminId;
        historyEntry.rejectionReason = reason.trim();
        break;
      case 'clear-rejection':
        newStatus = BusinessVerificationStatus.PENDING;
        historyEntry.clearedAt = Timestamp.now();
        historyEntry.clearedBy = adminId;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Update business verification
    const updatedVerification = {
      status: newStatus,
      history: [...(currentVerification.history || []), historyEntry]
    };

    await adminDb.collection('businesses').doc(businessId).update({
      verification: updatedVerification,
      updatedAt: Timestamp.now()
    });

    // Fetch updated business
    const updatedDoc = await adminDb.collection('businesses').doc(businessId).get();
    const updatedBusiness: IBusiness = {
      id: businessId,
      ...updatedDoc.data()
    } as IBusiness;

    // Get action message
    let message: string;
    switch (action) {
      case 'approve':
        message = 'Business verified successfully';
        break;
      case 'reject':
        message = 'Business rejected for verification';
        break;
      case 'clear-rejection':
        message = 'Business rejection cleared successfully';
        break;
      default:
        message = 'Business verification updated';
    }

    return res.status(200).json({
      success: true,
      data: updatedBusiness,
      message: message
    });
  } catch (error) {
    console.error('Error handling business verification:', error);
    return res.status(500).json({ error: 'Failed to update business verification' });
  }
}