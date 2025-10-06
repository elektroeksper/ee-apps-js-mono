/**
 * Users API route for listing and creating users
 * Handles GET (list with filters) and POST (create) operations using Firebase Admin SDK
 */

import { adminAuth, adminDb, verifyIdToken } from '@/lib/firebase-admin'
import { AccountType, IAppUser, IUserFilter } from '@/shared'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetUsers(req, res)
      case 'POST':
        return await handleCreateUser(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Users API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {
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

    // Check if user has admin privileges using the uid from the token
    // This fetches the latest custom claims from Firebase directly
    const userRecord = await adminAuth.getUser(decodedResult.user.uid)
    const userClaims = userRecord.customClaims || {}
    const isAdmin =
      userClaims.admin === true ||
      userClaims.role === 'admin' ||
      decodedResult.user.admin === true

    if (!isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Parse query parameters for filtering
    const filter: IUserFilter = {}

    if (req.query.accountType && typeof req.query.accountType === 'string') {
      filter.accountType = req.query.accountType as AccountType
    }

    if (req.query.email && typeof req.query.email === 'string') {
      filter.email = req.query.email
    }

    if (req.query.firstName && typeof req.query.firstName === 'string') {
      filter.firstName = req.query.firstName
    }

    if (req.query.lastName && typeof req.query.lastName === 'string') {
      filter.lastName = req.query.lastName
    }

    if (req.query.isDeleted !== undefined) {
      filter.isDeleted = req.query.isDeleted === 'true'
    }

    // Additional filters not in IUserFilter interface
    const isActive =
      req.query.isActive !== undefined
        ? req.query.isActive === 'true'
        : undefined
    const isEmailVerified =
      req.query.isEmailVerified !== undefined
        ? req.query.isEmailVerified === 'true'
        : undefined

    // Build Firestore query
    let query: any = adminDb.collection('users')

    // Apply filters from IUserFilter
    if (filter.accountType) {
      query = query.where('accountType', '==', filter.accountType)
    }

    if (filter.email) {
      query = query.where('email', '==', filter.email)
    }

    if (filter.firstName) {
      query = query.where('firstName', '==', filter.firstName)
    }

    if (filter.lastName) {
      query = query.where('lastName', '==', filter.lastName)
    }

    if (filter.isDeleted !== undefined) {
      query = query.where('isDeleted', '==', filter.isDeleted)
    }

    // Apply additional filters
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive)
    }

    if (isEmailVerified !== undefined) {
      query = query.where('isEmailVerified', '==', isEmailVerified)
    }

    // Add pagination support
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50
    if (limit > 0) {
      query = query.limit(Math.min(limit, 100)) // Max 100 users per request
    }

    const snapshot = await query.get()

    const users: IAppUser[] = snapshot.docs.map(
      (doc: any) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as IAppUser
    )

    return res.status(200).json({
      success: true,
      data: users,
      total: users.length,
      filter: filter,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
}

async function handleCreateUser(req: NextApiRequest, res: NextApiResponse) {
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

    // Check if user has admin privileges using the uid from the token
    // This fetches the latest custom claims from Firebase directly
    const userRecord = await adminAuth.getUser(decodedResult.user.uid)
    const userClaims = userRecord.customClaims || {}
    const isAdmin =
      userClaims.admin === true ||
      userClaims.role === 'admin' ||
      decodedResult.user.admin === true

    if (!isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const userData = req.body

    if (!userData || !userData.email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Create user document
    const userDoc = {
      email: userData.email,
      displayName: userData.displayName || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      accountType: userData.accountType || AccountType.INDIVIDUAL,
      isEmailVerified: userData.isEmailVerified || false,
      isPhoneVerified: userData.isPhoneVerified || false,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      isDeleted: false,
      preferences: userData.preferences || {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false,
          marketing: false,
          orderUpdates: true,
          securityAlerts: true,
        },
        privacy: {
          profileVisibility: 'private',
          showEmail: false,
          showPhone: false,
          allowAnalytics: true,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData, // Allow additional fields
    }

    // Create the document
    const docRef = await adminDb.collection('users').add(userDoc)

    // Fetch the created document
    const createdDoc = await docRef.get()
    const createdUser = { id: createdDoc.id, ...createdDoc.data() } as IAppUser

    return res.status(201).json({
      success: true,
      data: createdUser,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return res.status(500).json({ error: 'Failed to create user' })
  }
}
