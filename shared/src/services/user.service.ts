/**
 * User Service
 * Handles user profile operations with direct Firestore access and Firebase Functions integration
 */

import { collection, doc, Query, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, FB_FUNCTIONS, functions } from '../configs';
import { AccountType } from '../enums';
import { AppUser } from '../models/user-models';
import { IAppUser, IBusiness, IOperationResult, IRegisterData, IUserFilter, IUserService } from '../types';

export class UserService implements IUserService {
  colRef = collection(db, 'users');

  async getAll(filter: IUserFilter): Promise<IOperationResult<IAppUser[]>> {
    try {
      let q: Query = this.colRef;
      if (filter && Object.keys(filter).length > 0) {
        const { where, query } = await import('firebase/firestore');
        const conditions = Object.entries(filter)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => where(key, '==', value));
        if (conditions.length > 0) {
          q = query(this.colRef, ...conditions);
        }
      }
      const { getDocs } = await import('firebase/firestore');
      const usersSnapshot = await getDocs(q);
      const users = usersSnapshot.docs.map(doc => new AppUser(doc.id, doc.data() as IAppUser));
      return { success: true, data: users };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async getById(id: string): Promise<IOperationResult<IAppUser>> {
    try {
      const { getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(this.colRef, id));
      if (userDoc.exists()) {
        return { success: true, data: new AppUser(userDoc.id, userDoc.data()) };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async update(id: string, data: Partial<IAppUser>): Promise<IOperationResult<IAppUser>> {
    try {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(this.colRef, id));
      if (userDoc.exists()) {

        await updateDoc(doc(this.colRef, id), data);
        return { success: true, data: new AppUser(userDoc.id, { ...userDoc.data(), ...data }) };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async delete(uid: string): Promise<IOperationResult<void>> {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(this.colRef, uid));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  async checkExists(uid: string): Promise<boolean> {
    try {
      const { getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(this.colRef, uid));
      return userDoc.exists();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  getUserData(data: Partial<IRegisterData>): IAppUser {

    const baseUser: IAppUser = {
      id: '', // Will be set by Firestore
      email: data.email || '',
      displayName: `${data.email?.split('@')[0] || ''}`,
      accountType: data.accountType ?? AccountType.INDIVIDUAL,
      isEmailVerified: false,
      preferences: {
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
      isActive: true,
      isDeleted: false,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      firstName: '',
      lastName: '',
      isPhoneVerified: false
    };

    return baseUser;
  }

  async create(data: Partial<IRegisterData>): Promise<IOperationResult<IAppUser>> {
    try {
      const { addDoc } = await import('firebase/firestore');
      const getUserData = this.getUserData(data);
      const newDoc = await addDoc(this.colRef, getUserData);
      return { success: true, data: new AppUser(newDoc.id, getUserData) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Business approval functions using Firebase Functions
  async approveBusiness(userId: string): Promise<IOperationResult<IAppUser>> {
    try {
      const approveBusinessFunction = httpsCallable(functions, FB_FUNCTIONS.approveBusinessAccount);
      const result = await approveBusinessFunction({ userId });

      if (result.data && (result.data as any).success) {
        return {
          success: true,
          data: (result.data as any).data
        };
      } else {
        return {
          success: false,
          error: (result.data as any).message || 'Failed to approve business account'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to approve business account'
      };
    }
  }

  async rejectBusiness(userId: string, reason?: string): Promise<IOperationResult<IAppUser>> {
    try {
      console.log('🔴 UserService: rejectBusiness called', { userId, reason })
      const rejectBusinessFunction = httpsCallable(functions, FB_FUNCTIONS.rejectBusinessAccount);
      console.log('🔴 UserService: Calling Firebase function')
      const result = await rejectBusinessFunction({ userId, reason });
      console.log('🔴 UserService: Firebase function result:', result.data)

      if (result.data && (result.data as any).success) {
        return {
          success: true,
          data: (result.data as any).data
        };
      } else {
        return {
          success: false,
          error: (result.data as any).message || 'Failed to reject business account'
        };
      }
    } catch (error: any) {
      console.error('🔴 UserService: Error in rejectBusiness:', error)
      return {
        success: false,
        error: error.message || 'Failed to reject business account'
      };
    }
  }

  async clearBusinessRejection(userId: string): Promise<IOperationResult<IAppUser>> {
    try {
      console.log('clearBusinessRejection: Starting for user:', userId);

      // First, get current user data to access existing businessInfo
      const getCurrentUser = await this.getById(userId);
      if (!getCurrentUser.success || !getCurrentUser.data) {
        console.error('clearBusinessRejection: User not found:', userId);
        return {
          success: false,
          error: 'User not found'
        };
      }

      const currentUser = getCurrentUser.data as any;
      const currentBusinessInfo = currentUser.businessInfo || {};
      console.log('clearBusinessRejection: Current businessInfo:', currentBusinessInfo);

      // Create updated businessInfo object with rejection fields cleared
      const { rejectedAt, rejectedBy, rejectionReason, ...cleanBusinessInfo } = currentBusinessInfo;
      const updatedBusinessInfo = {
        ...cleanBusinessInfo,
        isApproved: false, // Reset to pending status
        submittedAt: new Date().toISOString() // Track re-submission
      };

      console.log('clearBusinessRejection: Updated businessInfo:', updatedBusinessInfo);

      // Use direct Firestore update instead of Firebase Function to avoid permission issues
      const { updateDoc } = await import('firebase/firestore');
      const userDocRef = doc(this.colRef, userId);

      await updateDoc(userDocRef, {
        businessInfo: updatedBusinessInfo,
        updatedAt: new Date().toISOString()
      });

      console.log('clearBusinessRejection: Firestore update completed');

      // Return the updated user
      const updatedUserResult = await this.getById(userId);
      if (updatedUserResult.success) {
        console.log('clearBusinessRejection: Successfully retrieved updated user');
        return {
          success: true,
          data: updatedUserResult.data
        };
      } else {
        console.error('clearBusinessRejection: Failed to retrieve updated user');
        return {
          success: false,
          error: 'Failed to retrieve updated user data'
        };
      }
    } catch (error: any) {
      console.error('UserService: Error in clearBusinessRejection:', error)
      return {
        success: false,
        error: error.message || 'Failed to clear business rejection status'
      };
    }
  }


  async leaveBusiness(userId: string): Promise<IOperationResult<void>> {
    try {
      const userResult = await this.getById(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, error: 'User not found' };
      }

      const user = userResult.data;
      if (!user.businessId) {
        return { success: false, error: 'User is not associated with any business' };
      }

      // Check if user is the business owner
      const { getDoc } = await import('firebase/firestore');
      const businessDoc = await getDoc(doc(db, 'businesses', user.businessId));

      if (businessDoc.exists()) {
        const business = businessDoc.data() as IBusiness;
        if (business.ownerId === userId) {
          return {
            success: false,
            error: 'Business owner cannot leave business. Transfer ownership first.'
          };
        }
      }

      return await runTransaction(db, async (transaction) => {
        const businessRef = doc(db, 'businesses', user.businessId!);
        const userRef = doc(this.colRef, userId);

        // Remove user from business users map
        transaction.update(businessRef, {
          [`users.${userId}`]: null, // Delete field
          updatedAt: Timestamp.now(),
        });

        // Clear user's business association
        transaction.update(userRef, {
          businessId: null,
          businessRole: null,
          businessPermissions: null,
          joinedBusinessAt: null,
          updatedAt: Timestamp.now(),
        });

        return { success: true };
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async acceptBusinessInvitation(
    userId: string,
    invitationToken: string
  ): Promise<IOperationResult<void>> {
    try {
      // This would typically call a Firebase Function to handle the complex logic
      // of finding the invitation by token, validating it, and updating both
      // user and business documents atomically
      const acceptInvitationFunction = httpsCallable(functions, 'acceptBusinessInvitation');

      const result = await acceptInvitationFunction({
        userId,
        invitationToken
      });

      if (result.data && (result.data as any).success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: (result.data as any).message || 'Failed to accept invitation'
        };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

}

// Export a singleton instance
export const userService = new UserService();
