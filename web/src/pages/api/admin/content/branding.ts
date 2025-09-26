/**
 * Admin Branding API route
 * Handles branding information updates using Firebase Admin SDK
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetBrandingInfo(req, res)
      case 'PUT':
        return await handleUpdateBrandingInfo(req, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Admin Branding API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function verifyAdminAuth(req: NextApiRequest) {
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
    throw new Error('No authentication token found')
  }

  const decodedResult = await verifyIdToken(token)

  if (!decodedResult.success || !decodedResult.user) {
    throw new Error('Invalid token')
  }

  // Check if user has admin privileges
  const isAdmin = decodedResult.user.admin === true

  if (!isAdmin) {
    throw new Error('Insufficient permissions')
  }

  return decodedResult.user
}

async function handleGetBrandingInfo(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await verifyAdminAuth(req)

    const docRef = adminDb.collection('content').doc('branding')
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Branding information not found',
      })
    }

    return res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    })
  } catch (error: any) {
    console.error('Error fetching branding info:', error)
    if (
      error.message.includes('token') ||
      error.message.includes('permissions')
    ) {
      return res.status(401).json({ error: error.message })
    }
    return res
      .status(500)
      .json({ error: 'Failed to fetch branding information' })
  }
}

async function handleUpdateBrandingInfo(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const user = await verifyAdminAuth(req)
    const brandingData = req.body

    if (!brandingData || !brandingData.businessName || !brandingData.logoUrl) {
      return res
        .status(400)
        .json({ error: 'Business name and logo URL are required' })
    }

    const updatedData = {
      ...brandingData,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    }

    const docRef = adminDb.collection('content').doc('branding')
    await docRef.set(updatedData, { merge: true })

    return res.status(200).json({
      success: true,
      data: updatedData,
    })
  } catch (error: any) {
    console.error('Error updating branding info:', error)
    if (
      error.message.includes('token') ||
      error.message.includes('permissions')
    ) {
      return res.status(401).json({ error: error.message })
    }
    return res
      .status(500)
      .json({ error: 'Failed to update branding information' })
  }
}
