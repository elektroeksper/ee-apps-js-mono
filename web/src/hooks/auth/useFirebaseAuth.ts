'use client'

import { auth } from '@/config/firebase';
import { getAuthErrorMessage } from '@/shared-generated';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useCallback, useRef, useState } from 'react';

interface FirebaseAuthState {
  fireUser: User | null;
  claims: Record<string, any> | null;
  isAuthLoading: boolean;
  error: string | null;
  refreshClaims: () => Promise<void>;
}

export function useFirebaseAuth(): FirebaseAuthState {
  const [fireUser, setFireUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Record<string, any> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const initialized = useRef(false);

  console.log('🔥 useFirebaseAuth: Hook initialized', {
    timestamp: new Date().toISOString()
  });

  const loadClaims = useCallback(async (user: User, force = false) => {
    try {
      const tokenResult = await user.getIdTokenResult(force);
      const claims = tokenResult.claims || {};
      console.log('🔥 Firebase Claims Loaded:', {
        userEmail: user.email,
        claims,
        force,
        timestamp: new Date().toISOString()
      });
      if (mounted.current) setClaims(claims);
    } catch (e: any) {
      console.error('🚨 Firebase Claims Load Error:', e.message);
      if (mounted.current) setError(getAuthErrorMessage(e.code || e.message || 'default'));
    }
  }, []);

  const refreshClaims = useCallback(async () => {
    if (fireUser) {
      await loadClaims(fireUser, true);
    }
  }, [fireUser, loadClaims]);

  // REACT 19 COMPATIBLE APPROACH: Direct auth setup without useEffect
  if (!initialized.current) {
    initialized.current = true;
    mounted.current = true;
    console.log('🔄 useFirebaseAuth: Direct initialization (React 19 compatible)...');

    // Check immediate auth state
    const currentUser = auth.currentUser;
    console.log('🔄 useFirebaseAuth: Current user on init:', currentUser?.email || 'null');

    if (currentUser) {
      setFireUser(currentUser);
      loadClaims(currentUser, false);
      setIsAuthLoading(false);
    }

    // Set up auth listener
    onAuthStateChanged(auth, async (user) => {
      console.log('🔄 useFirebaseAuth: Auth state changed to:', user?.email || 'null');

      if (!mounted.current) return;

      try {
        setError(null);
        if (user) {
          console.log('🔄 useFirebaseAuth: Setting user and loading claims...');
          setFireUser(user);
          await loadClaims(user, false);
        } else {
          console.log('🔄 useFirebaseAuth: No user, clearing state...');
          setFireUser(null);
          setClaims(null);
        }
      } catch (e: any) {
        console.error('🚨 useFirebaseAuth: Error in auth state change:', e);
        setError(getAuthErrorMessage(e.code || e.message || 'default'));
      } finally {
        if (mounted.current) {
          console.log('🔄 useFirebaseAuth: Setting loading to false');
          setIsAuthLoading(false);
        }
      }
    });
  }

  return { fireUser, claims, isAuthLoading, error, refreshClaims };
}
