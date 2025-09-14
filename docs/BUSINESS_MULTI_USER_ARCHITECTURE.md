# Business Multi-User Architecture Implementation Guide

## Overview

This guide outlines the implementation strategy for separating business entities from user accounts while maintaining the constraint that each business user can only be linked to one business at a time.

## Current vs. Proposed Architecture

### Current State

- Single user per business model
- Business information stored as `businessInfo` property within user document
- Personal and business data mixed together
- No support for multiple employees/roles per business

### Proposed State

- Separate `businesses` and `users` collections
- Many-to-one relationship (multiple users per business, one business per user)
- Clear data separation between personal and business information
- Role-based access control within businesses

## Core Principles

1. **One Business Per User**: Each user can only be linked to one business at a time
2. **Multiple Users Per Business**: Each business can have multiple team members
3. **Role-Based Access**: Different roles with specific permissions
4. **Clean Data Separation**: Business data separate from personal user data

## Database Schema Design

### 1. Business Entity (New Collection: `businesses`)

```typescript
interface IBusiness {
  id: string // Firestore document ID

  // Basic Business Information
  companyName: string
  taxNumber: string
  taxNumberType: TaxNumberType
  identityNumber?: string // For individual business owners
  taxOffice: string

  // Contact & Location
  address: IBusinessAddress
  phone: string
  email: string // Business primary email
  website?: string

  // Business Details
  industry: string
  companySize: CompanySize
  mainCategoryId: string
  subCategoryIds: string[]
  description?: string

  // Verification & Compliance
  verificationStatus: BusinessVerificationStatus
  documents: IBusinessDocument[]
  isApproved: boolean
  approvedAt?: Timestamp
  approvedBy?: string // Admin user ID
  rejectedAt?: Timestamp
  rejectedBy?: string
  rejectionReason?: string

  // Ownership
  ownerId: string // Reference to user who owns the business

  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  isActive: boolean
}
```

### 2. Enhanced User Entity (Modified Collection: `users`)

```typescript
interface IAppUser {
  id: string // Firestore document ID (Firebase Auth UID)

  // Personal Information
  email: string
  firstName: string
  lastName: string
  displayName: string
  photoURL?: string
  phone?: string
  personalAddress?: IAddress // Personal/home address

  // Account Details
  accountType: AccountType // INDIVIDUAL | BUSINESS
  isEmailVerified: boolean
  preferences: IUserPreferences

  // Business Association (One-to-One Constraint)
  businessId?: string // Reference to business (null for individual users)
  businessRole?: BusinessUserRole // OWNER | MANAGER | TECHNICIAN | SUPPORT
  businessPermissions?: string[] // Granular permissions array
  joinedBusinessAt?: Timestamp

  // Status
  isActive: boolean
  lastLoginAt?: Timestamp

  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 3. Business Invitations Subcollection (`businesses/{businessId}/invitations`)

```typescript
interface IBusinessInvitation {
  id: string // Auto-generated invitation ID

  // Invitation Details
  invitedEmail: string
  invitedRole: BusinessUserRole
  invitedBy: string // User ID of who sent invitation (OWNER or ADMIN only)

  // Invitation Content
  message?: string // Optional personal message
  token: string // Secure invitation token for acceptance

  // Status & Workflow
  status: 'pending' | 'accepted' | 'declined' | 'expired'

  // Approval Process (for non-owner invitations)
  requiresApproval: boolean // True if invited by non-owner
  approvedBy?: string // Admin user ID who approved (if applicable)
  approvedAt?: Timestamp // When invitation was approved

  // Timestamps
  createdAt: Timestamp
  expiresAt: Timestamp // Invitations expire after 7 days
  respondedAt?: Timestamp // When user accepted/declined
}
```

**Path Structure:**

- Collection: `/businesses/{businessId}/invitations/{invitationId}`
- Parent: Business document
- Access: Restricted to business members and admins

### 4. Business User Roles & Permissions

```typescript
enum BusinessUserRole {
  OWNER = 'owner', // Full business control, can invite/approve all users
  MANAGER = 'manager', // Operations management, can invite technicians/support (with approval)
  TECHNICIAN = 'technician', // Service delivery, cannot invite users
  SUPPORT = 'support', // Customer service, cannot invite users
}

interface IBusinessPermissions {
  // Business Management
  canEditBusinessInfo: boolean
  canDeleteBusiness: boolean
  canManageDocuments: boolean

  // User Management & Invitations
  canInviteUsers: boolean // OWNER: all roles, MANAGER: limited roles
  canApproveInvitations: boolean // OWNER and ADMIN only
  canRemoveUsers: boolean // OWNER only (except other owners)
  canChangeUserRoles: boolean // OWNER only

  // Invitation Restrictions
  canInviteOwners: boolean // ADMIN only
  canInviteManagers: boolean // OWNER and ADMIN only
  canInviteTechnicians: boolean // OWNER, ADMIN, and MANAGER
  canInviteSupport: boolean // OWNER, ADMIN, and MANAGER

  // Operations
  canViewOrders: boolean
  canManageOrders: boolean
  canViewAnalytics: boolean
  canManageInventory: boolean

  // Financial
  canViewFinancials: boolean
  canManagePayments: boolean
}

// Permission Matrix
const ROLE_PERMISSIONS: Record<BusinessUserRole, IBusinessPermissions> = {
  [BusinessUserRole.OWNER]: {
    canInviteUsers: true,
    canApproveInvitations: true,
    canRemoveUsers: true,
    canChangeUserRoles: true,
    canInviteOwners: false, // Only admins can create owners
    canInviteManagers: true,
    canInviteTechnicians: true,
    canInviteSupport: true,
    // ... all other permissions: true
  },
  [BusinessUserRole.MANAGER]: {
    canInviteUsers: true, // Limited to technicians/support
    canApproveInvitations: false, // Requires owner approval
    canRemoveUsers: false,
    canChangeUserRoles: false,
    canInviteOwners: false,
    canInviteManagers: false,
    canInviteTechnicians: true, // Requires approval
    canInviteSupport: true, // Requires approval
    // ... limited operational permissions
  },
  [BusinessUserRole.TECHNICIAN]: {
    canInviteUsers: false,
    canApproveInvitations: false,
    // ... service-focused permissions only
  },
  [BusinessUserRole.SUPPORT]: {
    canInviteUsers: false,
    canApproveInvitations: false,
    // ... customer service permissions only
  },
}
```

## Implementation Phases

### Phase 1: Database Schema Migration

#### 1.1 Create Migration Functions

```typescript
// functions/src/migrations/business-migration.ts
interface MigrationResult {
  migratedBusinesses: number
  migratedUsers: number
  errors: MigrationError[]
}

async function migrateBusinessData(): Promise<MigrationResult>
async function validateMigration(): Promise<ValidationResult>
async function rollbackMigration(): Promise<RollbackResult>
```

#### 1.2 Migration Steps

1. **Backup Current Data**
   - Export all user documents with business data
   - Store backup in Cloud Storage with timestamp

2. **Create Business Documents**
   - Extract `businessInfo` from existing business users
   - Create new documents in `businesses` collection
   - Maintain original user ID as `ownerId`

3. **Update User Documents**
   - Remove `businessInfo` property
   - Add `businessId` reference
   - Set `businessRole` to `OWNER` for migrated users
   - Update `accountType` consistency

4. **Validation & Cleanup**
   - Verify all business data migrated correctly
   - Ensure referential integrity
   - Remove orphaned data

### Phase 2: Core Service Updates

#### 2.1 Business Service (New)

```typescript
// web/src/services/BusinessService.ts
class BusinessService {
  // CRUD Operations
  async createBusiness(
    data: IBusinessCreateData
  ): Promise<IOperationResult<IBusiness>>
  async getBusiness(businessId: string): Promise<IOperationResult<IBusiness>>
  async updateBusiness(
    businessId: string,
    updates: Partial<IBusiness>
  ): Promise<IOperationResult<IBusiness>>
  async deleteBusiness(businessId: string): Promise<IOperationResult<void>>

  // User Management & Invitations
  async getBusinessUsers(
    businessId: string
  ): Promise<IOperationResult<IAppUser[]>>
  async removeUser(
    businessId: string,
    userId: string
  ): Promise<IOperationResult<void>>
  async updateUserRole(
    businessId: string,
    userId: string,
    role: BusinessUserRole
  ): Promise<IOperationResult<void>>

  // Invitation Management (Subcollection)
  async inviteUser(
    businessId: string,
    email: string,
    role: BusinessUserRole,
    message?: string
  ): Promise<IOperationResult<IBusinessInvitation>>
  async getBusinessInvitations(
    businessId: string
  ): Promise<IOperationResult<IBusinessInvitation[]>>
  async approveInvitation(
    businessId: string,
    invitationId: string
  ): Promise<IOperationResult<void>>
  async declineInvitation(
    businessId: string,
    invitationId: string
  ): Promise<IOperationResult<void>>
  async revokeInvitation(
    businessId: string,
    invitationId: string
  ): Promise<IOperationResult<void>>

  // Permission Helpers
  async canUserInviteRole(
    businessId: string,
    userId: string,
    targetRole: BusinessUserRole
  ): Promise<boolean>
  async requiresApproval(
    businessId: string,
    invitedBy: string,
    targetRole: BusinessUserRole
  ): Promise<boolean>

  // Verification
  async submitForVerification(
    businessId: string
  ): Promise<IOperationResult<void>>
  async uploadDocument(
    businessId: string,
    document: IBusinessDocument
  ): Promise<IOperationResult<void>>
}
```

#### 2.2 Updated User Service

```typescript
// web/src/services/auth/UserService.ts - Updated methods
class UserService {
  // New business-aware methods
  async getUserWithBusiness(
    userId: string
  ): Promise<IOperationResult<IUserWithBusiness>>
  async leaveBusiness(userId: string): Promise<IOperationResult<void>>
  async acceptBusinessInvitation(
    userId: string,
    invitationToken: string
  ): Promise<IOperationResult<void>>

  // Updated existing methods
  async update(
    userId: string,
    data: Partial<IAppUser>
  ): Promise<IOperationResult<IAppUser>>
}
```

### Phase 3: Authentication & Context Updates

#### 3.1 Enhanced Auth Context

```typescript
// web/src/contexts/AuthContext.tsx - Updated interface
interface IAuthContextType {
  // Existing properties
  fireUser: IFirebaseUser | null
  appUser: IAppUser | null
  isLoading: boolean

  // New business properties
  currentBusiness: IBusiness | null
  isBusinessLoading: boolean
  businessRole: BusinessUserRole | null
  businessPermissions: IBusinessPermissions | null

  // Business operations
  leaveBusiness: () => Promise<void>
  refreshBusiness: () => Promise<void>

  // Permission helpers
  hasBusinessPermission: (permission: keyof IBusinessPermissions) => boolean
  canManageUsers: () => boolean
  canEditBusiness: () => boolean
}
```

#### 3.2 Role-Based Route Guards

```typescript
// web/src/components/guards/BusinessGuard.tsx
interface BusinessGuardProps {
  requiredRole?: BusinessUserRole
  requiredPermission?: keyof IBusinessPermissions
  fallbackComponent?: React.ComponentType
  children: React.ReactNode
}

const BusinessGuard: React.FC<BusinessGuardProps>
```

### Phase 4: UI Component Updates

#### 4.1 Registration Flow Updates

```typescript
// web/src/components/BusinessRegisterForm.tsx
// Updated to create both user and business entities
interface BusinessRegistrationData {
  // User data
  firstName: string
  lastName: string
  email: string
  password: string

  // Business data
  companyName: string
  taxNumber: string
  taxOffice: string
  address: IBusinessAddress
  // ... other business fields
}
```

#### 4.2 Business Management Dashboard

```typescript
// web/src/components/business/BusinessDashboard.tsx
interface BusinessDashboardProps {
  business: IBusiness
  currentUser: IAppUser
  userRole: BusinessUserRole
}

// web/src/components/business/UserManagement.tsx
interface UserManagementProps {
  business: IBusiness
  users: IAppUser[]
  canManageUsers: boolean
}
```

#### 4.3 User Profile Updates

```typescript
// web/src/components/UserProfile.tsx
// Separate business and personal information sections
interface UserProfileData {
  personal: IPersonalInfo
  business?: IBusinessInfo // Only shown if user is part of a business
}
```

### Phase 5: Business Invitation System

#### 5.1 Invitation Flow with Approval Process

```typescript
// Invitation Creation (OWNER or qualified roles only)
async function inviteUserToBusiness(
  businessId: string,
  email: string,
  role: BusinessUserRole,
  invitedBy: string,
  message?: string
): Promise<IOperationResult<IBusinessInvitation>> {
  // 1. Validate inviter permissions
  const canInvite = await validateInvitePermissions(businessId, invitedBy, role)
  if (!canInvite) {
    return {
      success: false,
      error: 'Insufficient permissions to invite this role',
    }
  }

  // 2. Determine if approval is required
  const requiresApproval = await determineApprovalRequirement(
    businessId,
    invitedBy,
    role
  )

  // 3. Create invitation in subcollection
  const invitationData = {
    invitedEmail: email,
    invitedRole: role,
    invitedBy,
    message,
    requiresApproval,
    status: requiresApproval ? 'pending_approval' : 'pending',
    token: generateSecureToken(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  }

  // 4. Save to businesses/{businessId}/invitations
  const invitation = await createInvitationDocument(businessId, invitationData)

  // 5. Send notification (email only if approved or owner invitation)
  if (!requiresApproval) {
    await sendInvitationEmail(invitation)
  } else {
    await notifyOwnersForApproval(businessId, invitation)
  }

  return { success: true, data: invitation }
}

// Invitation Approval (OWNER or ADMIN only)
async function approveInvitation(
  businessId: string,
  invitationId: string,
  approvedBy: string
): Promise<IOperationResult<void>> {
  // 1. Validate approver permissions (must be OWNER or ADMIN)
  const canApprove = await validateApprovalPermissions(businessId, approvedBy)
  if (!canApprove) {
    return {
      success: false,
      error: 'Only business owners or admins can approve invitations',
    }
  }

  // 2. Update invitation status
  await updateInvitationStatus(businessId, invitationId, {
    status: 'pending',
    approvedBy,
    approvedAt: new Date(),
  })

  // 3. Send invitation email to user
  const invitation = await getInvitation(businessId, invitationId)
  await sendInvitationEmail(invitation)

  return { success: true }
}

// Invitation Acceptance
async function acceptInvitation(
  token: string
): Promise<IOperationResult<void>> {
  // 1. Find invitation by token across all businesses
  const invitation = await findInvitationByToken(token)
  if (!invitation || invitation.status !== 'pending') {
    return { success: false, error: 'Invalid or expired invitation' }
  }

  // 2. Update user's business association
  await updateUserBusinessAssociation(invitation.invitedEmail, {
    businessId: invitation.businessId,
    businessRole: invitation.invitedRole,
    joinedBusinessAt: new Date(),
    invitedBy: invitation.invitedBy,
  })

  // 3. Mark invitation as accepted
  await updateInvitationStatus(invitation.businessId, invitation.id, {
    status: 'accepted',
    respondedAt: new Date(),
  })

  return { success: true }
}

// Permission Validation Helpers
async function validateInvitePermissions(
  businessId: string,
  userId: string,
  targetRole: BusinessUserRole
): Promise<boolean> {
  const user = await getUserBusinessRole(businessId, userId)
  const userPermissions = ROLE_PERMISSIONS[user.role]

  switch (targetRole) {
    case BusinessUserRole.OWNER:
      return user.isAdmin // Only system admins can create owners
    case BusinessUserRole.MANAGER:
      return userPermissions.canInviteManagers
    case BusinessUserRole.TECHNICIAN:
      return userPermissions.canInviteTechnicians
    case BusinessUserRole.SUPPORT:
      return userPermissions.canInviteSupport
    default:
      return false
  }
}

async function determineApprovalRequirement(
  businessId: string,
  invitedBy: string,
  targetRole: BusinessUserRole
): Promise<boolean> {
  const inviter = await getUserBusinessRole(businessId, invitedBy)

  // Owners and Admins don't need approval
  if (inviter.role === BusinessUserRole.OWNER || inviter.isAdmin) {
    return false
  }

  // All other roles need owner approval
  return true
}
```

#### 5.2 Email Templates & Notifications

- **Direct Invitation Email**: Sent immediately for owner/admin invitations
- **Approval Request**: Notifies owners when manager creates invitation
- **Approved Invitation Email**: Sent after owner approves invitation
- **Role Change Notification**: Sent when user role is modified
- **Business Removal Notification**: Sent when user is removed from business

### Phase 6: Admin Panel Updates

#### 6.1 Enhanced Business Management

```typescript
// web/src/pages/admin/businesses.tsx
interface AdminBusinessManagement {
  businesses: IBusiness[]
  users: IAppUser[]

  // Business operations
  approveBusiness: (businessId: string) => Promise<void>
  rejectBusiness: (businessId: string, reason: string) => Promise<void>

  // User operations
  removeUserFromBusiness: (userId: string) => Promise<void>
  transferBusinessOwnership: (
    businessId: string,
    newOwnerId: string
  ) => Promise<void>

  // Invitation management (admin oversight)
  viewAllPendingInvitations: () => Promise<IBusinessInvitation[]>
  approveInvitation: (businessId: string, invitationId: string) => Promise<void>
  revokeInvitation: (businessId: string, invitationId: string) => Promise<void>

  // Owner creation (admin only)
  createBusinessOwner: (businessId: string, email: string) => Promise<void>
}

// Admin-specific invitation functions
async function adminCreateBusinessOwner(
  businessId: string,
  email: string,
  adminUserId: string
): Promise<IOperationResult<void>> {
  // Only system admins can create business owners
  if (!(await isSystemAdmin(adminUserId))) {
    return {
      success: false,
      error: 'Only system administrators can create business owners',
    }
  }

  // Create special owner invitation
  const invitation = await createInvitation(businessId, {
    invitedEmail: email,
    invitedRole: BusinessUserRole.OWNER,
    invitedBy: adminUserId,
    requiresApproval: false, // Admin invitations are pre-approved
    status: 'pending',
  })

  await sendInvitationEmail(invitation)
  return { success: true }
}
```

## Data Validation & Constraints

### 1. One Business Per User Constraint

```typescript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Prevent user from being assigned to multiple businesses
    match /users/{userId} {
      allow update: if
        request.auth != null &&
        request.auth.uid == userId &&
        // Validate business constraint
        validateSingleBusinessConstraint(resource.data, request.resource.data);
    }
  }
}

function validateSingleBusinessConstraint(currentData, newData) {
  // If user already has a business, they cannot join another
  return currentData.businessId == null || newData.businessId == currentData.businessId;
}
```

### 2. Business Ownership Transfer

```typescript
// Only allow ownership transfer through specific admin function
async function transferBusinessOwnership(
  businessId: string,
  currentOwnerId: string,
  newOwnerId: string
): Promise<IOperationResult<void>> {
  // 1. Validate new owner exists and is part of business
  // 2. Update business.ownerId
  // 3. Update new owner's role to OWNER
  // 4. Update previous owner's role to MANAGER
  // 5. Log ownership transfer event
}
```

## Security Considerations

### 1. Permission Validation

- Server-side permission checks in Firebase Functions
- Client-side permission guards for UI
- Role-based Firestore security rules

### 2. Data Access Control

```typescript
// Firebase Security Rules for Business Invitations Subcollection
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Business Invitations Subcollection Rules
    match /businesses/{businessId}/invitations/{invitationId} {
      // Read: Business members and system admins
      allow read: if
        request.auth != null &&
        (isBusinessMember(request.auth.uid, businessId) ||
         isSystemAdmin(request.auth.uid));

      // Create: Only OWNER, MANAGER (with restrictions), or ADMIN
      allow create: if
        request.auth != null &&
        canCreateInvitation(request.auth.uid, businessId, request.resource.data);

      // Update: Only for approval/status changes by authorized users
      allow update: if
        request.auth != null &&
        canUpdateInvitation(request.auth.uid, businessId, resource.data, request.resource.data);

      // Delete: Only invitation creator or business owner/admin
      allow delete: if
        request.auth != null &&
        (resource.data.invitedBy == request.auth.uid ||
         isBusinessOwner(request.auth.uid, businessId) ||
         isSystemAdmin(request.auth.uid));
    }

    // Business document rules
    match /businesses/{businessId} {
      allow read, write: if
        request.auth != null &&
        (isBusinessMember(request.auth.uid, businessId) ||
         isSystemAdmin(request.auth.uid));
    }
  }
}

// Helper functions for invitation permissions
function canCreateInvitation(userId, businessId, invitationData) {
  let userRole = getUserBusinessRole(userId, businessId);
  let targetRole = invitationData.invitedRole;

  return userRole == 'owner' ||
         isSystemAdmin(userId) ||
         (userRole == 'manager' &&
          (targetRole == 'technician' || targetRole == 'support'));
}

function canUpdateInvitation(userId, businessId, currentData, newData) {
  // Only allow status updates for approval/acceptance
  let allowedUpdates = ['status', 'approvedBy', 'approvedAt', 'respondedAt'];
  let userRole = getUserBusinessRole(userId, businessId);

  // Owner/Admin can approve invitations
  if (newData.status == 'pending' && currentData.status == 'pending_approval') {
    return userRole == 'owner' || isSystemAdmin(userId);
  }

  // Users can accept/decline their own invitations (handled by token validation)
  return false; // Most updates should go through service functions
}

function isBusinessMember(userId, businessId) {
  return exists(/databases/$(database)/documents/users/$(userId)) &&
    get(/databases/$(database)/documents/users/$(userId)).data.businessId == businessId;
}

function isBusinessOwner(userId, businessId) {
  return exists(/databases/$(database)/documents/businesses/$(businessId)) &&
    get(/databases/$(database)/documents/businesses/$(businessId)).data.ownerId == userId;
}

function getUserBusinessRole(userId, businessId) {
  return get(/databases/$(database)/documents/users/$(userId)).data.businessRole;
}

function isSystemAdmin(userId) {
  return request.auth.token.admin == true;
}
```

### 3. Business Data Isolation

- Each business's data is completely isolated
- Users can only access their associated business data
- Admin users have cross-business access for management

## Migration Timeline & Rollback Strategy

### Timeline (Estimated)

- **Week 1-2**: Database schema design and migration scripts
- **Week 3-4**: Core service implementation and testing
- **Week 5-6**: UI updates and integration
- **Week 7**: Business invitation system
- **Week 8**: Admin panel updates and final testing

### Rollback Strategy

1. **Data Backup**: Complete backup before migration
2. **Rollback Scripts**: Automated scripts to restore original structure
3. **Feature Flags**: Gradual rollout with ability to revert
4. **Monitoring**: Real-time monitoring during migration

## Testing Strategy

### 1. Data Migration Testing

- Test with sample business data
- Validate data integrity before and after migration
- Performance testing with large datasets

### 2. Business Logic Testing

- Unit tests for business service methods
- Integration tests for user-business relationships
- End-to-end tests for invitation flow

### 3. Security Testing

- Permission validation testing
- Data access control verification
- Cross-business data isolation testing

## Key Benefits

### Simplified Architecture

- One business per user eliminates complexity
- Clear ownership model
- Easier permission management
- Simpler UI/UX flow

### Business-Friendly Features

- Team collaboration
- Role-based access control
- Professional business management
- Easy onboarding for team members

### Scalability

- Businesses can grow their teams
- Clear separation of concerns
- Maintainable codebase
- Future-proof design

## Implementation Priority

### High Priority

1. Update user schema with business references
2. Create business entity structure
3. Implement basic team invitation

### Medium Priority

1. Role-based permission system
2. Advanced team management
3. Business switching UI

### Low Priority

1. Advanced invitation features
2. Team analytics
3. Business reporting

## Conclusion

This architecture provides:

- ✅ Clear separation of business and personal data
- ✅ Multi-user business support with role-based access
- ✅ One business per user constraint (eliminates complexity)
- ✅ Scalable permission system
- ✅ Maintainable code structure
- ✅ Secure data access patterns
- ✅ Professional team collaboration features
- ✅ Future-proof design for business growth

The implementation should be done incrementally with thorough testing at each phase to ensure data integrity and system stability. The one-business-per-user constraint simplifies the architecture significantly while still providing all the necessary multi-user collaboration features that businesses need.
