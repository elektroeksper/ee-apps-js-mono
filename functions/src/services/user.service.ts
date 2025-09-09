import * as admin from 'firebase-admin';
import { auth, db } from '../utils/firebase-admin';
// Import types from shared-generated (will be copied at build time)
import { AccountType, BusinessVerificationStatus, DocumentStatus, DocumentType, IAppUser, IBusinessDocument, IBusinessProfile, IOperationResult } from '../shared-generated';

// Get user profile
export async function getUserProfile(userId: string): Promise<IOperationResult<IAppUser>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        success: false,
        error: 'User not found',
        code: 404
      };
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data()
    } as IAppUser;

    return {
      success: true,
      data: userData,
      code: 200
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      success: false,
      error: 'Failed to fetch user profile',
      code: 500
    };
  }
}

// Create user profile
export async function createUserProfile(userId: string, userData: Partial<IAppUser>): Promise<IOperationResult<IAppUser>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return {
        success: false,
        error: 'User profile already exists',
        code: 409
      };
    }

    const profileData = {
      ...userData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(profileData);

    const createdUser = await userRef.get();
    const createdUserData = {
      id: createdUser.id,
      ...createdUser.data()
    } as IAppUser;

    return {
      success: true,
      data: createdUserData,
      code: 201
    };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return {
      success: false,
      error: 'Failed to create user profile',
      code: 500
    };
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<IAppUser>): Promise<IOperationResult<IAppUser>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        success: false,
        error: 'User not found',
        code: 404
      };
    }

    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.update(updateData);

    const updatedUser = await userRef.get();
    const updatedUserData = {
      id: updatedUser.id,
      ...updatedUser.data()
    } as IAppUser;

    return {
      success: true,
      data: updatedUserData,
      code: 200
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'Failed to update user profile',
      code: 500
    };
  }
}

// Set admin role
export async function setAdminRole(userId: string): Promise<IOperationResult<void>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    // Set custom claims (single source of truth)
    await auth.setCustomUserClaims(userId, { admin: true });

    // No longer writing isAdmin flag into user document (avoid duplication)
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      code: 200
    };
  } catch (error) {
    console.error('Error setting admin role:', error);
    return {
      success: false,
      error: 'Failed to set admin role',
      code: 500
    };
  }
}

// Create business profile
export async function createBusinessProfile(userId: string, businessData: Partial<IBusinessProfile>): Promise<IOperationResult<IBusinessProfile>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return {
        success: false,
        error: 'User profile already exists',
        code: 409
      };
    }

    const profileData = {
      ...businessData,
      accountType: AccountType.BUSINESS,
      verificationStatus: BusinessVerificationStatus.UNVERIFIED,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(profileData);

    const createdUser = await userRef.get();
    const createdUserData = {
      id: createdUser.id,
      ...createdUser.data()
    } as IBusinessProfile;

    return {
      success: true,
      data: createdUserData,
      code: 201
    };
  } catch (error) {
    console.error('Error creating business profile:', error);
    return {
      success: false,
      error: 'Failed to create business profile',
      code: 500
    };
  }
}

// Update business profile
export async function updateBusinessProfile(userId: string, updates: Partial<IBusinessProfile>): Promise<IOperationResult<IBusinessProfile>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        success: false,
        error: 'User not found',
        code: 404
      };
    }

    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.update(updateData);

    const updatedUser = await userRef.get();
    const updatedUserData = {
      id: updatedUser.id,
      ...updatedUser.data()
    } as IBusinessProfile;

    return {
      success: true,
      data: updatedUserData,
      code: 200
    };
  } catch (error) {
    console.error('Error updating business profile:', error);
    return {
      success: false,
      error: 'Failed to update business profile',
      code: 500
    };
  }
}

// Delete user profile
export async function deleteUserProfile(userId: string): Promise<IOperationResult<void>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    // Delete user document
    await db.collection('users').doc(userId).delete();

    // Delete Firebase Auth user
    await auth.deleteUser(userId);

    return {
      success: true,
      code: 200
    };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return {
      success: false,
      error: 'Failed to delete user profile',
      code: 500
    };
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<IOperationResult<IAppUser>> {
  try {
    if (!email) {
      return {
        success: false,
        error: 'Email is required',
        code: 400
      };
    }

    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return {
        success: false,
        error: 'User not found',
        code: 404
      };
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = {
      id: userDoc.id,
      ...userDoc.data()
    } as IAppUser;

    return {
      success: true,
      data: userData,
      code: 200
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    return {
      success: false,
      error: 'Failed to fetch user',
      code: 500
    };
  }
}

// Search users (admin only)
export async function searchUsers(query: string, filters: any = {}): Promise<IOperationResult<IAppUser[]>> {
  try {
    if (!query) {
      return {
        success: false,
        error: 'Search query is required',
        code: 400
      };
    }

    let usersRef = db.collection('users');

    // Apply filters
    if (filters.accountType) {
      usersRef = usersRef.where('accountType', '==', filters.accountType) as any;
    }

    // isAdmin filter removed (admin now derived solely from auth custom claim at runtime)

    // Simple text search (in a real app, you'd use a search service like Algolia)
    const usersSnapshot = await usersRef.limit(50).get();

    const users = usersSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as IAppUser))
      .filter((user: IAppUser) => {
        const searchText = `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

    return {
      success: true,
      data: users,
      code: 200
    };
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      success: false,
      error: 'Failed to search users',
      code: 500
    };
  }
}

// Create business document
export async function createBusinessDocument(userId: string, documentData: {
  type: DocumentType;
  fileName: string;
  fileUrl: string;
}): Promise<IOperationResult<IBusinessDocument>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    const docData = {
      userId,
      ...documentData,
      status: DocumentStatus.PENDING,
      uploadedAt: new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('businessDocuments').add(docData);
    const createdDoc = await docRef.get();

    const businessDocument: IBusinessDocument = {
      id: createdDoc.id,
      type: documentData.type,
      fileName: documentData.fileName,
      fileUrl: documentData.fileUrl,
      uploadedAt: docData.uploadedAt,
      status: DocumentStatus.PENDING
    };

    return {
      success: true,
      data: businessDocument,
      code: 201
    };
  } catch (error) {
    console.error('Error creating business document:', error);
    return {
      success: false,
      error: 'Failed to upload business document',
      code: 500
    };
  }
}
