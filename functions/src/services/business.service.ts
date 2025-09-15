/**
 * Business Service for Firebase Functions
 * Handles server-side business operations and user-business relationship management
 */

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  BusinessUserRole,
  IAppUser,
  IBusiness,
  IBusinessCreateData,
  IBusinessInvitation,
  IOperationResult
} from '../shared-generated';
import { db } from '../utils/firebase-admin';

// Permission Matrix - matches the architecture document
const ROLE_PERMISSIONS: Record<BusinessUserRole, string[]> = {
  [BusinessUserRole.OWNER]: [
    'canEditBusinessInfo', 'canDeleteBusiness', 'canManageDocuments',
    'canInviteUsers', 'canApproveInvitations', 'canRemoveUsers', 'canChangeUserRoles',
    'canInviteManagers', 'canInviteTechnicians', 'canInviteSupport',
    'canViewOrders', 'canManageOrders', 'canViewAnalytics', 'canManageInventory',
    'canViewFinancials', 'canManagePayments'
  ],
  [BusinessUserRole.MANAGER]: [
    'canInviteUsers', 'canInviteTechnicians', 'canInviteSupport',
    'canViewOrders', 'canManageOrders', 'canViewAnalytics', 'canManageInventory'
  ],
  [BusinessUserRole.TECHNICIAN]: [
    'canViewOrders', 'canManageOrders', 'canManageInventory'
  ],
  [BusinessUserRole.SUPPORT]: [
    'canViewOrders'
  ],
};

export class BusinessService {
  // CRUD Operations
  async createBusiness(data: IBusinessCreateData): Promise<IOperationResult<IBusiness>> {
    try {
      // First, get the owner's user data
      const userDoc = await db.collection('users').doc(data.ownerId).get();
      if (!userDoc.exists) {
        return { success: false, error: 'Owner user not found' };
      }

      const userData = userDoc.data() as IAppUser;

      const businessData: any = {
        ...data,
        verificationStatus: 'unverified' as any,
        documents: [],
        isApproved: false,
        users: {
          [data.ownerId]: {
            userId: data.ownerId,
            userName: userData.displayName,
            email: userData.email,
            role: BusinessUserRole.OWNER,
            permissions: ROLE_PERMISSIONS[BusinessUserRole.OWNER],
            isActive: true,
            joinedAt: Timestamp.now(),
          }
        },
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await db.collection('businesses').add(businessData);

      // Update the user's business association
      await userDoc.ref.update({
        businessId: docRef.id,
        businessRole: BusinessUserRole.OWNER,
        joinedBusinessAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        success: true,
        data: { id: docRef.id, ...businessData } as IBusiness
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getBusiness(businessId: string): Promise<IOperationResult<IBusiness>> {
    try {
      const businessDoc = await db.collection('businesses').doc(businessId).get();
      if (businessDoc.exists) {
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

      await db.collection('businesses').doc(businessId).update(updateData);
      return await this.getBusiness(businessId);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // User Management Operations
  async addUserToBusiness(
    businessId: string,
    userId: string,
    role: BusinessUserRole
  ): Promise<IOperationResult<void>> {
    try {
      return await db.runTransaction(async (transaction) => {
        const businessRef = db.collection('businesses').doc(businessId);
        const userRef = db.collection('users').doc(userId);

        const [businessDoc, userDoc] = await Promise.all([
          transaction.get(businessRef),
          transaction.get(userRef)
        ]);

        if (!businessDoc.exists) {
          throw new Error('Business not found');
        }
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data() as IAppUser;
        const businessUserInfo: any = {
          userId,
          userName: userData.displayName,
          email: userData.email,
          role,
          permissions: ROLE_PERMISSIONS[role],
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

  async removeUserFromBusiness(businessId: string, userId: string): Promise<IOperationResult<void>> {
    try {
      return await db.runTransaction(async (transaction) => {
        const businessRef = db.collection('businesses').doc(businessId);
        const userRef = db.collection('users').doc(userId);

        // Remove user from business users map
        transaction.update(businessRef, {
          [`users.${userId}`]: FieldValue.delete(),
          updatedAt: Timestamp.now(),
        });

        // Clear user's business association
        transaction.update(userRef, {
          businessId: FieldValue.delete(),
          businessRole: FieldValue.delete(),
          businessPermissions: FieldValue.delete(),
          joinedBusinessAt: FieldValue.delete(),
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
      return await db.runTransaction(async (transaction) => {
        const businessRef = db.collection('businesses').doc(businessId);
        const userRef = db.collection('users').doc(userId);

        const newPermissions = ROLE_PERMISSIONS[newRole];

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

  // Invitation Management
  async createInvitation(
    businessId: string,
    invitationData: Partial<IBusinessInvitation>
  ): Promise<IOperationResult<IBusinessInvitation>> {
    try {
      const data = {
        ...invitationData,
        // Convert Date to Timestamp if needed
        expiresAt: invitationData.expiresAt instanceof Date
          ? Timestamp.fromDate(invitationData.expiresAt)
          : invitationData.expiresAt,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await db
        .collection('businesses')
        .doc(businessId)
        .collection('invitations')
        .add(data);

      return {
        success: true,
        data: { id: docRef.id, ...data } as IBusinessInvitation,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async acceptInvitation(invitationToken: string): Promise<IOperationResult<void>> {
    try {
      // Search for invitation by token across all businesses
      let foundInvitation: any = null;
      let businessId: string = '';
      let invitationId: string = '';

      // This is not efficient for large scale - consider adding a separate tokens collection
      const businessesSnapshot = await db.collection('businesses').get();

      for (const businessDoc of businessesSnapshot.docs) {
        const invitationsSnapshot = await businessDoc.ref
          .collection('invitations')
          .where('token', '==', invitationToken)
          .where('status', '==', 'pending')
          .get();

        if (!invitationsSnapshot.empty) {
          foundInvitation = invitationsSnapshot.docs[0].data();
          businessId = businessDoc.id;
          invitationId = invitationsSnapshot.docs[0].id;
          break;
        }
      }

      if (!foundInvitation) {
        return { success: false, error: 'Invalid or expired invitation' };
      }

      // Check if invitation is expired
      if (foundInvitation.expiresAt.toDate() < new Date()) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Find user by email
      const usersSnapshot = await db.collection('users')
        .where('email', '==', foundInvitation.invitedEmail)
        .get();

      if (usersSnapshot.empty) {
        return { success: false, error: 'User not found' };
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;

      // Add user to business
      const result = await this.addUserToBusiness(
        businessId,
        userId,
        foundInvitation.invitedRole
      );

      if (!result.success) {
        return result;
      }

      // Mark invitation as accepted
      await db.collection('businesses')
        .doc(businessId)
        .collection('invitations')
        .doc(invitationId)
        .update({
          status: 'accepted',
          respondedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async approveInvitation(
    businessId: string,
    invitationId: string,
    approvedBy: string
  ): Promise<IOperationResult<void>> {
    try {
      await db.collection('businesses')
        .doc(businessId)
        .collection('invitations')
        .doc(invitationId)
        .update({
          status: 'pending',
          approvedBy,
          approvedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Utility Methods
  generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);
  }

  // Sync user changes to business map
  async syncUserChangesToBusiness(userId: string, userChanges: Partial<IAppUser>): Promise<void> {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return;

      const userData = userDoc.data() as IAppUser;
      if (!userData.businessId) return;

      const relevantChanges: any = {};

      if (userChanges.displayName) {
        relevantChanges[`users.${userId}.userName`] = userChanges.displayName;
      }
      if (userChanges.email) {
        relevantChanges[`users.${userId}.email`] = userChanges.email;
      }
      if (userChanges.isActive !== undefined) {
        relevantChanges[`users.${userId}.isActive`] = userChanges.isActive;
      }

      if (Object.keys(relevantChanges).length > 0) {
        relevantChanges[`users.${userId}.lastActiveAt`] = Timestamp.now();
        relevantChanges.updatedAt = Timestamp.now();

        await db.collection('businesses').doc(userData.businessId).update(relevantChanges);
      }
    } catch (error) {
      console.error('Failed to sync user changes to business:', error);
    }
  }
}

export const businessService = new BusinessService();
