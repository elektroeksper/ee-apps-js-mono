/**
 * Google OAuth API Route - Handles Google sign-in for both new and existing users
 * Creates user profile automatically for new Google users
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin'
import {
  AccountType,
  IAppUser,
} from '@/shared'
import { NextApiRequest, NextApiResponse } from 'next'

interface GoogleOAuthRequest {
  idToken: string // Firebase Auth ID token from Google OAuth
  isNewUser?: boolean // Optional hint if this is a new user
}

interface GoogleOAuthResponse {
  success: boolean
  data?: {
    userId: string
    user: IAppUser
    isNewUser: boolean
  }
  error?: string
  code?: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GoogleOAuthResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  try {
    const { idToken }: GoogleOAuthRequest = req.body

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required',
        code: 400,
      })
    }

    // Verify the Firebase Auth token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid
    const email = decodedToken.email
    const name = decodedToken.name

    // Check if user profile already exists
    const existingUserDoc = await adminDb.collection('users').doc(userId).get()
    let user: IAppUser
    let isNewUser = false

    if (existingUserDoc.exists) {
      // Existing user - just log them in
      user = {
        id: existingUserDoc.id,
        ...existingUserDoc.data(),
      } as IAppUser
    } else {
      // New user - create basic profile automatically
      isNewUser = true

      // Parse name from Google account
      const nameParts = (name || '').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const userProfileData: Partial<IAppUser> = {
        id: userId,
        firstName,
        lastName,
        email: email || '',
        accountType: AccountType.INDIVIDUAL, // Default to individual for Google OAuth
        isEmailVerified: decodedToken.email_verified || false,
        isPhoneVerified: false,
        isActive: true,
        isDeleted: false,
        preferences: {
          theme: 'system',
          language: 'tr',
          notifications: {
            email: true,
            push: true,
            sms: false,
            marketing: false,
            orderUpdates: true,
            securityAlerts: true,
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false,
            allowAnalytics: true,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Create user profile in Firestore
      await adminDb.collection('users').doc(userId).set(userProfileData)

      // Fetch the created user profile
      const createdUserDoc = await adminDb.collection('users').doc(userId).get()
      user = {
        id: createdUserDoc.id,
        ...createdUserDoc.data(),
      } as IAppUser
    }

    // Create session cookie for authentication
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    })

    // Set HTTP-only cookie (Secure flag only in production for HTTPS)
    const isProduction = process.env.NODE_ENV === 'production'
    const secureFlag = isProduction ? '; Secure' : ''

    res.setHeader('Set-Cookie', [
      `session=${sessionCookie}; Max-Age=${expiresIn / 1000}; HttpOnly${secureFlag}; SameSite=Lax; Path=/`,
      `user-id=${userId}; Max-Age=${expiresIn / 1000}${secureFlag}; SameSite=Lax; Path=/`,
    ])

    return res.status(200).json({
      success: true,
      data: {
        userId,
        user,
        isNewUser,
      },
      code: 200,
    })
  } catch (error: any) {
    console.error('Google OAuth error:', error)

    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token expired',
        code: 401,
      })
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
        code: 401,
      })
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process Google OAuth',
      code: 500,
    })
  }
}