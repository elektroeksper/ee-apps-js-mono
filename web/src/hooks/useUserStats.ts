/**
 * useUserStats Hook
 * Provides user statistics functionality for admin dashboard
 */

import { functions } from '@/config/firebase';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useState } from 'react';

interface IUserStats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  businessUsers: number;
  individualUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  recentRegistrations: number; // Last 7 days
  monthlyGrowth: number; // % growth this month
}

interface IUseUserStatsReturn {
  stats: IUserStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook to manage user statistics for admin dashboard
 */
export function useUserStats(): IUseUserStatsReturn {
  const [stats, setStats] = useState<IUserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch user statistics
  const fetchStats = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      const getUserStatsFunction = httpsCallable<void, IUserStats>(
        functions,
        'getUserStats'
      );

      const result = await getUserStatsFunction();
      setStats(result.data);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch user statistics';
      setError(errorMessage);
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Auto-fetch on component mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch,
    clearError,
  };
}

/**
 * Hook to get user statistics with auto-refresh
 */
export function useUserStatsWithRefresh(intervalMs: number = 30000): IUseUserStatsReturn {
  const statsHook = useUserStats();

  useEffect(() => {
    if (intervalMs <= 0) return;

    const interval = setInterval(() => {
      statsHook.refetch();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [statsHook.refetch, intervalMs]);

  return statsHook;
}
