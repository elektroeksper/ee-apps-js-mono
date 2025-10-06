import { IOperationResult } from "@shared"
import { logger } from "firebase-functions/v2"
import { onCall } from "firebase-functions/v2/https"
import { ADMIN_USERS } from "../configs/constant"
import { auth } from "../utils/firebase-admin"

// Set admin claims for predefined admin users
export const setAdminsClaims = onCall(
  async (_request): Promise<IOperationResult<void>> => {
    try {
      const adminEmails = ADMIN_USERS

      for (const email of adminEmails) {
        try {
          const userRecord = await auth.getUserByEmail(email)
          if (userRecord) {
            await auth.setCustomUserClaims(userRecord.uid, { admin: true })
            logger.info(`Set admin claim for user: ${email}`)
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
