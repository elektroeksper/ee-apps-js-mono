/**
 * Business Service
 * Handles business operations with direct Firestore access and Firebase Functions integration
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db, ROLE_PERMISSIONS } from '../configs';
import { BusinessUserRole, BusinessVerificationStatus } from '../enums';
import { IAppUser, IBusiness, IBusinessInvitation, IBusinessPermissions, IBusinessRegistrationData, IBusinessUserInfo, IOperationResult } from '../types';

export class BusinessService {
  private colRef = collection(db, 'businesses');

  // CRUD Operations
  async createBusiness(data: IBusinessRegistrationData): Promise<IOperationResult<IBusiness>> {
    try {
      const businessData: Partial<IBusiness> = {
        ...data,
        verification: {
          status: BusinessVerificationStatus.PENDING,
          history: [
            {
              approvedAt: null,
              approvedBy: null,
              rejectedAt: null,
              rejectedBy: null,
              rejectionReason: null,
            }
          ]
        },
        documents: [],
        users: {
          [data.ownerId]: {
            userId: data.ownerId,
            userName: '', // Will be filled by Cloud Function
            email: '', // Will be filled by Cloud Function
            role: BusinessUserRole.OWNER,
            permissions: Object.keys(ROLE_PERMISSIONS[BusinessUserRole.OWNER]).filter(
              key => ROLE_PERMISSIONS[BusinessUserRole.OWNER][key as keyof IBusinessPermissions]
            ),
            isActive: true,
            joinedAt: Timestamp.now(),
          }
        },
        isActive: true,
        createdAt: Timestamp.now().toDate(),
        updatedAt: Timestamp.now().toDate(),
      };

      const docRef = await addDoc(this.colRef, businessData);
      const newBusiness = await this.getBusiness(docRef.id);

      if (newBusiness.success) {
        return newBusiness;
      } else {
        return { success: false, error: 'Failed to retrieve created business' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getBusiness(businessId: string): Promise<IOperationResult<IBusiness>> {
    try {
      const businessDoc = await getDoc(doc(this.colRef, businessId));
      if (businessDoc.exists()) {
        return {
          success: true,
          data: { id: businessDoc.id, ...businessDoc.data() } as IBusiness
        };
      } else {
        return { success: false, error: 'Business not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateBusiness(
    businessId: string,
    updates: Partial<IBusiness>
  ): Promise<IOperationResult<IBusiness>> {
    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(this.colRef, businessId), updateData);
      return await this.getBusiness(businessId);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteBusiness(businessId: string): Promise<IOperationResult<void>> {
    try {
      // Soft delete by marking as inactive
      await updateDoc(doc(this.colRef, businessId), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // User Management Operations
  async getBusinessUsers(businessId: string): Promise<IOperationResult<IBusinessUserInfo[]>> {
    try {
      const businessResult = await this.getBusiness(businessId);
      if (!businessResult.success || !businessResult.data) {
        return { success: false, error: 'Business not found' };
      }

      const users = Object.values(businessResult.data.users || {});
      return { success: true, data: users };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async addUserToBusiness(
    businessId: string,
    userId: string,
    role: BusinessUserRole
  ): Promise<IOperationResult<void>> {
    try {
      return await runTransaction(db, async (transaction) => {
        const businessRef = doc(this.colRef, businessId);
        const userRef = doc(db, 'users', userId);

        const [businessDoc, userDoc] = await Promise.all([
          transaction.get(businessRef),
          transaction.get(userRef)
        ]);

        if (!businessDoc.exists()) {
          throw new Error('Business not found');
        }
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data() as IAppUser;
        const businessUserInfo: IBusinessUserInfo = {
          userId,
          userName: userData.displayName,
          email: userData.email,
          role,
          permissions: Object.keys(ROLE_PERMISSIONS[role]).filter(
            key => ROLE_PERMISSIONS[role][key as keyof IBusinessPermissions]
          ),
          isActive: true,
          joinedAt: Timestamp.now(),
        };

        // Update business users map
        transaction.update(businessRef, {
          [`users.${userId}`]: businessUserInfo,
          updatedAt: Timestamp.now(),
        });

        // Update user's business association
        transaction.update(userRef, {
          businessId,
          businessRole: role,
          joinedBusinessAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        return { success: true };
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async removeUser(businessId: string, userId: string): Promise<IOperationResult<void>> {
    try {
      return await runTransaction(db, async (transaction) => {
        const businessRef = doc(this.colRef, businessId);
        const userRef = doc(db, 'users', userId);

        // Remove user from business users map
        transaction.update(businessRef, {
          [`users.${userId}`]: deleteDoc as any, // Firestore delete field
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

  async updateUserRole(
    businessId: string,
    userId: string,
    newRole: BusinessUserRole
  ): Promise<IOperationResult<void>> {
    try {
      return await runTransaction(db, async (transaction) => {
        const businessRef = doc(this.colRef, businessId);
        const userRef = doc(db, 'users', userId);

        const newPermissions = Object.keys(ROLE_PERMISSIONS[newRole]).filter(
          key => ROLE_PERMISSIONS[newRole][key as keyof IBusinessPermissions]
        );

        // Update role and permissions in business map
        transaction.update(businessRef, {
          [`users.${userId}.role`]: newRole,
          [`users.${userId}.permissions`]: newPermissions,
          updatedAt: Timestamp.now(),
        });

        // Update user's role
        transaction.update(userRef, {
          businessRole: newRole,
          updatedAt: Timestamp.now(),
        });

        return { success: true };
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Invitation Management (Subcollection)
  async inviteUser(
    businessId: string,
    email: string,
    role: BusinessUserRole,
    invitedBy: string,
    message?: string
  ): Promise<IOperationResult<IBusinessInvitation>> {
    try {
      // Validate inviter permissions
      const canInvite = await this.canUserInviteRole(businessId, invitedBy, role);
      if (!canInvite) {
        return {
          success: false,
          error: 'Insufficient permissions to invite this role',
        };
      }

      // Determine if approval is required
      const requiresApproval = await this.requiresApproval(businessId, invitedBy, role);

      const invitationData: Partial<IBusinessInvitation> = {
        invitedEmail: email,
        invitedRole: role,
        invitedBy,
        message,
        requiresApproval,
        status: requiresApproval ? 'pending_approval' : 'pending',
        token: this.generateSecureToken(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
        createdAt: Timestamp.now().toDate(),
        updatedAt: Timestamp.now().toDate(),
      };

      const invitationsRef = collection(db, `businesses/${businessId}/invitations`);
      const docRef = await addDoc(invitationsRef, invitationData);

      return {
        success: true,
        data: { id: docRef.id, ...invitationData } as IBusinessInvitation,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getBusinessInvitations(businessId: string): Promise<IOperationResult<IBusinessInvitation[]>> {
    try {
      const invitationsRef = collection(db, `businesses/${businessId}/invitations`);
      const snapshot = await getDocs(invitationsRef);
      const invitations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IBusinessInvitation[];

      return { success: true, data: invitations };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Permission Helpers
  async canUserInviteRole(
    businessId: string,
    userId: string,
    targetRole: BusinessUserRole
  ): Promise<boolean> {
    try {
      const businessResult = await this.getBusiness(businessId);
      if (!businessResult.success || !businessResult.data) {
        return false;
      }

      const userInfo = businessResult.data.users[userId];
      if (!userInfo) {
        return false;
      }

      const userPermissions = ROLE_PERMISSIONS[userInfo.role];

      switch (targetRole) {
        case BusinessUserRole.OWNER:
          return false; // Only system admins can create owners
        case BusinessUserRole.MANAGER:
          return userPermissions.canInviteManagers;
        case BusinessUserRole.TECHNICIAN:
          return userPermissions.canInviteTechnicians;
        case BusinessUserRole.SUPPORT:
          return userPermissions.canInviteSupport;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  async requiresApproval(
    businessId: string,
    invitedBy: string,
    targetRole: BusinessUserRole
  ): Promise<boolean> {
    try {
      const businessResult = await this.getBusiness(businessId);
      if (!businessResult.success || !businessResult.data) {
        return true;
      }

      const inviterInfo = businessResult.data.users[invitedBy];
      if (!inviterInfo) {
        return true;
      }

      // Owners don't need approval
      if (inviterInfo.role === BusinessUserRole.OWNER) {
        return false;
      }

      // All other roles need owner approval
      return true;
    } catch (error) {
      return true;
    }
  }

  // Utility Methods
  private generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);
  }

  // Get permissions for a role
  getPermissionsForRole(role: BusinessUserRole): IBusinessPermissions {
    return ROLE_PERMISSIONS[role];
  }
}

export const businessService = new BusinessService();
