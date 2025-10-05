import * as admin from 'firebase-admin'
import { auth, db } from '../utils/firebase-admin'
// Import types from shared-generated (will be copied at build time)

import { logger } from 'firebase-functions/v2'
import {
  DocumentFileType,
  FB_COLL_NAMES,
  IAppUser,
  IDocument,
  IOperationResult,
  StorageDocumentStatus,
} from '../shared-generated'


export class UserService { }

// Get user profile
export async function getUserProfile(
  userId: string
): Promise<IOperationResult<IAppUser>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400,
      }
    }

    const userDoc = await db.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return {
        success: false,
        error: 'User not found',
        code: 404,
      }
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
    } as IAppUser

    return {
      success: true,
      data: userData,
      code: 200,
    }
  } catch (error) {
    logger.error('Error getting user profile:', error)
    return {
      success: false,
      error: 'Failed to fetch user profile',
      code: 500,
    }
  }
}

// Create user profile
export async function createUserProfile(
  userId: string,
  userData: Partial<IAppUser>
): Promise<IOperationResult<IAppUser>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400,
      }
    }

    if (!userData) {
      return {
        success: false,
        error: 'User data is required',
        code: 400,
      }
    }

    // Prepare user data with timestamps
    const userDoc = {
      ...userData,
      id: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Create user document
    const userRef = db.collection('users').doc(userId)
    await userRef.set(userDoc)

    // Get created user profile
    const createdDoc = await userRef.get()
    const createdUserData = {
      id: createdDoc.id,
      ...createdDoc.data(),
    } as IAppUser

    return {
      success: true,
      data: createdUserData,
      code: 201,
    }
  } catch (error) {
    logger.error('Error creating user profile:', error)
    return {
      success: false,
      error: 'Failed to create user profile',
      code: 500,
    }
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<IAppUser>
): Promise<IOperationResult<IAppUser>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400,
      }
    }

    if (!updates || Object.keys(updates).length === 0) {
      return {
        success: false,
        error: 'Updates are required',
        code: 400,
      }
    }

    // Add timestamp
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Update user document
    const userRef = db.collection('users').doc(userId)
    await userRef.update(updateData)

    // Get updated user profile
    const updatedDoc = await userRef.get()
    if (!updatedDoc.exists) {
      return {
        success: false,
        error: 'User not found after update',
        code: 404,
      }
    }

    const userData = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as IAppUser

    return {
      success: true,
      data: userData,
      code: 200,
    }
  } catch (error) {
    logger.error('Error updating user profile:', error)
    return {
      success: false,
      error: 'Failed to update user profile',
      code: 500,
    }
  }
}

// Set admin role for a user
export async function setAdminRole(
  userId: string
): Promise<IOperationResult<void>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400,
      }
    }

    // Set custom claims (single source of truth)
    await auth.setCustomUserClaims(userId, { admin: true })

    // No longer writing isAdmin flag into user document (avoid duplication)
    const userRef = db.collection('users').doc(userId)
    await userRef.update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      code: 200,
    }
  } catch (error) {
    logger.error('Error setting admin role:', error)
    return {
      success: false,
      error: 'Failed to set admin role',
      code: 500,
    }
  }
}

// Delete user profile
export async function deleteUserProfile(
  userId: string
): Promise<IOperationResult<void>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400,
      }
    }

    // Delete user document
    await db.collection('users').doc(userId).delete()

    // Delete Firebase Auth user
    await auth.deleteUser(userId)

    return {
      success: true,
      code: 200,
    }
  } catch (error) {
    logger.error('Error deleting user profile:', error)
    return {
      success: false,
      error: 'Failed to delete user profile',
      code: 500,
    }
  }
}

// Get user by email
export async function getUserByEmail(
  email: string
): Promise<IOperationResult<IAppUser>> {
  try {
    if (!email) {
      return {
        success: false,
        error: 'Email is required',
        code: 400,
      }
    }

    const usersSnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      return {
        success: false,
        error: 'User not found',
        code: 404,
      }
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
    } as IAppUser

    return {
      success: true,
      data: userData,
      code: 200,
    }
  } catch (error) {
    logger.error('Error getting user by email:', error)
    return {
      success: false,
      error: 'Failed to fetch user',
      code: 500,
    }
  }
}

// Search users by query
export async function searchUsers(
  query: string = '',
  filters: any = {}
): Promise<IOperationResult<IAppUser[]>> {
  try {
    let usersRef = db.collection('users')

    // Apply filters
    if (filters.accountType) {
      usersRef = usersRef.where('accountType', '==', filters.accountType) as any
    }

    // isAdmin filter removed (admin now derived solely from auth custom claim at runtime)

    // Simple text search (in a real app, you'd use a search service like Algolia)
    const usersSnapshot = await usersRef.limit(100).get() // Increased limit for "get all"

    const users = usersSnapshot.docs
      .map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as IAppUser
      )
      .filter((user: IAppUser) => {
        // If no query provided, return all users (after applying filters)
        if (!query || query.trim() === '') {
          return true
        }

        // Otherwise, do text search
        const searchText =
          `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''}`.toLowerCase()
        return searchText.includes(query.toLowerCase())
      })

    return {
      success: true,
      data: users,
      code: 200,
    }
  } catch (error) {
    logger.error('Error searching users:', error)
    return {
      success: false,
      error: 'Failed to search users',
      code: 500,
    }
  }
}

// Create business document
export async function createBusinessDocument(
  userId: string,
  documentData: {
    type: DocumentFileType
    fileName: string
    fileUrl: string
  }
): Promise<IOperationResult<IDocument>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400,
      }
    }

    const docData = {
      userId,
      ...documentData,
      status: StorageDocumentStatus.PENDING,
      uploadedAt: new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await db.collection(FB_COLL_NAMES.documents).add(docData)
    const createdDoc = await docRef.get()

    const businessDocument: any = {
      id: createdDoc.id,
      type: documentData.type,
      fileName: documentData.fileName,
      fileUrl: documentData.fileUrl,
      uploadedAt: docData.uploadedAt,
      status: StorageDocumentStatus.PENDING,
    }

    return {
      success: true,
      data: businessDocument,
      code: 201,
    }
  } catch (error) {
    logger.error('Error creating business document:', error)
    return {
      success: false,
      error: 'Failed to upload business document',
      code: 500,
    }
  }
}

