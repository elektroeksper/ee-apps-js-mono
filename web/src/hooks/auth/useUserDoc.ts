'use client'

import { IAppUser } from '@/shared-generated';
import { useCallback, useEffect, useState } from 'react';

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

  const load = useCallback(async () => {
    if (!uid) {
      setAppUser(null);
      return;
    }
    
    setIsUserLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/user/${uid}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setAppUser(null);
          return;
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        setAppUser(result.data);
      } else {
        setAppUser(null);
      }
    } catch (e) {
      console.error('🚨 Error in useUserDoc load:', e);
      setError(e instanceof Error ? e.message : 'Failed to load user data');
      setAppUser(null);
    } finally {
      setIsUserLoading(false);
    }
  }, [uid]);

  const update = useCallback(async (data: Partial<IAppUser>): Promise<IAppUser | null> => {
    if (!uid) {
      setError('No user ID provided');
      return null;
    }

    setIsUserLoading(true);
    setError(null);

    try {
      // Get auth token from Firebase Auth
      const { auth } = await import('@/lib/firebase-auth-config');
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      
      const response = await fetch(`/api/user/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setAppUser(result.data);
        return result.data;
      } else {
        throw new Error('Failed to update user');
      }
    } catch (e) {
      console.error('🚨 Error in useUserDoc update:', e);
      setError(e instanceof Error ? e.message : 'Failed to update user data');
      return null;
    } finally {
      setIsUserLoading(false);
    }
  }, [uid]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load user data when uid changes
  useEffect(() => {
    load();
  }, [load]);

  return {
    appUser,
    isUserLoading,
    error,
    refresh,
    update,
    clearError,
  };
}