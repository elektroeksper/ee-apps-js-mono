/**
 * Authentication Services
 * Central export for all auth-related services
 */

export { AuthService, authService } from './AuthService';
export { UserService, userService } from './UserService';

// Re-export types for convenience
export type {
    AccountType, AuthErrorCode, AuthRole,
    DocumentType, IAppUser, IAuthService, IBusinessProfile, IBusinessRegisterData, ILoginData, IOperationResult, IPasswordChangeData, IRegisterData, IUserService
} from '@/shared-generated';

