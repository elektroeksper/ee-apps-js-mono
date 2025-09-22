'use client'

import { getAuthErrorMessage } from '@/config/firebase-error-messages';
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

    // Setup async initialization
    (async () => {
      try {
        const { auth } = await import('@/lib/firebase-auth-config');

        if (!auth) {
          console.warn('🚨 useFirebaseAuth: Firebase Auth not available (likely SSR)');
          setIsAuthLoading(false);
          return;
        }

        // Check for redirect result first (for popup-blocked fallback)
        try {
          console.log('🔄 useFirebaseAuth: Checking for redirect result...');
          const { authService } = await import('@/services/auth.service');
          const redirectResult = await authService.handleRedirectResult();
          if (redirectResult.success && redirectResult.data) {
            console.log('🔄 useFirebaseAuth: Redirect result found:', redirectResult.data.email);
            // The onAuthStateChanged will handle the user update
          }
        } catch (redirectError) {
          console.warn('🚨 useFirebaseAuth: Error handling redirect result:', redirectError);
          // Don't fail the whole initialization for redirect errors
        }

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
      } catch (e) {
        console.error('🚨 useFirebaseAuth: Error in async initialization:', e);
        if (mounted.current) {
          setIsAuthLoading(false);
          setError('Failed to initialize authentication');
        }
      }
    })();
  }

  return { fireUser, claims, isAuthLoading, error, refreshClaims };
}
