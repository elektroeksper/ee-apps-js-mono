import { FB_COLL_NAMES, IAppUser, IBusinessFilter, IBusinessUserInfo } from '@electro-expert/shared'
import { logger } from 'firebase-functions/v2'
import { Change, FirestoreEvent, onDocumentUpdated, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore'
import { businessService } from '../services/business.service'
import { db } from '../utils/firebase-admin'

// Type definitions for better type safety
type UpdatableUserProperty = 'firstName' | 'lastName' | 'email' | 'isActive'

// Constants for maintainability
const USER_PROPERTIES_TO_CHECK: (keyof IAppUser)[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'isDeleted',
  'profilePictureUrl',
  'businessVerified',
  'accountType',
]

const BUSINESS_RELEVANT_PROPS: UpdatableUserProperty[] = [
  'firstName',
  'lastName',
  'email',
  'isActive'
]

// Type-safe property update helper
function updateUserProperty(
  userInfo: IBusinessUserInfo,
  userData: IAppUser,
  prop: UpdatableUserProperty
): void {
  switch (prop) {
    case 'firstName':
      userInfo.firstName = userData.firstName;
      break;
    case 'lastName':
      userInfo.lastName = userData.lastName;
      break;
    case 'email':
      userInfo.email = userData.email;
      break;
    case 'isActive':
      userInfo.isActive = userData.isActive ?? true;
      break;
  }
}

// Type guard for updatable properties
function isUpdatableProperty(prop: string): prop is UpdatableUserProperty {
  return BUSINESS_RELEVANT_PROPS.includes(prop as UpdatableUserProperty);
}

// Get relevant changed properties
function getRelevantChangedProps(beforeData: IAppUser, afterData: IAppUser): UpdatableUserProperty[] {
  return BUSINESS_RELEVANT_PROPS.filter(prop => beforeData[prop] !== afterData[prop]);
}

async function _updateUserBusinesses({ userData, isDeleted = false, changedUserProps = [] }: { userData: IAppUser, isDeleted?: boolean, changedUserProps?: string[] }) {
  try {
    // Input validation
    if (!userData?.id) {
      logger.warn('Invalid user data: missing user ID');
      return;
    }

    if (isDeleted) {
      await _handleUserDeletion(userData);
    } else if (changedUserProps.length > 0) {
      await _handleUserProfileChanges(userData, changedUserProps);
    }
  } catch (error) {
    logger.error('Error updating user businesses:', {
      userId: userData.id,
      isDeleted,
      changedUserProps,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error; // Re-throw to ensure trigger failure is visible
  }
}

async function _handleUserDeletion(userData: IAppUser): Promise<void> {
  if (userData.businessInfo?.ownerId === userData.id) {
    await _handleBusinessOwnerDeletion(userData);
  } else {
    await _handleBusinessMemberDeletion(userData);
  }
}

async function _handleBusinessOwnerDeletion(userData: IAppUser): Promise<void> {
  if (!userData.businessInfo?.businessId) {
    logger.warn(`User ${userData.id} marked as owner but no business info found`);
    return;
  }

  try {
    const result = await businessService.update(userData.businessInfo.businessId, {
      isDeleted: true
    });

    if (result.success) {
      logger.info(`Business ${userData.businessInfo.businessId} marked as deleted due to owner deletion`);
    } else {
      logger.error(`Failed to delete business ${userData.businessInfo.businessId}: ${result.error}`);
    }
  } catch (error) {
    logger.error('Error handling business owner deletion:', error);
    throw error;
  }
}

async function _handleBusinessMemberDeletion(userData: IAppUser): Promise<void> {
  const businesses = await businessService.getAll({ userIds: [userData.id] });
  if (!businesses.success || !businesses.data) {
    logger.warn(`Failed to get businesses for user ${userData.id}: ${businesses.error}`);
    return;
  }

  for (const business of businesses.data) {
    if (business.users && business.users[userData.id]) {
      business.users[userData.id].isActive = false;
      const result = await businessService.update(business.id!, {
        users: business.users
      });

      if (result.success) {
        logger.info(`Set user ${userData.id} as inactive in business ${business.id} due to user deletion.`);
      } else {
        logger.error(`Failed to update business ${business.id}: ${result.error}`);
      }
    }
  }
}

async function _handleUserProfileChanges(userData: IAppUser, changedUserProps: string[]): Promise<void> {
  const filter: IBusinessFilter = { userIds: [userData.id] };
  if (userData.id === userData.businessInfo?.ownerId) {
    filter.ownerId = userData.id;
  }

  const businesses = await businessService.getAll(filter);
  if (!businesses.success || !businesses.data) {
    logger.warn(`Failed to get businesses for user ${userData.id}: ${businesses.error}`);
    return;
  }

  for (const business of businesses.data) {
    if (business.users && business.users[userData.id]) {
      const userInfo = { ...business.users[userData.id] };

      // Type-safe property updates
      changedUserProps.forEach(prop => {
        if (isUpdatableProperty(prop)) {
          updateUserProperty(userInfo, userData, prop);
        }
      });

      const result = await businessService.update(business.id!, {
        users: {
          ...business.users,
          [userData.id]: userInfo
        }
      });

      if (result.success) {
        logger.info(`Updated user ${userData.id} info in business ${business.id} due to profile changes.`);
      } else {
        logger.error(`Failed to update user info in business ${business.id}: ${result.error}`);
      }
    }
  }
}

async function _onUserDocumentDeleted(userId: string): Promise<void> {
  try {
    if (!userId) {
      logger.warn('User ID is required for document deletion handling.');
      return;
    }

    const userRef = db.collection(FB_COLL_NAMES.users).doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      logger.warn(`User document ${userId} not found for document deletion handling.`);
      return;
    }

    const userData = userDoc.data() as IAppUser;
    if (!userData) {
      logger.warn(`User data is undefined for user ${userId} during document deletion handling.`);
      return;
    }

    // Ensure we have the user ID in the data
    userData.id = userId;

    await _updateUserBusinesses({ userData, isDeleted: true });

  } catch (error) {
    logger.error('Error handling user document deletion:', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error; // Re-throw to ensure trigger failure is visible
  }
}

export const onUserDocumentUpdate = onDocumentUpdated(
  {
    document: 'users/{documentId}',
    database: 'native-db', // Use the Native mode database
  },
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { documentId: string; }>) => {
    const documentId = event.params.documentId;
    const beforeData = event.data?.before.data() as IAppUser;
    const afterData = event.data?.after.data() as IAppUser;

    // Enhanced validation
    if (!beforeData || !afterData) {
      logger.warn(`Missing data for user ${documentId}`, {
        hasBefore: !!beforeData,
        hasAfter: !!afterData
      });
      return;
    }

    try {
      // Check for any relevant changes using constants
      const hasChanges = USER_PROPERTIES_TO_CHECK.some(prop => beforeData[prop] !== afterData[prop]);

      if (!hasChanges) {
        logger.debug(`No relevant changes for user ${documentId}`);
        return;
      }

      // Handle deletion first
      if (afterData.isDeleted && !beforeData.isDeleted) {
        logger.info(`Processing user deletion for ${documentId}`);
        await _onUserDocumentDeleted(documentId);
        return;
      }

      // Check for business-relevant changes
      const changedProps = getRelevantChangedProps(beforeData, afterData);
      if (changedProps.length === 0) {
        logger.debug(`No business-relevant changes for user ${documentId}`);
        return;
      }

      logger.info(`Processing user profile update for ${documentId}`, { changedProps });

      // Ensure afterData has the correct ID
      afterData.id = documentId;

      await _updateUserBusinesses({
        userData: afterData,
        changedUserProps: changedProps
      });

    } catch (error) {
      logger.error(`Error processing user document update for ${documentId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Don't re-throw here to prevent infinite retries for permanent failures
    }
  }
);