/**
 * Consolidated shared types exports
 * This file ensures all types are properly accessible
 */

// Re-export all types for easier importing
export type * from './auth-types';
export type * from './business-types';
export type * from './common-types';
export type * from './content-types';
export type * from './map-types';
export type * from './order-types';
export type * from './storage-types';
export type * from './user-types';

// Ensure specific interfaces are available for easy access
export type {
  IAuthService, IBusinessRegisterData, IFirebaseUser, ILoginData, IRegisterData
} from './auth-types';

export type {
  IBusiness
} from './business-types';

export type {
  IAddress,
  ICoordinates
} from './map-types';

export type {
  IEntity, IOperationResult
} from './common-types';
