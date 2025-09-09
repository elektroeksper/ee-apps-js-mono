/**
 * Firebase Authentication Service
 * Handles all Firebase Auth operations with proper error handling
 */

import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  User as FirebaseUser,
  getIdToken,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';

import { auth } from '@/config/firebase';
import {
  AuthErrorCode,
  getAuthErrorMessage,
  IAuthService,
  IBusinessRegisterData,
  IFirebaseUser,
  ILoginData,
  IOperationResult,
  IPasswordChangeData,
  IRegisterData,
} from '@/shared-generated';

export class AuthService implements IAuthService {
  /**
   * Map Firebase User to IFirebaseUser interface
   */
  private mapFirebaseUser(user: FirebaseUser): IFirebaseUser {
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      providerId: user.providerId,
      disabled: false, // Firebase User doesn't have disabled field in client
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
      },
      customClaims: {}, // Claims are fetched separately via getIdTokenResult
    };
  }

  /**
   * Sign in user with email and password
   */
  async login(data: ILoginData): Promise<IOperationResult<IFirebaseUser>> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      return {
        success: true,
        data: this.mapFirebaseUser(userCredential.user),
        code: 200,
      };
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Register new user with email and password
   * Supports both individual and business registration
   */
  async register(data: IRegisterData | IBusinessRegisterData): Promise<IOperationResult<IFirebaseUser>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Send email verification
      await sendEmailVerification(userCredential.user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      });

      return {
        success: true,
        data: this.mapFirebaseUser(userCredential.user),
        code: 201,
      };
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<IOperationResult<void>> {
    try {
      await signOut(auth);
      return {
        success: true,
        code: 200,
      };
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Google
   */
  async loginWithGoogle(): Promise<IOperationResult<IFirebaseUser>> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const userCredential = await signInWithPopup(auth, provider);

      return {
        success: true,
        data: this.mapFirebaseUser(userCredential.user),
        code: 200,
      };
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Register with Google (same as login but different context)
   */
  async registerWithGoogle(): Promise<IOperationResult<IFirebaseUser>> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const userCredential = await signInWithPopup(auth, provider);

      return {
        success: true,
        data: this.mapFirebaseUser(userCredential.user),
        code: 201,
      };
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<IOperationResult<void>> {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      return {
        success: true,
        code: 200,
      };
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Change user password (requires current password)
   */
  async changePassword(data: IPasswordChangeData): Promise<IOperationResult<void>> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return {
          success: false,
          error: 'Kimlik doğrulanmış kullanıcı bulunamadı',
          code: 401,
        };
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update to new password
      await updatePassword(user, data.newPassword);

      return {
        success: true,
        code: 200,
      };
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Send email verification to current user
   */
  async sendEmailVerification(): Promise<IOperationResult<void>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: 'Kimlik doğrulanmış kullanıcı bulunamadı',
          code: 401,
        };
      }

      await sendEmailVerification(user, {
        url: `${window.location.origin}/action`,
        handleCodeInApp: false,
      });

      return {
        success: true,
        code: 200,
      };
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Delete current user account
   */
  async deleteAccount(): Promise<IOperationResult<void>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: 'Kimlik doğrulanmış kullanıcı bulunamadı',
          code: 401,
        };
      }

      await deleteUser(user);

      return {
        success: true,
        code: 200,
      };
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: IFirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): IFirebaseUser | null {
    const user = auth.currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  /**
   * Get user ID token
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      // Optionally reload user to ensure latest token/claims
      await user.reload();

      return await getIdToken(user, forceRefresh);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Refresh user token
   */
  async refreshToken(): Promise<string | null> {
    return this.getIdToken(true);
  }

  /**
   * Check if user email is verified
   */
  isEmailVerified(): boolean {
    return auth.currentUser?.emailVerified ?? false;
  }

  /**
   * Get user claims (roles, permissions)
   */
  async getUserClaims(): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) return {};

      const idTokenResult = await user.getIdTokenResult();
      return idTokenResult.claims;
    } catch (error) {
      console.error('Error getting user claims:', error);
      return {};
    }
  }

  /**
   * Handle Firebase Auth errors and convert to standardized format
   */
  private handleAuthError(error: any): IOperationResult<never> {
    console.error('Auth Error:', error);

    // Use our centralized error message mapping
    const userFriendlyMessage = getAuthErrorMessage(error.code || error.message || 'default');

    // Determine error code based on Firebase auth error type
    let errorCode = 500;

    switch (error.code) {
      case AuthErrorCode.EMAIL_ALREADY_IN_USE:
        errorCode = 409;
        break;
      case AuthErrorCode.INVALID_EMAIL:
        errorCode = 400;
        break;
      case AuthErrorCode.WEAK_PASSWORD:
        errorCode = 400;
        break;
      case AuthErrorCode.USER_DISABLED:
        errorCode = 403;
        break;
      case AuthErrorCode.USER_NOT_FOUND:
        errorCode = 404;
        break;
      case AuthErrorCode.WRONG_PASSWORD:
        errorCode = 401;
        break;
      case AuthErrorCode.TOO_MANY_REQUESTS:
        errorCode = 429;
        break;
      case AuthErrorCode.NETWORK_REQUEST_FAILED:
        errorCode = 503;
        break;
      case 'auth/popup-closed-by-user':
      case 'auth/popup-blocked':
        errorCode = 400;
        break;
      default:
        errorCode = 500;
        break;
    }

    return {
      success: false,
      error: userFriendlyMessage,
      details: error.code,
      code: errorCode,
    };
  }
}

export const authService = new AuthService();
