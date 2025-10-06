import {
  BusinessUserRole,
  BusinessVerificationStatus,
  IBusiness,
  IBusinessFilter,
  IBusinessUserInfo,
  IOperationResult,
} from '@shared'
import { FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'
import { db } from '../utils/firebase-admin'

export class BusinessService {
  private collectionName = 'businesses'

  async getAll(
    filter?: IBusinessFilter
  ): Promise<IOperationResult<IBusiness[]>> {
    try {
      let query:
        | FirebaseFirestore.Query
        | FirebaseFirestore.CollectionReference = db.collection(
          this.collectionName
        )

      if (filter) {
        // preceedence: ownerId > userIds > status
        if (filter.ownerId) {
          query = query.where('ownerId', '==', filter.ownerId)
        } else if (filter.userIds && filter.userIds.length > 0) {
          query = query.where(`users.${filter.userIds[0]}`, "!=", null)
        } else if (filter.status) {
          query = query.where('verification.status', '==', filter.status)
        }
      }

      const snapshot = await query.get()
      const businesses: IBusiness[] = []

      snapshot.forEach(doc => {
        const data = doc.data() as IBusiness
        businesses.push({ ...data, id: doc.id })
      })

      // Apply user filtering if needed
      let filteredBusinesses = businesses
      if (filter?.userIds && filter.userIds.length > 0) {
        filteredBusinesses = businesses.filter(business =>
          filter.userIds.some(userId => userId in business.users)
        )
      }

      return { success: true, data: filteredBusinesses }
    } catch (error) {
      logger.error('Error getting businesses:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get businesses',
      }
    }
  }

  async create(data: IBusiness): Promise<IOperationResult<IBusiness>> {
    try {
      const docRef = await db.collection(this.collectionName).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      })

      const createdDoc = await docRef.get()
      const createdBusiness = {
        ...(createdDoc.data() as IBusiness),
        id: docRef.id,
      }

      return { success: true, data: createdBusiness }
    } catch (error) {
      logger.error('Error creating business:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create business',
      }
    }
  }

  async update(
    id: string,
    data: Partial<IBusiness>
  ): Promise<IOperationResult<IBusiness>> {
    try {
      const docRef = db.collection(this.collectionName).doc(id)

      // Check if document exists
      const doc = await docRef.get()
      if (!doc.exists) {
        return { success: false, error: 'Business not found' }
      }

      await docRef.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      })

      const updatedDoc = await docRef.get()
      const updatedBusiness = { ...(updatedDoc.data() as IBusiness), id }

      return { success: true, data: updatedBusiness }
    } catch (error) {
      logger.error('Error updating business:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update business',
      }
    }
  }

  async getById(id: string): Promise<IOperationResult<IBusiness>> {
    try {
      const docRef = db.collection(this.collectionName).doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return { success: false, error: 'Business not found' }
      }

      const business = { ...(doc.data() as IBusiness), id }
      return { success: true, data: business }
    } catch (error) {
      logger.error('Error getting business by ID:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get business',
      }
    }
  }

  async delete(id: string): Promise<IOperationResult<void>> {
    try {
      const docRef = db.collection(this.collectionName).doc(id)

      // Check if document exists
      const doc = await docRef.get()
      if (!doc.exists) {
        return { success: false, error: 'Business not found' }
      }

      // Soft delete
      await docRef.update({
        isDeleted: true,
        updatedAt: new Date(),
      })

      return { success: true }
    } catch (error) {
      logger.error('Error deleting business:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete business',
      }
    }
  }

  async verifyBusiness(
    id: string,
    approve: boolean,
    adminId: string,
    reason?: string
  ): Promise<IOperationResult<void>> {
    try {
      const docRef = db.collection(this.collectionName).doc(id)

      // Check if document exists
      const doc = await docRef.get()
      if (!doc.exists) {
        return { success: false, error: 'Business not found' }
      }

      const currentData = doc.data() as IBusiness
      const currentVerification = currentData.verification || {
        status: BusinessVerificationStatus.UNVERIFIED,
        history: [],
      }

      const verificationUpdate = {
        status: approve
          ? BusinessVerificationStatus.VERIFIED
          : BusinessVerificationStatus.REJECTED,
        history: [
          ...currentVerification.history,
          {
            ...(approve
              ? {
                approvedAt: new Date(),
                approvedBy: adminId,
              }
              : {
                rejectedAt: new Date(),
                rejectedBy: adminId,
                rejectionReason: reason || null,
              }),
          },
        ],
      }

      await docRef.update({
        verification: verificationUpdate,
        updatedAt: new Date(),
        updatedBy: adminId,
      })

      return { success: true }
    } catch (error) {
      logger.error('Error verifying business:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to verify business',
      }
    }
  }

  async addUser(
    businessId: string,
    userId: string,
    info: IBusinessUserInfo
  ): Promise<IOperationResult<void>> {
    try {
      const docRef = db.collection(this.collectionName).doc(businessId)

      // Check if document exists
      const doc = await docRef.get()
      if (!doc.exists) {
        return { success: false, error: 'Business not found' }
      }

      const currentData = doc.data() as IBusiness
      const currentUsers = currentData.users || {}

      // Check if user already exists
      if (userId in currentUsers) {
        return { success: false, error: 'User already exists in this business' }
      }

      const updatedUsers = {
        ...currentUsers,
        [userId]: {
          ...info,
          addedAt: new Date(),
        },
      }

      await docRef.update({
        users: updatedUsers,
        updatedAt: new Date(),
      })

      return { success: true }
    } catch (error) {
      logger.error('Error adding user to business:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to add user to business',
      }
    }
  }

  async removeUser(
    businessId: string,
    userId: string
  ): Promise<IOperationResult<void>> {
    try {
      const docRef = db.collection(this.collectionName).doc(businessId)

      // Check if document exists
      const doc = await docRef.get()
      if (!doc.exists) {
        return { success: false, error: 'Business not found' }
      }

      const currentData = doc.data() as IBusiness
      const currentUsers = currentData.users || {}

      // Check if user exists
      if (!(userId in currentUsers)) {
        return { success: false, error: 'User not found in this business' }
      }

      // Check if trying to remove the owner
      if (currentUsers[userId].role === BusinessUserRole.OWNER) {
        return { success: false, error: 'Cannot remove business owner' }
      }

      // Remove user from the users object
      const updatedUsers = { ...currentUsers }
      delete updatedUsers[userId]

      await docRef.update({
        users: updatedUsers,
        updatedAt: new Date(),
      })

      return { success: true }
    } catch (error) {
      logger.error('Error removing user from business:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to remove user from business',
      }
    }
  }

  async updateUserRole(
    businessId: string,
    userId: string,
    newRole: BusinessUserRole
  ): Promise<IOperationResult<void>> {
    try {
      const docRef = db.collection(this.collectionName).doc(businessId)

      // Check if document exists
      const doc = await docRef.get()
      if (!doc.exists) {
        return { success: false, error: 'Business not found' }
      }

      const currentData = doc.data() as IBusiness
      const currentUsers = currentData.users || {}

      // Check if user exists
      if (!(userId in currentUsers)) {
        return { success: false, error: 'User not found in this business' }
      }

      // Check if trying to change owner role
      if (currentUsers[userId].role === BusinessUserRole.OWNER) {
        return { success: false, error: 'Cannot change business owner role' }
      }

      // Update user role
      const updatedUsers = {
        ...currentUsers,
        [userId]: {
          ...currentUsers[userId],
          role: newRole,
        },
      }

      await docRef.update({
        users: updatedUsers,
        updatedAt: new Date(),
      })

      return { success: true }
    } catch (error) {
      logger.error('Error updating user role:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update user role',
      }
    }
  }
}

export const businessService = new BusinessService()
