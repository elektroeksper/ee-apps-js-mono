'use client'

import { UserService } from '@/services/auth/UserService';
import { AccountType, AuthRole, getAuthErrorMessage, IAppUser } from '@/shared-generated';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseUserDocState {
  appUser: IAppUser | null;
  isUserLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (data: Partial<IAppUser>) => Promise<IAppUser | null>;
  clearError: () => void;
}

export function useUserDoc(uid: string | null): UseUserDocState {
  const [appUser, setAppUser] = useState<IAppUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef<UserService | undefined>(undefined);
  if (!serviceRef.current) serviceRef.current = new UserService();

  const load = useCallback(async () => {
    if (!uid) {
      setAppUser(null);
      return;
    }
    setIsUserLoading(true);
    try {
      const result = await serviceRef.current!.getById(uid);
      if (result.success && result.data) {
        let userData = result.data;

        // Check if we need to sync email verification status with Firebase Auth
        const { auth } = await import('@/config/firebase');
        const currentFirebaseUser = auth.currentUser;

        if (currentFirebaseUser && currentFirebaseUser.uid === uid) {
          // If Firebase user is verified but Firestore document isn't, update it
          if (currentFirebaseUser.emailVerified && !userData.isEmailVerified) {
            console.log('🔄 Syncing email verification status with Firestore');
            try {
              const { doc, updateDoc } = await import('firebase/firestore');
              const { db } = await import('@/config/firebase');

              await updateDoc(doc(db, 'users', uid), {
                isEmailVerified: true,
                updatedAt: new Date()
              });

              // Update local data
              userData = { ...userData, isEmailVerified: true };
              console.log('✅ Synced email verification status');
            } catch (syncError) {
              console.error('⚠️ Failed to sync email verification status:', syncError);
              // Don't fail the whole process if sync fails
            }
          }
        }

        setAppUser(userData);
        setError(null);
      } else if (result.error === 'User not found') {
        // For Google sign-in users, we need to create a user document
        // Check if this is a new Firebase auth user without a Firestore document
        console.log('🔄 User document not found, checking if we need to create one for uid:', uid);

        // Try to create a basic user document for Google sign-in users
        // We'll use the Firebase auth user data to populate basic info
        const { auth } = await import('@/config/firebase');
        const currentFirebaseUser = auth.currentUser;

        if (currentFirebaseUser && currentFirebaseUser.uid === uid) {
          console.log('🔄 Creating user document for new user:', currentFirebaseUser.email);

          // Try to determine account type from localStorage or default to individual
          // In a real app, you might pass this from the registration process
          let accountType = AccountType.INDIVIDUAL;
          let businessSetupData = null;
          let firstName = currentFirebaseUser.displayName?.split(' ')[0] || '';
          let lastName = currentFirebaseUser.displayName?.split(' ').slice(1).join(' ') || '';
          let email = currentFirebaseUser.email || '';
          let phone = currentFirebaseUser.phoneNumber || '';

          // Check if this is from a business registration flow
          if (typeof window !== 'undefined') {
            const registrationData = sessionStorage.getItem('pendingRegistration');
            if (registrationData) {
              try {
                const parsedData = JSON.parse(registrationData);
                if (parsedData.accountType) {
                  accountType = parsedData.accountType;
                }

                // For business users, use registration data
                if (parsedData.accountType === AccountType.BUSINESS) {
                  firstName = parsedData.firstName || firstName;
                  lastName = parsedData.lastName || lastName;
                  email = parsedData.email || email;
                  phone = parsedData.phone || phone;

                  // Store business-specific data that will be used in setup
                  businessSetupData = {
                    companyName: parsedData.companyName,
                    taxNumber: parsedData.taxNumber,
                    businessAddress: parsedData.businessAddress,
                    businessPhone: parsedData.businessPhone,
                  };

                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('businessSetupData', JSON.stringify(businessSetupData));
                  }
                }

                // Clear the temporary data
                sessionStorage.removeItem('pendingRegistration');
              } catch (e) {
                console.warn('Failed to parse registration data from session storage');
              }
            }
          }

          const userData = {
            email,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            photoURL: currentFirebaseUser.photoURL || '',
            phone,
            accountType,
            roles: [AuthRole.USER],
            isEmailVerified: currentFirebaseUser.emailVerified,
            isProfileComplete: false, // Will need to complete profile in setup
            preferences: {
              theme: 'light' as const,
              language: 'tr',
              notifications: {
                email: true,
                push: true,
                sms: false,
                marketing: false,
                orderUpdates: true,
                securityAlerts: true,
              },
              privacy: {
                profileVisibility: 'private' as const,
                showEmail: false,
                showPhone: false,
                allowAnalytics: true,
              },
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Create the user document using setDoc to use the uid as document ID
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('@/config/firebase');

          console.log('🔄 About to create user document with data:', userData);
          await setDoc(doc(db, 'users', uid), userData);
          console.log('✅ User document created in Firestore');

          // Create AppUser instance
          const { AppUser } = await import('@/shared-generated/models/auth-models');
          const newAppUser = new AppUser(uid, userData);
          console.log('✅ AppUser instance created:', newAppUser);
          setAppUser(newAppUser);
          setError(null);
          console.log('✅ Created user document for Google sign-in user');
        } else {
          setError(getAuthErrorMessage('auth/user-not-found', 'tr'));
        }
      } else {
        setError(getAuthErrorMessage(result.error || 'default'));
      }
    } catch (e: any) {
      console.error('🚨 Error in useUserDoc load:', e);
      setError(getAuthErrorMessage(e.code || e.message || 'default'));
    } finally {
      setIsUserLoading(false);
    }
  }, [uid]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const update = useCallback(async (data: Partial<IAppUser>) => {
    if (!uid) return null;
    try {
      const result = await serviceRef.current!.update(uid, data);
      if (result.success && result.data) {
        setAppUser(result.data);
        return result.data;
      } else {
        setError(getAuthErrorMessage(result.error || 'default'));
        return null;
      }
    } catch (e: any) {
      setError(getAuthErrorMessage(e.code || e.message || 'default'));
      return null;
    }
  }, [uid]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => { load(); }, [load]);

  return { appUser, isUserLoading, error, refresh, update, clearError };
}
