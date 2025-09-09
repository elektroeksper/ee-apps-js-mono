import { SettingsService } from '@/services/settings.service';
import { useQuery } from '@tanstack/react-query';

const settingsService = new SettingsService();

function useSystemSettings() {
  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const result = await settingsService.getAll({
        isActive: true,
        isDeleted: false
      });
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch system settings');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  return {
    settings,
    isLoading,
    isError,
    error,
    refetch
  };
}

export default useSystemSettings;