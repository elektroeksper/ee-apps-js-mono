/**
 * User Service
 * Handles user profile operations with direct Firestore access and Firebase Functions integration
 */

import { db, functions } from '@/config/firebase';
import {
  IAppUser,
  IBusinessRegisterData,
  IOperationResult,
  IRegisterData,
  IUserFilter,
  IUserService
} from '@/shared-generated';
import { FB_FUNCTIONS } from '@/shared-generated/configs/contants';
import { AppUser } from '@/shared-generated/models/auth-models';
import { collection, doc, Query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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
  async create(data: Partial<IRegisterData | IBusinessRegisterData>): Promise<IOperationResult<IAppUser>> {
    try {
      const { addDoc } = await import('firebase/firestore');
      const newDoc = await addDoc(this.colRef, data);
      return { success: true, data: new AppUser(newDoc.id, data as IAppUser) };
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

}

// Export a singleton instance
export const userService = new UserService();
