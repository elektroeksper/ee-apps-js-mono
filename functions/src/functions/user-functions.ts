import { IOperationResult } from "@shared"
import * as admin from 'firebase-admin'
import { UserRecord } from "firebase-admin/auth"
import { logger } from "firebase-functions/v2"
import { onCall } from "firebase-functions/v2/https"
import { ADMIN_USERS } from "../configs/constant"
import { auth, db } from "../utils/firebase-admin"

// Set admin claims for predefined admin users
export const setAdminsClaims = onCall(
  async (_request): Promise<IOperationResult<void>> => {
    try {
      const adminEmails = ADMIN_USERS

      for (const email of adminEmails) {
        try {
          const userRecord = await auth.getUserByEmail(email)
          if (userRecord) {
            // Set admin claim in Firebase Auth (source of truth for roles)
            await auth.setCustomUserClaims(userRecord.uid, { admin: true })

            // Verify email in Firebase Auth (source of truth for email verification)
            if (!userRecord.emailVerified) {
              await auth.updateUser(userRecord.uid, { emailVerified: true })
              logger.info(`Set admin claim and verified email in Firebase Auth for: ${email}`)
            } else {
              logger.info(`Set admin claim in Firebase Auth for: ${email}`)
            }

            // Sync to Firestore user document (denormalized cache for quick reads)
            const userRef = db.collection('users').doc(userRecord.uid)
            const userDoc = await userRef.get()

            if (userDoc.exists) {
              await userRef.update({
                isEmailVerified: true, // Cache from Firebase Auth
                isAdmin: true, // Cache from custom claims
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              })
              logger.info(`Synced Firestore cache for: ${email}`)
            } else {
              logger.warn(`Firestore user document not found for: ${email}`)
            }
          } else {
            logger.warn(`User not found for email: ${email}`)
          }
        } catch (error) {
          logger.error(`Error setting admin claim for email ${email}:`, error)
        }
      }

      return {
        success: true,
        code: 200,
      }
    } catch (error) {
      logger.error('Error setting admin claims:', error)
      return {
        success: false,
        error: 'Failed to set admin claims',
        code: 500,
      }
    }
  }
)

export const checkUserClaims = onCall(
  async (request): Promise<IOperationResult<{ claims: any }>> => {
    try {
      const { userId, claims } = request.data as {
        userId: string
        claims: string[]
      }
      if (!userId || !claims || !Array.isArray(claims)) {
        return {
          success: false,
          error: 'userId and claims array are required',
          code: 400,
        }
      }

      const user = await auth.getUser(userId)
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 404,
        }
      }

      const userClaims = user.customClaims || {}
      const hasAllClaims = claims.every(claim => userClaims[claim] === true)
      if (!hasAllClaims) {
        return {
          success: false,
          error: 'User does not have required claims',
          code: 403,
        }
      }
      return {
        success: true,
        data: { claims: userClaims },
        code: 200,
      }
    } catch (error) {
      logger.error('Error checking admin claims:', error)
      return {
        success: false,
        error: 'Failed to check admin claims',
        code: 500,
      }
    }
  }
)

export const getUserProfile = onCall(
  async (request): Promise<IOperationResult<UserRecord>> => {
    try {
      const { userId } = request.data as {
        userId: string
      };
      if (!userId) {
        return {
          success: false,
          error: 'userId is required',
          code: 400,
        }
      }

      const user = await auth.getUser(userId)
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 404,
        }
      }

      return {
        success: true,
        data: user,
        code: 200,
      }
    } catch (error) {
      logger.error('Error checking admin claims:', error)
      return {
        success: false,
        error: 'Failed to check admin claims',
        code: 500,
      }
    }
  }
)
