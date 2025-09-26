/**
 * User Statistics API route for admin dashboard
 * Provides aggregated user statistics and metrics
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin'
import { AccountType, BusinessVerificationStatus } from '@/shared-generated'
import { NextApiRequest, NextApiResponse } from 'next'

interface IUserStats {
  totalUsers: number
  activeUsers: number
  adminCount: number
  businessUsers: number
  individualUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  recentRegistrations: number // Last 7 days
  monthlyGrowth: number // % growth this month
  businessVerificationStats: {
    pending: number
    verified: number
    rejected: number
    unverified: number
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify authentication via Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }

    const idToken = authHeader.substring(7) // Remove 'Bearer ' prefix

    const decodedResult = await verifyIdToken(idToken)

    if (!decodedResult.success || !decodedResult.user) {
      console.error('Token verification failed:', decodedResult.error)
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Debug logging for claims
    const userClaims = decodedResult.user.customClaims || {}

    // Also check if claims are in different locations
    const allPossibleClaims = {
      customClaims: decodedResult.user.customClaims,
      admin: decodedResult.user.admin,
      role: decodedResult.user.role,
      // Check all properties of the decoded token
      allProperties: Object.keys(decodedResult.user),
    }

    console.log('DEBUG - All Token Properties:', allPossibleClaims)
    console.log(
      'DEBUG - Full Decoded User:',
      JSON.stringify(decodedResult.user, null, 2)
    )

    console.log('DEBUG - User Claims:', {
      uid: decodedResult.user.uid,
      email: decodedResult.user.email,
      claims: userClaims,
      adminClaim: userClaims.admin,
      roleClaim: userClaims.role,
      directAdmin: decodedResult.user.admin,
      directRole: decodedResult.user.role,
      timestamp: new Date().toISOString(),
    })

    // Check if user has admin privileges - check multiple locations
    const isAdminFromCustomClaims =
      userClaims.admin === true || userClaims.role === 'admin'
    const isAdminFromDirect =
      decodedResult.user.admin === true || decodedResult.user.role === 'admin'
    const isAdmin = isAdminFromCustomClaims || isAdminFromDirect

    console.log('DEBUG - Admin Check:', {
      isAdmin,
      isAdminFromCustomClaims,
      isAdminFromDirect,
      adminClaimValue: userClaims.admin,
      roleClaimValue: userClaims.role,
      adminClaimType: typeof userClaims.admin,
      roleClaimType: typeof userClaims.role,
      directAdminValue: decodedResult.user.admin,
      directRoleValue: decodedResult.user.role,
    })

    if (!isAdmin) {
      console.error('Access denied - user is not admin:', {
        uid: decodedResult.user.uid,
        email: decodedResult.user.email,
        claims: userClaims,
      })
      return res
        .status(403)
        .json({ error: 'Insufficient permissions - admin access required' })
    }

    // Calculate date ranges
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch all users (you might want to limit this for large datasets)
    const usersSnapshot = await adminDb
      .collection('users')
      .where('isDeleted', '==', false)
      .get()

    const users: any[] = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Fetch all businesses for business stats
    const businessesSnapshot = await adminDb.collection('businesses').get()
    const businesses: any[] = businessesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Calculate basic stats
    const totalUsers = users.length
    const businessUsers = users.filter(
      user => user.accountType === AccountType.BUSINESS
    ).length
    const individualUsers = users.filter(
      user => user.accountType === AccountType.INDIVIDUAL
    ).length
    const verifiedUsers = users.filter(
      user => user.isEmailVerified === true
    ).length
    const unverifiedUsers = totalUsers - verifiedUsers

    // Calculate active users (users who logged in within the last 30 days)
    const activeUsers = users.filter(user => {
      if (!user.lastLoginAt) return false
      const lastLogin = user.lastLoginAt.toDate
        ? user.lastLoginAt.toDate()
        : new Date(user.lastLoginAt)
      return lastLogin >= thirtyDaysAgo
    }).length

    // Calculate admin count (this would need to be implemented based on your admin role structure)
    // For now, checking if user has admin custom claims or admin role
    let adminCount = 0
    try {
      // This would need Firebase Auth Admin SDK to check user claims
      // For now, we'll estimate based on users who might have admin indicators
      adminCount = users.filter(
        user =>
          user.email?.includes('admin') ||
          user.accountType === 'admin' ||
          user.role === 'admin'
      ).length
    } catch (error) {
      console.warn('Could not calculate admin count:', error)
      adminCount = 0
    }

    // Calculate recent registrations (last 7 days)
    const recentRegistrations = users.filter(user => {
      if (!user.createdAt) return false
      const createdAt = user.createdAt.toDate
        ? user.createdAt.toDate()
        : new Date(user.createdAt)
      return createdAt >= sevenDaysAgo
    }).length

    // Calculate monthly growth
    const currentMonthUsers = users.filter(user => {
      if (!user.createdAt) return false
      const createdAt = user.createdAt.toDate
        ? user.createdAt.toDate()
        : new Date(user.createdAt)
      return createdAt >= currentMonthStart
    }).length

    const lastMonthUsers = users.filter(user => {
      if (!user.createdAt) return false
      const createdAt = user.createdAt.toDate
        ? user.createdAt.toDate()
        : new Date(user.createdAt)
      return createdAt >= lastMonthStart && createdAt <= lastMonthEnd
    }).length

    const monthlyGrowth =
      lastMonthUsers > 0
        ? Math.round(
            ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
          )
        : currentMonthUsers > 0
          ? 100
          : 0

    // Calculate business verification stats
    const businessVerificationStats = {
      pending: businesses.filter(
        b => b.verification?.status === BusinessVerificationStatus.PENDING
      ).length,
      verified: businesses.filter(
        b => b.verification?.status === BusinessVerificationStatus.VERIFIED
      ).length,
      rejected: businesses.filter(
        b => b.verification?.status === BusinessVerificationStatus.REJECTED
      ).length,
      unverified: businesses.filter(
        b => b.verification?.status === BusinessVerificationStatus.UNVERIFIED
      ).length,
    }

    const stats: IUserStats = {
      totalUsers,
      activeUsers,
      adminCount,
      businessUsers,
      individualUsers,
      verifiedUsers,
      unverifiedUsers,
      recentRegistrations,
      monthlyGrowth,
      businessVerificationStats,
    }

    return res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
    })
  }
}
