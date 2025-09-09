import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, HttpsOptions, onCall } from 'firebase-functions/v2/https';
import { ADMIN_USERS } from './configs/constant';
import { geocodingService } from './services/geo-coding.service';
import * as orderService from './services/order.service';
import * as productService from './services/product.service';
import * as storageService from './services/storage.service';
import * as userService from './services/user.service';
import { getAuthErrorMessage, GetUserDocumentsResponse, IAddressInfo, IOperationResult, UploadDocumentResponse } from './shared-generated';
import { sendBusinessApprovalEmail, sendBusinessRejectionEmail } from './utils/email.service';
import { auth, db } from './utils/firebase-admin';

setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

const functionOptions: HttpsOptions = {
  maxInstances: 10,
};

// Dedicated options for geocoding functions requiring a Maps API key secret
const geocodeFunctionOptions: HttpsOptions = {
  ...functionOptions,
  // Declare the secret so Firebase injects it as process.env.MAPS_API_KEY at runtime (2nd Gen)
  // Set with: firebase functions:secrets:set MAPS_API_KEY
  // Ensure the value is a restricted server-side key with only Geocoding API enabled.
  secrets: ['MAPS_API_KEY'] as any, // cast due to typings lag for secrets in HttpsOptions
};

// Role checking utility functions
function isAdminUser(request: any): boolean {
  return request.auth && request.auth.token.admin === true;
}

function userHasRole(request: any, requiredRole: string): boolean {
  // Admins have all roles
  if (isAdminUser(request)) return true;

  // Check if user has the specific role
  if (!request.auth) return false;
  const userRoles = Array.isArray(request.auth.token.roles) ? request.auth.token.roles : [];
  return userRoles.includes(requiredRole);
}

function userHasAnyRole(request: any, requiredRoles: string[]): boolean {
  // Admins have all roles
  if (isAdminUser(request)) return true;

  // Check if user has any of the required roles
  if (!request.auth) return false;
  const userRoles = Array.isArray(request.auth.token.roles) ? request.auth.token.roles : [];
  return requiredRoles.some(role => userRoles.includes(role));
}

function requireAuthentication(request: any): boolean {
  return request.auth !== null && request.auth !== undefined;
}

// Sync utility: keep Firestore profile rolesList in sync with Auth claims (no admin flag persisted)
async function syncRolesToFirestore(userId: string, roles: string[]): Promise<void> {
  try {
    const userDocRef = db.collection('users').doc(userId);

    // Update the user document with the new roles array only (admin derived solely from custom claim)
    await userDocRef.update({
      rolesList: roles,
      updatedAt: new Date()
    });
  } catch (error) {
    // If user document doesn't exist, we'll skip the sync
    // This can happen if the user hasn't completed profile setup yet
    console.warn(`Failed to sync roles to Firestore for user ${userId}:`, error);
  }
}

// (Removed) Admin status no longer mirrored into Firestore; single source of truth is custom claim.

// 🔒 SECURITY FUNCTION: Validate that profile updates don't contain role/admin fields
function validateProfileUpdateSecurity(updates: any): { isValid: boolean; forbiddenFields: string[] } {
  const forbiddenFields = ['roles', 'rolesList', 'admin'];
  const updateKeys = Object.keys(updates || {});
  const violatingFields = updateKeys.filter(key => forbiddenFields.includes(key));

  return {
    isValid: violatingFields.length === 0,
    forbiddenFields: violatingFields
  };
}
// Product Functions
export const getProducts = onCall(async (request) => {
  return await productService.getProducts();
});

export const getProduct = onCall(async (request) => {
  const { productId } = request.data;
  return await productService.getProduct(productId);
});

export const createProduct = onCall(async (request) => {
  // Check if user is admin
  if (!isAdminUser(request)) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  const { productData } = request.data;
  return await productService.createProduct(productData);
});

export const updateProduct = onCall(async (request) => {
  // Check if user is admin
  if (!isAdminUser(request)) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  const { productId, updates } = request.data;
  return await productService.updateProduct(productId, updates);
});

export const deleteProduct = onCall(async (request) => {
  // Check if user is admin
  if (!isAdminUser(request)) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  const { productId } = request.data;
  return await productService.deleteProduct(productId);
});

// User Functions
export const getUserProfile = onCall(async (request) => {
  if (!requireAuthentication(request)) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  const { userId } = request.data;
  // Users can only access their own profile unless admin
  if (userId !== request.auth!.uid && !isAdminUser(request)) {
    return {
      success: false,
      error: 'Access denied'
    };
  }

  return await userService.getUserProfile(userId || request.auth!.uid);
});

// Example function using roles array - moderators and admins can access
export const moderateUser = onCall(async (request) => {
  if (!requireAuthentication(request)) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  // Check if user has moderator role or is admin
  if (!userHasAnyRole(request, ['moderator', 'content_moderator'])) {
    return {
      success: false,
      error: 'Moderator access required'
    };
  }

  const { userId, action } = request.data;
  // Implement moderation logic here
  return {
    success: true,
    message: `Moderation action ${action} performed on user ${userId}`,
    moderatedBy: request.auth!.uid
  };
});

export const createUserProfile = onCall(async (request) => {
  if (!request.auth) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  const { userData } = request.data;
  return await userService.createUserProfile(request.auth.uid, userData);
});

export const updateUserProfile = onCall(async (request) => {
  // Validate required authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, updates } = request.data;

  // 🔒 SECURITY CHECK: Prevent role/admin field updates through profile update
  const securityCheck = validateProfileUpdateSecurity(updates);
  if (!securityCheck.isValid) {
    throw new HttpsError('invalid-argument',
      `Forbidden fields in profile update: ${securityCheck.forbiddenFields.join(', ')}. Use role management functions instead.`);
  }

  // Users can only update their own profile unless admin
  const currentUserId = request.auth.uid;
  const targetUserId = userId || currentUserId;

  if (targetUserId !== currentUserId && !isAdminUser(request)) {
    throw new HttpsError('permission-denied', 'Insufficient permissions to update this profile');
  }

  return await userService.updateUserProfile(targetUserId, updates);
});

export const setAdminRole = onCall(async (request) => {
  // Only existing admins can set admin role
  if (!isAdminUser(request)) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  const { userId } = request.data;
  return await userService.setAdminRole(userId);
});

// Additional User Functions
export const createBusinessProfile = onCall(async (request) => {
  if (!request.auth) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  const { businessData } = request.data;
  return await userService.createBusinessProfile(request.auth.uid, businessData);
});

export const updateBusinessProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, updates } = request.data;

  // 🔒 SECURITY CHECK: Prevent role/admin field updates through business profile update
  const securityCheck = validateProfileUpdateSecurity(updates);
  if (!securityCheck.isValid) {
    throw new HttpsError('invalid-argument',
      `Forbidden fields in business profile update: ${securityCheck.forbiddenFields.join(', ')}. Use role management functions instead.`);
  }

  const targetUserId = userId || request.auth.uid;
  // Only allow updating another user's business profile if caller is admin
  if (targetUserId !== request.auth.uid && !isAdminUser(request)) {
    throw new HttpsError('permission-denied', 'Insufficient permissions to update this business profile');
  }

  return await userService.updateBusinessProfile(targetUserId, updates);
});

export const deleteUserProfile = onCall(async (request) => {
  if (!request.auth) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  const { userId } = request.data;
  const targetUserId = userId || request.auth.uid;
  if (targetUserId !== request.auth.uid && !request.auth.token.admin) {
    return {
      success: false,
      error: 'Access denied'
    };
  }

  return await userService.deleteUserProfile(targetUserId);
});

export const getUserByEmail = onCall(async (request) => {
  if (!request.auth || !request.auth.token.admin) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  const { email } = request.data;
  return await userService.getUserByEmail(email);
});

export const searchUsers = onCall(async (request) => {
  if (!request.auth || !request.auth.token.admin) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  const { query, filters } = request.data;
  return await userService.searchUsers(query, filters);
});

export const createBusinessDocument = onCall(async (request) => {
  if (!requireAuthentication(request)) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  // Only business users can create business documents
  if (!userHasRole(request, 'business_owner')) {
    return {
      success: false,
      error: 'Business owner role required'
    };
  }

  const { documentData } = request.data;
  return await userService.createBusinessDocument(request.auth!.uid, documentData);
});

// Order Functions
export const getUserOrders = onCall(async (request) => {
  if (!request.auth) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  const { userId } = request.data;
  // Users can only access their own orders unless admin
  const targetUserId = userId || request.auth.uid;
  if (targetUserId !== request.auth.uid && !request.auth.token.admin) {
    return {
      success: false,
      error: 'Access denied'
    };
  }

  return await orderService.getUserOrders(targetUserId);
});

export const getOrder = onCall(async (request) => {
  if (!request.auth) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  const { orderId, userId } = request.data;
  const targetUserId = userId || request.auth.uid;

  return await orderService.getOrder(orderId, targetUserId);
});

export const createOrder = onCall(async (request) => {
  if (!request.auth) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  const { orderData } = request.data;
  return await orderService.createOrder(request.auth.uid, orderData);
});

export const updateOrderStatus = onCall(async (request) => {
  // Only admins can update order status
  if (!isAdminUser(request)) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  const { orderId, newStatus } = request.data;
  return await orderService.updateOrderStatus(orderId, newStatus);
});

export const getAddressFromCoordinates = onCall(geocodeFunctionOptions, (request) => {
  try {
    const { lat, lng } = request.data as {
      lat: number;
      lng: number;
    };
    return geocodingService.decodeAddressByLocation(lat, lng) as Promise<
      IOperationResult<IAddressInfo | null>
    >;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to decode address by location',
    };
  }
});

export const getAddressFromQuery = onCall(geocodeFunctionOptions, (request) => {
  try {
    const { address } = request.data as { address: string };
    return geocodingService.geocodeAddress(address) as Promise<
      IOperationResult<{
        lat: number;
        lng: number;
        addressInfo: IAddressInfo;
      } | null>
    >;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to encode location by address',
    };
  }
});

export const addAdminClaimToUser = onCall(functionOptions, async (request) => {
  try {
    const { uid } = request.data as { uid: string };
    if (!uid) {
      return {
        success: false,
        error: 'UID is required',
      };
    }

    // Get current claims to preserve roles
    const user = await auth.getUser(uid);
    const currentClaims = { ...(user.customClaims || {}) };

    // Set admin claim
    await auth.setCustomUserClaims(uid, { ...currentClaims, admin: true });

    // Firestore no longer stores isAdmin flag; nothing else to do.

    return {
      success: true,
      message: `Admin claim added to user ${uid}`,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to add admin claim',
    };
  }
});

export const addAdminClaimToUsers = onCall(functionOptions, async () => {
  try {
    const adminEmails = ADMIN_USERS;
    if (!Array.isArray(adminEmails) || adminEmails.length === 0) {
      return {
        success: false,
        error: 'UIDs array is required',
      };
    }
    const results: { email: string; success: boolean; error?: string }[] = [];
    for (const email of adminEmails) {
      try {
        const user = await auth.getUserByEmail(email);
        if (!user) {
          results.push({
            email,
            success: false,
            error: 'User not found',
          });
          continue;
        }

        // Get current claims to preserve roles
        const currentClaims = { ...(user.customClaims || {}) };

        // Set admin claim while preserving existing claims
        await auth.setCustomUserClaims(user.uid, { ...currentClaims, admin: true });

        // Firestore no longer stores isAdmin flag; nothing else to do.

        results.push({ email, success: true });
      } catch (err) {
        results.push({
          email,
          success: false,
          error:
            err instanceof Error ? err.message : 'Failed to add admin claim',
        });
      }
    }
    return {
      success: true,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to add admin claims',
    };
  }
});

export const getUserClaims = onCall(functionOptions, async (request) => {
  try {
    const { userId, email } = request.data as {
      userId?: string;
      email?: string;
    };
    if (!userId && !email) {
      return {
        success: false,
        error: 'Either userId or email must be provided',
      };
    }

    let user;
    if (userId) {
      user = await auth.getUser(userId);
    } else if (email) {
      user = await auth.getUserByEmail(email);
    } else {
      user = undefined;
    }

    if (!user) {
      return {
        success: false,
        error: getAuthErrorMessage('auth/user-not-found'),
      };
    }

    return {
      success: true,
      claims: user.customClaims || {},
    };
  } catch (error) {
    // Use shared error message system for consistent Turkish messages
    const errorCode = (error as any)?.code || 'default';
    return {
      success: false,
      error: getAuthErrorMessage(errorCode, 'tr'),
    };
  }
});

// ==================================================================================
// ROLE MANAGEMENT SECURITY PRINCIPLE
// ==================================================================================
// 
// 🔒 CRITICAL SECURITY RULE: Firebase Auth Claims are the SINGLE SOURCE OF TRUTH
// 
// ✅ ALLOWED FLOW:  Firebase Auth Claims → Firestore Profile (sync)
// ❌ FORBIDDEN FLOW: Firestore Profile → Firebase Auth Claims (NEVER!)
// 
// All role changes MUST happen through these functions which:
// 1. Update Firebase Auth claims first (source of truth)
// 2. Sync to Firestore profile second (for search/admin)
// 
// Regular profile updates (updateUserProfile) should NEVER touch role claims!
// ==================================================================================

// Enhanced Role Management Functions

export const setUserRoles = onCall(functionOptions, async (request) => {
  try {
    // Only admins can set roles
    if (!isAdminUser(request)) {
      return {
        success: false,
        error: 'Admin access required'
      };
    }

    const { userId, roles } = request.data as {
      userId: string;
      roles: string[]; // ['user', 'moderator', 'business_owner', etc.]
    };

    if (!userId || !Array.isArray(roles)) {
      return {
        success: false,
        error: 'userId and roles array are required'
      };
    }

    // Get current claims to preserve admin status if it exists
    const user = await auth.getUser(userId);
    const currentClaims = { ...(user.customClaims || {}) };

    // Set the roles array, preserving admin claim
    const newClaims = {
      ...currentClaims,
      roles: roles
    };

    // Update Firebase Auth claims (source of truth for permissions)
    await auth.setCustomUserClaims(userId, newClaims);

    // Sync to Firestore profile (for search/listing)
    await syncRolesToFirestore(userId, roles);

    return {
      success: true,
      message: `Roles updated for user ${userId}`,
      roles,
      claims: newClaims
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set user roles'
    };
  }
});

export const addUserRole = onCall(functionOptions, async (request) => {
  try {
    if (!isAdminUser(request)) {
      return {
        success: false,
        error: 'Admin access required'
      };
    }

    const { userId, role } = request.data as { userId: string; role: string };

    if (!userId || !role) {
      return {
        success: false,
        error: 'userId and role are required'
      };
    }

    // Get current claims
    const user = await auth.getUser(userId);
    const currentClaims = { ...(user.customClaims || {}) };
    const currentRoles = Array.isArray(currentClaims.roles) ? currentClaims.roles : [];

    // Add role if not already present
    const updatedRoles = currentRoles.includes(role)
      ? currentRoles
      : [...currentRoles, role];

    const newClaims = {
      ...currentClaims,
      roles: updatedRoles
    };

    // Update Firebase Auth claims
    await auth.setCustomUserClaims(userId, newClaims);

    // Sync to Firestore
    await syncRolesToFirestore(userId, updatedRoles);

    return {
      success: true,
      message: `Role ${role} added to user ${userId}`,
      roles: updatedRoles
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add user role'
    };
  }
});

export const removeUserRole = onCall(functionOptions, async (request) => {
  try {
    if (!isAdminUser(request)) {
      return {
        success: false,
        error: 'Admin access required'
      };
    }

    const { userId, role } = request.data as { userId: string; role: string };

    if (!userId || !role) {
      return {
        success: false,
        error: 'userId and role are required'
      };
    }

    // Get current claims
    const user = await auth.getUser(userId);
    const currentClaims = { ...(user.customClaims || {}) };
    const currentRoles = Array.isArray(currentClaims.roles) ? currentClaims.roles : [];

    // Remove the specific role
    const updatedRoles = currentRoles.filter(r => r !== role);

    const newClaims = {
      ...currentClaims,
      roles: updatedRoles
    };

    // Update Firebase Auth claims
    await auth.setCustomUserClaims(userId, newClaims);

    // Sync to Firestore
    await syncRolesToFirestore(userId, updatedRoles);

    return {
      success: true,
      message: `Role ${role} removed from user ${userId}`,
      roles: updatedRoles
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove user role'
    };
  }
});

export const hasRole = onCall(functionOptions, async (request) => {
  try {
    const { role } = request.data as { role: string };

    if (!request.auth) {
      return {
        success: false,
        hasRole: false,
        error: 'Authentication required'
      };
    }

    // Check if user is admin (admins have all roles)
    if (request.auth.token.admin === true) {
      return {
        success: true,
        hasRole: true,
        reason: 'User is admin'
      };
    }

    // Check roles array
    const userRoles = Array.isArray(request.auth.token.roles) ? request.auth.token.roles : [];
    const hasTheRole = userRoles.includes(role);

    return {
      success: true,
      hasRole: hasTheRole,
      userRoles
    };
  } catch (error) {
    return {
      success: false,
      hasRole: false,
      error: error instanceof Error ? error.message : 'Failed to check role'
    };
  }
});

// Enhanced user search with role filtering
export const searchUsersByRole = onCall(async (request) => {
  if (!isAdminUser(request)) {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  try {
    const { role, limit = 50 } = request.data as { role: string; limit?: number };

    if (!role) {
      return {
        success: false,
        error: 'Role parameter is required'
      };
    }

    // Search users who have the specific role in their rolesList
    const usersSnapshot = await db.collection('users')
      .where('rolesList', 'array-contains', role)
      .limit(limit)
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: users,
      count: users.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search users by role'
    };
  }
});

// Get all admins
// getAdminUsers removed: admin determination now solely via custom claim; fetch by claim requires admin SDK listUsers + filter if needed.

// Get user statistics for admin dashboard
export const getUserStats = onCall(async (request) => {
  if (!isAdminUser(request)) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Get all profile documents (for non-admin metrics)
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    let activeUsers = 0;
    let adminCount = 0;
    let businessUsers = 0;
    let individualUsers = 0;
    let verifiedUsers = 0;
    let unverifiedUsers = 0;
    let recentRegistrations = 0;
    let usersFromLastMonth = 0;

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const createdAt = userData.createdAt?.toDate();
      const lastLogin = userData.lastLogin?.toDate();
      // Note: adminCount now computed from Auth custom claims below

      // Count by user type
      if (userData.userType === 'business') {
        businessUsers++;
      } else {
        individualUsers++;
      }

      // Count verified users
      if (userData.emailVerified === true) {
        verifiedUsers++;
      } else {
        unverifiedUsers++;
      }

      // Count recent registrations (last 7 days)
      if (createdAt && createdAt >= sevenDaysAgo) {
        recentRegistrations++;
      }

      // Count active users (logged in within last 30 days)
      if (lastLogin && lastLogin >= thirtyDaysAgo) {
        activeUsers++;
      }

      // Count users from last month for growth calculation
      if (createdAt && createdAt >= oneMonthAgo && createdAt < now) {
        usersFromLastMonth++;
      }
    });

    // Calculate monthly growth percentage
    const usersFromTwoMonthsAgo = totalUsers - usersFromLastMonth;
    const monthlyGrowth = usersFromTwoMonthsAgo > 0
      ? Math.round((usersFromLastMonth / usersFromTwoMonthsAgo) * 100)
      : 0;

    // Compute admin count by scanning auth users (paginated)
    async function computeAdminCount(): Promise<number> {
      let nextPageToken: string | undefined = undefined;
      let count = 0;
      do {
        const page = await auth.listUsers(1000, nextPageToken);
        page.users.forEach(u => { if (u.customClaims?.admin === true) count++; });
        nextPageToken = page.pageToken;
      } while (nextPageToken);
      return count;
    }

    adminCount = await computeAdminCount();

    const stats = {
      totalUsers,
      activeUsers,
      adminCount,
      businessUsers,
      individualUsers,
      verifiedUsers,
      unverifiedUsers,
      recentRegistrations,
      monthlyGrowth
    };

    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw new HttpsError('internal', 'Failed to fetch user statistics');
  }
});

// ===== EMAIL FUNCTIONS =====

// Send business approval email
export const sendBusinessApprovalEmailFunction = onCall(async (request) => {
  // Only admins can send approval emails
  if (!isAdminUser(request)) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { userId, businessName, ownerName } = request.data;

  if (!userId || !businessName || !ownerName) {
    throw new HttpsError('invalid-argument', 'userId, businessName, and ownerName are required');
  }

  try {
    // Get user email
    const userRecord = await auth.getUser(userId);
    if (!userRecord.email) {
      throw new HttpsError('not-found', 'User email not found');
    }

    // Send approval email
    const result = await sendBusinessApprovalEmail(userRecord.email, businessName, ownerName);

    if (result.success) {
      return {
        success: true,
        message: 'Business approval email sent successfully',
        messageId: result.messageId,
      };
    } else {
      throw new HttpsError('internal', `Failed to send email: ${result.error}`);
    }
  } catch (error: any) {
    console.error('Error sending business approval email:', error);
    throw new HttpsError('internal', error.message || 'Failed to send business approval email');
  }
});

// Send business rejection email
export const sendBusinessRejectionEmailFunction = onCall(async (request) => {
  // Only admins can send rejection emails
  if (!isAdminUser(request)) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { userId, businessName, ownerName, reason } = request.data;

  if (!userId || !businessName || !ownerName) {
    throw new HttpsError('invalid-argument', 'userId, businessName, and ownerName are required');
  }

  try {
    // Get user email
    const userRecord = await auth.getUser(userId);
    if (!userRecord.email) {
      throw new HttpsError('not-found', 'User email not found');
    }

    // Send rejection email
    const result = await sendBusinessRejectionEmail(userRecord.email, businessName, ownerName, reason);

    if (result.success) {
      return {
        success: true,
        message: 'Business rejection email sent successfully',
        messageId: result.messageId,
      };
    } else {
      throw new HttpsError('internal', `Failed to send email: ${result.error}`);
    }
  } catch (error: any) {
    console.error('Error sending business rejection email:', error);
    throw new HttpsError('internal', error.message || 'Failed to send business rejection email');
  }
});

// Combined business approval function (updates status + sends email)
export const approveBusinessAccount = onCall(async (request) => {
  // Only admins can approve business accounts
  if (!isAdminUser(request)) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { userId } = request.data;

  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId is required');
  }

  try {
    // Get user profile to extract business info
    const userProfileResult = await userService.getUserProfile(userId);
    if (!userProfileResult.success || !userProfileResult.data) {
      throw new HttpsError('not-found', 'User profile not found');
    }

    const userProfile = userProfileResult.data as any;
    const businessName = userProfile.businessInfo?.businessName || userProfile.companyName || 'İşletmeniz';
    const ownerName = userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`;

    // Update business approval status
    const businessInfo = userProfile.businessInfo || {};

    // If there were rejection fields, we need to explicitly remove them
    // Create a clean businessInfo object without rejection fields
    const { rejectedAt, rejectedBy, rejectionReason, ...cleanBusinessInfo } = businessInfo;
    const updatedBusinessInfo = {
      ...cleanBusinessInfo,
      isApproved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: request.auth!.uid,
    };

    const updateResult = await userService.updateUserProfile(userId, {
      businessInfo: updatedBusinessInfo
    } as any);

    if (!updateResult.success) {
      throw new HttpsError('internal', 'Failed to update user profile');
    }

    // Get user email for sending notification
    const userRecord = await auth.getUser(userId);
    if (userRecord.email) {
      // Send approval email (don't fail the whole operation if email fails)
      try {
        await sendBusinessApprovalEmail(userRecord.email, businessName, ownerName);
      } catch (emailError) {
        console.error('Failed to send approval email, but approval was successful:', emailError);
      }
    }

    return {
      success: true,
      message: 'Business account approved successfully',
      data: updateResult.data,
    };
  } catch (error: any) {
    console.error('Error approving business account:', error);
    throw new HttpsError('internal', error.message || 'Failed to approve business account');
  }
});

// Combined business rejection function (updates status + sends email)
export const rejectBusinessAccount = onCall(async (request) => {
  // Only admins can reject business accounts
  if (!isAdminUser(request)) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { userId, reason } = request.data;

  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId is required');
  }

  try {
    // Get user profile to extract business info
    const userProfileResult = await userService.getUserProfile(userId);
    if (!userProfileResult.success || !userProfileResult.data) {
      throw new HttpsError('not-found', 'User profile not found');
    }

    const userProfile = userProfileResult.data as any;
    const businessName = userProfile.businessInfo?.businessName || userProfile.companyName || 'İşletmeniz';
    const ownerName = userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`;

    // Update business rejection status
    const businessInfo = userProfile.businessInfo || {};

    // Create a clean businessInfo object without approval fields
    const { approvedAt, approvedBy, ...cleanBusinessInfo } = businessInfo;
    const updatedBusinessInfo = {
      ...cleanBusinessInfo,
      isApproved: false,
      rejectedAt: new Date().toISOString(),
      rejectedBy: request.auth!.uid,
      rejectionReason: reason || 'Belgeler gereksinimlerimizi karşılamıyor',
    };

    const updateResult = await userService.updateUserProfile(userId, {
      businessInfo: updatedBusinessInfo
    } as any);

    if (!updateResult.success) {
      throw new HttpsError('internal', 'Failed to update user profile');
    }

    // Get user email for sending notification
    const userRecord = await auth.getUser(userId);
    if (userRecord.email) {
      // Send rejection email (don't fail the whole operation if email fails)
      try {
        await sendBusinessRejectionEmail(userRecord.email, businessName, ownerName, reason);
      } catch (emailError) {
        console.error('Failed to send rejection email, but rejection was successful:', emailError);
      }
    }

    return {
      success: true,
      message: 'Business account rejected successfully',
      data: updateResult.data,
    };
  } catch (error: any) {
    console.error('Error rejecting business account:', error);
    throw new HttpsError('internal', error.message || 'Failed to reject business account');
  }
});

// ===== DOCUMENT MANAGEMENT FUNCTIONS =====

/**
 * Get user documents from Firebase Storage
 * Only admins can fetch documents for any user, regular users can only fetch their own
 */
export const getUserDocuments = onCall(async (request): Promise<GetUserDocumentsResponse> => {
  try {
    // Require authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { userId } = request.data as { userId?: string };
    const targetUserId = userId || request.auth.uid;

    // Users can only access their own documents unless they're admin
    if (targetUserId !== request.auth.uid && !isAdminUser(request)) {
      throw new HttpsError('permission-denied', 'Insufficient permissions to access these documents');
    }

    // Fetch documents using the storage service
    const documents = await storageService.getUserDocuments(targetUserId);

    return {
      success: true,
      data: documents
    };
  } catch (error: any) {
    console.error('Error fetching user documents:', error);

    // If it's already an HttpsError, re-throw it
    if (error instanceof HttpsError) {
      throw error;
    }

    // Otherwise, wrap in a generic internal error
    return {
      success: false,
      error: error.message || 'Failed to fetch user documents'
    };
  }
});

/**
 * Upload a document to Firebase Storage
 * Users can upload their own documents, admins can upload for any user
 */
export const uploadUserDocument = onCall(async (request): Promise<UploadDocumentResponse> => {
  try {
    // Require authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { userId, fileName, category, fileData, metadata } = request.data;

    // Validate required fields
    if (!userId || !fileName || !category || !fileData) {
      throw new HttpsError('invalid-argument', 'Missing required fields: userId, fileName, category, fileData');
    }

    // Check permissions: users can upload their own documents, admins can upload for anyone
    const currentUserId = request.auth.uid;
    const isAdmin = isAdminUser(request);

    if (!isAdmin && currentUserId !== userId) {
      throw new HttpsError('permission-denied', 'Users can only upload their own documents');
    }

    // Upload document using storage service
    const uploadedDocument = await storageService.uploadUserDocument(userId, fileName, category, fileData, metadata);

    return {
      success: true,
      data: uploadedDocument
    };
  } catch (error: any) {
    console.error('Error uploading user document:', error);

    // If it's already an HttpsError, re-throw it
    if (error instanceof HttpsError) {
      throw error;
    }

    // Otherwise, wrap in a generic internal error
    return {
      success: false,
      error: error.message || 'Failed to upload document'
    };
  }
});

// ===== TEST EMAIL FUNCTION =====

/**
 * Test email functionality - Only for admins
 * Use this to test if email configuration is working
 */
export const testEmailFunction = onCall(async (request) => {
  // Only admins can test email
  if (!isAdminUser(request)) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const { testEmail } = request.data;
  const targetEmail = testEmail || 'gltknky@gmail.com'; // Default to your email for testing

  try {
    // Import the sendEmail function
    const { sendEmail } = await import('./utils/email.service');

    // Send a test email
    const result = await sendEmail({
      to: targetEmail,
      subject: '🧪 Test Email - ElektroExpert Functions',
      html: `
        <h2>Test Email Successful! 🎉</h2>
        <p>This is a test email from ElektroExpert Firebase Functions.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Function:</strong> testEmailFunction</p>
        <p><strong>Status:</strong> Email configuration is working correctly!</p>
      `,
      text: `
        Test Email Successful!
        
        This is a test email from ElektroExpert Firebase Functions.
        Timestamp: ${new Date().toISOString()}
        Function: testEmailFunction
        Status: Email configuration is working correctly!
      `,
    });

    if (result.success) {
      return {
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
        sentTo: targetEmail
      };
    } else {
      return {
        success: false,
        error: result.error,
        sentTo: targetEmail
      };
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send test email',
      sentTo: targetEmail
    };
  }
});

