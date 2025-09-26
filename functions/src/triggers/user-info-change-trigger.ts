import { IAppUser } from '@electro-expert/shared'
import * as functions from 'firebase-functions'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { businessService } from '../services/business.service'
import { auth } from '../utils/firebase-admin'

export const onUserProfileUpdate = onDocumentUpdated(
  {
    document: 'users/{userId}',
    database: 'native-db', // Use the Native mode database
  },
  async event => {
    const beforeData: IAppUser = event.data?.before?.data() as IAppUser
    const afterData: IAppUser = event.data?.after?.data() as IAppUser
    if (!beforeData || !afterData) {
      functions.logger.warn(
        'Missing before or after data in user update trigger'
      )
      return
    }

    // Check if businessInfo field has changed
    if (
      JSON.stringify(beforeData?.businessInfo) ===
      JSON.stringify(afterData?.businessInfo)
    ) {
      return // No change in businessInfo, exit early
    }

    const userId = event.params.userId
    const businessInfo = afterData?.businessInfo

    if (!businessInfo || !businessInfo.businessId) {
      functions.logger.warn('no business info or businessId found for user', {
        userId,
      })
      return // No business info to update
    }

    const businessId = businessInfo.businessId

    try {
      // Fetch the business
      const businessResult = await businessService.getById(businessId)
      if (!businessResult.success || !businessResult.data) {
        console.warn(
          `Business with ID ${businessId} not found for user ${userId}`
        )
        return
      }

      const business = businessResult.data
      // Get the user's last sign-in time from Firebase Auth
      let lastActiveAt: Date | undefined
      try {
        const userRecord = await auth.getUser(userId)
        lastActiveAt = userRecord.metadata.lastSignInTime
          ? new Date(userRecord.metadata.lastSignInTime)
          : undefined
      } catch (err) {
        // Fallback to Firestore lastLogin or current date if Auth lookup fails
        functions.logger.warn(
          `Failed to get Auth record for user ${userId}:`,
          err
        )
      }

      // Update the user's info in the business's users map
      const currentUsers = { ...business.users }
      if (currentUsers[userId]) {
        currentUsers[userId] = {
          ...currentUsers[userId],
          displayName:
            afterData.displayName ?? currentUsers[userId].displayName,
          email: afterData.email ?? currentUsers[userId].email,
          lastActiveAt,
        }

        // Save the updated business
        await businessService.update(businessId, { users: currentUsers })
        console.log(
          `Updated business info for user ${userId} in business ${businessId}`
        )
      } else {
        functions.logger.warn(
          `User ${userId} not found in business ${businessId} users list`
        )
      }
    } catch (error) {
      functions.logger.error('Error updating business user info:', error)
    }
  }
)
