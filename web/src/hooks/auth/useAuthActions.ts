'use client'

import { AuthService } from '@/services/auth/AuthService';
import { IBusinessRegisterData, ILoginData, IPasswordChangeData, IRegisterData } from '@/shared-generated';
import { useCallback } from 'react';

interface ActionResult { success: boolean; error?: string }

export function useAuthActions() {
  const login = useCallback(async (data: ILoginData): Promise<ActionResult> => {
    const service = new AuthService();
    const res = await service.login(data);
    return { success: res.success, error: res.error };
  }, []);

  const register = useCallback(async (data: IRegisterData | IBusinessRegisterData): Promise<ActionResult> => {
    const service = new AuthService();

    // Store registration data temporarily for user document creation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pendingRegistration', JSON.stringify(data));
    }

    const res = await service.register(data);

    // Clear temporary data if registration failed
    if (!res.success && typeof window !== 'undefined') {
      sessionStorage.removeItem('pendingRegistration');
    }

    return { success: res.success, error: res.error };
  }, []);

  const logout = useCallback(async (): Promise<ActionResult> => {
    const service = new AuthService();
    const res = await service.logout();
    return { success: res.success, error: res.error };
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<ActionResult> => {
    const service = new AuthService();
    const res = await service.loginWithGoogle();
    return { success: res.success, error: res.error };
  }, []);

  const sendEmailVerification = useCallback(async (): Promise<ActionResult> => {
    const service = new AuthService();
    const res = await service.sendEmailVerification();
    return { success: res.success, error: res.error };
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<ActionResult> => {
    const service = new AuthService();
    const res = await service.resetPassword(email);
    return { success: res.success, error: res.error };
  }, []);

  const changePassword = useCallback(async (data: IPasswordChangeData): Promise<ActionResult> => {
    const service = new AuthService();
    const res = await service.changePassword(data);
    return { success: res.success, error: res.error };
  }, []);

  return { login, register, logout, loginWithGoogle, sendEmailVerification, resetPassword, changePassword };
}
