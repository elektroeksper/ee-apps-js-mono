/**
 * User API route for managing user documents
 * Handles user CRUD operations using Firebase Admin SDK
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin'
import { IAppUser } from '@/shared'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { uid } = req.query

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, uid)
      case 'PUT':
        return await handleUpdate(req, res, uid)
      default:
        res.setHeader('Allow', ['GET', 'PUT'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('User API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string
) {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      // User document doesn't exist - this can happen with Google Auth
      // Return a basic user structure that can be created later
      return res.status(404).json({
        error: 'User not found',
        shouldCreateUser: true,
      })
    }

    const userData = userDoc.data() as IAppUser
    return res.status(200).json({
      success: true,
      data: userData,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
}

async function handleUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string
) {
  try {
    console.log('🔧 handleUpdate called for uid:', uid)

    // Verify authentication via session cookie
    const sessionCookie = req.cookies.session

    if (!sessionCookie) {
      console.log('❌ No session cookie found')
      return res.status(401).json({ error: 'No session found' })
    }

    const decodedResult = await verifyIdToken(sessionCookie)

    if (!decodedResult.success || !decodedResult.user) {
      console.log('❌ Session verification failed:', decodedResult.error)
      return res.status(401).json({ error: 'Invalid session' })
    }

    console.log('✅ Session verified for user:', decodedResult.user.uid)

    // Check if we're using Firebase emulators
    const usingEmulators = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true'

    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_FIREBASE_EMULATOR: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR,
      usingEmulators
    })

    // Determine which UID to use for the update
    let targetUid = uid

    // Users can only update their own data
    if (decodedResult.user.uid !== uid) {
      console.log('❌ User mismatch:', {
        sessionUid: decodedResult.user.uid,
        requestUid: uid,
        usingEmulators,
      })

      let allowUpdate = false

      // In emulator mode, be more lenient - allow updates if the email matches
      if (usingEmulators && decodedResult.user.email) {
        console.log('🧪 Emulator mode: Checking if this is the same user by email...')

        try {
          // Check if the requested UID exists and belongs to the same email
          const requestedUserDoc = await adminDb.collection('users').doc(uid).get()
          if (requestedUserDoc.exists) {
            const requestedUserData = requestedUserDoc.data()
            if (requestedUserData?.email === decodedResult.user.email) {
              console.log('✅ Emulator mode: Email match confirmed, using session UID for update')
              allowUpdate = true
              // Use the session UID for the actual update
              targetUid = decodedResult.user.uid
            }
          }
        } catch (emulatorError) {
          console.log('⚠️ Emulator mode: Could not verify email match, proceeding with strict check')
        }
      }

      // If still not allowed, clear session and require re-auth
      if (!allowUpdate) {
        // Clear invalid session cookies to force re-authentication
        const isProduction = process.env.NODE_ENV === 'production'
        const secureFlag = isProduction ? '; Secure' : ''

        res.setHeader('Set-Cookie', [
          `session=; Max-Age=0; HttpOnly${secureFlag}; SameSite=Lax; Path=/`,
          `user-id=; Max-Age=0${secureFlag}; SameSite=Lax; Path=/`,
        ])

        return res.status(403).json({
          error: 'Session user mismatch - please re-authenticate',
          code: 'USER_MISMATCH',
          shouldLogout: true,
        })
      }
    }

    const updateData = req.body
    console.log('📝 Update data received:', JSON.stringify(updateData, null, 2))

    // Remove undefined values and validate
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    if (Object.keys(cleanedData).length === 0) {
      console.log('❌ No valid data to update')
      return res.status(400).json({ error: 'No valid data to update' })
    }

    console.log('📝 Cleaned data:', JSON.stringify(cleanedData, null, 2))

    // Create or update the user document (use set with merge to handle both cases)
    await adminDb
      .collection('users')
      .doc(targetUid)
      .set(
        {
          ...cleanedData,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

    console.log('✅ User document updated successfully')

    // Fetch and return updated document
    const updatedDoc = await adminDb.collection('users').doc(targetUid).get()
    const updatedData = updatedDoc.data() as IAppUser

    console.log('✅ Returning updated data for user:', updatedData?.id)

    return res.status(200).json({
      success: true,
      data: updatedData,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return res.status(500).json({ error: 'Failed to update user' })
  }
}
