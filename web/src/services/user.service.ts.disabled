import { functions } from '@/config/firebase';
import {
  AccountType,
  BusinessUserRole,
  BusinessVerificationStatus,
  IAppUser,
  IBusinessRegisterData,
  IOperationResult,
  IRegisterData,
  IUserFilter
} from '@/shared-generated';
import { httpsCallable } from 'firebase/functions';
import { businessService } from './business.service';

export class UserService {
  async getAll(filter: IUserFilter): Promise<IOperationResult<IAppUser[]>> {
    try {
      const getAllUsersFunction = httpsCallable(functions, 'getAllUsers');
      const result = await getAllUsersFunction({ filter });
      return result.data as IOperationResult<IAppUser[]>;
    } catch (error: any) {
      console.error('UserService.getAll error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch users'
      };
    }
  }

  async getById(uid: string): Promise<IOperationResult<IAppUser>> {
    try {
      const getUserProfileFunction = httpsCallable(functions, 'getUserProfile');
      const result = await getUserProfileFunction({ uid });
      return result.data as IOperationResult<IAppUser>;
    } catch (error: any) {
      console.error('UserService.getById error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user'
      };
    }
  }

  async update(uid: string, data: Partial<IAppUser>): Promise<IOperationResult<IAppUser>> {
    try {
      const updateUserProfileFunction = httpsCallable(functions, 'updateUserProfile');
      const result = await updateUserProfileFunction({ uid, data });
      return result.data as IOperationResult<IAppUser>;
    } catch (error: any) {
      console.error('UserService.update error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update user'
      };
    }
  }

  async delete(uid: string): Promise<IOperationResult<void>> {
    try {
      const deleteUserProfileFunction = httpsCallable(functions, 'deleteUserProfile');
      const result = await deleteUserProfileFunction({ uid });
      return result.data as IOperationResult<void>;
    } catch (error: any) {
      console.error('UserService.delete error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete user'
      };
    }
  }

  async checkExists(uid: string): Promise<boolean> {
    try {
      const result = await this.getById(uid);
      return result.success;
    } catch (error: any) {
      console.error('UserService.checkExists error:', error);
      return false;
    }
  }

  async create(data: IRegisterData | IBusinessRegisterData, userId: string): Promise<IOperationResult<IAppUser>> {
    try {
      // Determine if this is a business registration
      const isBusinessRegistration = data.accountType === AccountType.BUSINESS;

      // Prepare user data
      const userData: Partial<IAppUser> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        accountType: data.accountType,
        isEmailVerified: false,
        isPhoneVerified: false,
        isActive: true,
        isDeleted: false,
        preferences: {
          theme: 'system',
          language: 'tr',
          notifications: {
            email: true,
            push: true,
            sms: false,
            marketing: false,
            orderUpdates: true,
            securityAlerts: true
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false,
            allowAnalytics: true
          }
        },
        displayName: data.firstName && data.lastName
          ? `${data.firstName} ${data.lastName}`
          : data.email?.split('@')[0] || ''
      };

      // Create user profile via Firebase Function
      const createUserFunction = httpsCallable(functions, 'createUserProfile');
      const userResult = await createUserFunction({ userData });

      if (!userResult.data || !(userResult.data as IOperationResult<IAppUser>).success) {
        return {
          success: false,
          error: (userResult.data as IOperationResult<IAppUser>).error || 'Failed to create user profile'
        };
      }

      const createdUser = (userResult.data as IOperationResult<IAppUser>).data!;

      // If this is a business registration, create the business entity
      if (isBusinessRegistration && 'businessName' in data) {
        const businessData = data as IBusinessRegisterData;

        // Create business entity
        const businessEntity = {
          businessName: businessData.businessName,
          taxNumber: businessData.taxNumber,
          taxNumberType: businessData.taxNumberType,
          identityNumber: businessData.identityNumber,
          taxOffice: businessData.taxOffice,
          addresses: [businessData.address],
          phone: businessData.phone,
          website: businessData.website,
          companySize: businessData.companySize,
          mainCategoryId: businessData.industry,
          ownerId: userId,
          verification: {
            status: BusinessVerificationStatus.UNVERIFIED,
            history: []
          },
          users: {
            [userId]: {
              businessId: '', // Will be set after business creation
              userId: userId,
              businessTitle: businessData.userTitle,
              displayName: createdUser.displayName || '',
              email: createdUser.email,
              role: BusinessUserRole.OWNER,
              permissions: {
                canEditBusinessInfo: true,
                canDeleteBusiness: true,
                canManageDocuments: true,
                canInviteUsers: true,
                canApproveInvitations: true,
                canRemoveUsers: true,
                canChangeUserRoles: true,
                canInviteOwners: false,
                canInviteManagers: true,
                canInviteTechnicians: true,
                canInviteSupport: true,
                canViewOrders: true,
                canManageOrders: true,
                canViewAnalytics: true,
                canManageInventory: true,
                canViewFinancials: true,
                canManagePayments: true
              },
              isActive: true,
              addedAt: new Date()
            }
          },
          isActive: true
        };

        const businessResult = await businessService.create(businessEntity);

        if (!businessResult.success) {
          // Rollback user creation if business creation fails
          console.error('Failed to create business for user, rolling back user profile:', businessResult.error);

          try {
            await this.delete(userId);
          } catch (rollbackError) {
            console.error('Failed to rollback user profile after business creation failure:', rollbackError);
          }

          return {
            success: false,
            error: `Business registration failed: ${businessResult.error}`
          };
        }

        // Update user with business reference - this maintains user permissions and role info
        const updatedUserData = {
          ...createdUser,
          businessInfo: {
            businessId: businessResult.data!.id!,
            userId: userId,
            businessTitle: businessData.userTitle,
            displayName: createdUser.displayName || '',
            email: createdUser.email,
            role: BusinessUserRole.OWNER,
            permissions: businessEntity.users[userId].permissions,
            isActive: true,
            addedAt: new Date()
          }
        };

        const updateResult = await this.update(userId, updatedUserData);

        if (!updateResult.success) {
          console.error('Failed to update user with business info:', updateResult.error);

          // Try to rollback user creation (business will remain but orphaned)
          // TODO: Implement business deletion in BusinessService for complete rollback
          try {
            await this.delete(userId);
          } catch (rollbackError) {
            console.error('Failed to rollback user after update failure:', rollbackError);
          }

          return {
            success: false,
            error: `Failed to complete business registration: ${updateResult.error}`
          };
        }

        return {
          success: true,
          data: updateResult.data!
        };
      }

      return {
        success: true,
        data: createdUser
      };
    } catch (error: any) {
      console.error('UserService.create error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create user'
      };
    }
  }

  // Business-related methods that work with the user's associated business
  async approveBusiness(userId: string): Promise<IOperationResult<void>> {
    try {
      // First, get all businesses associated with this user
      const businessesResult = await businessService.getAll({ userIds: [userId] });

      if (!businessesResult.success || !businessesResult.data || businessesResult.data.length === 0) {
        return {
          success: false,
          error: 'No business found for this user'
        };
      }

      // Get the user's business (assuming one business per user)
      const business = businessesResult.data[0];

      if (!business.id) {
        return {
          success: false,
          error: 'Business ID not found'
        };
      }

      // Approve the business
      const result = await businessService.approve(business.id);
      return result;
    } catch (error: any) {
      console.error('UserService.approveBusiness error:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve business'
      };
    }
  }

  async rejectBusiness(userId: string, reason?: string): Promise<IOperationResult<void>> {
    try {
      // First, get all businesses associated with this user
      const businessesResult = await businessService.getAll({ userIds: [userId] });

      if (!businessesResult.success || !businessesResult.data || businessesResult.data.length === 0) {
        return {
          success: false,
          error: 'No business found for this user'
        };
      }

      // Get the user's business (assuming one business per user)
      const business = businessesResult.data[0];

      if (!business.id) {
        return {
          success: false,
          error: 'Business ID not found'
        };
      }

      // Reject the business
      const result = await businessService.reject(business.id, reason);
      return result;
    } catch (error: any) {
      console.error('UserService.rejectBusiness error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reject business'
      };
    }
  }

  // Search users
  async search(query: string, filters?: any): Promise<IOperationResult<IAppUser[]>> {
    try {
      const searchUsersFunction = httpsCallable(functions, 'searchUsers');
      const result = await searchUsersFunction({ query, filters });
      return result.data as IOperationResult<IAppUser[]>;
    } catch (error: any) {
      console.error('UserService.search error:', error);
      return {
        success: false,
        error: error.message || 'Failed to search users'
      };
    }
  }
}

export const userService = new UserService();