import { ISettingItem, SystemSettingsKey } from "@/shared-generated";
import { settingsService } from "@/shared-generated/services/settings.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useUpdateSettingMutation = (key: SystemSettingsKey) => {
  const queryClient = useQueryClient();

  const { mutate, isPending, error, isError, isSuccess, data } = useMutation({
    mutationKey: ["settings", "update", key],
    mutationFn: async (value: any) => {
      console.log(`🚀 Updating setting ${key} with value:`, value);
      const result = await settingsService.update(key, value);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update setting');
      }

      return result;
    },
    onMutate: async (newValue) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['systemSettings'] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<ISettingItem[]>(['systemSettings']);

      // Optimistically update the cache
      if (previousSettings) {
        const updatedSettings = previousSettings.map(setting =>
          setting.key === key
            ? { ...setting, value: newValue, updatedAt: new Date() }
            : setting
        );

        // If setting doesn't exist, add it
        if (!previousSettings.find(s => s.key === key)) {
          updatedSettings.push({
            key,
            value: newValue,
            isActive: true,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: 'current-user'
          } as ISettingItem);
        }

        queryClient.setQueryData(['systemSettings'], updatedSettings);
        console.log('🔄 Optimistic update applied for', key);
      }

      return { previousSettings };
    },
    onSuccess: (data, variables) => {
      console.log('✅ Setting update successful:', { key, value: variables });

      // Invalidate and refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });

      // Show success toast
      toast.success(`${getSettingDisplayName(key)} başarıyla güncellendi!`, {
        duration: 3000,
        position: 'top-right',
      });
    },
    onError: (error, variables, context) => {
      console.error('❌ Setting update failed:', { key, value: variables, error });

      // Rollback optimistic update
      if (context?.previousSettings) {
        queryClient.setQueryData(['systemSettings'], context.previousSettings);
        console.log('🔄 Rollback applied for', key);
      }

      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Güncelleme başarısız oldu';
      toast.error(`${getSettingDisplayName(key)} güncellenemedi: ${errorMessage}`, {
        duration: 5000,
        position: 'top-right',
      });
    },
  });

  return {
    mutate,
    isPending,
    error,
    isError,
    isSuccess,
    data
  };
};

// Helper function to get user-friendly setting names
function getSettingDisplayName(key: SystemSettingsKey): string {
  const displayNames: Record<SystemSettingsKey, string> = {
    userRegistration: 'Kullanıcı Kaydı',
    emailVerificationRequired: 'Email Doğrulama Zorunluluğu',
    businessAccountApproval: 'İşletme Hesap Onayı',
    maintenanceMode: 'Bakım Modu',
    emailNotifications: 'Email Bildirimleri',
    sessionTimeout: 'Oturum Zaman Aşımı',
    autoBackup: 'Otomatik Yedekleme',
    analyticsEnabled: 'Analitik Takibi',
    maxFileSize: 'Maksimum Dosya Boyutu',
    allowedFileTypes: 'İzin Verilen Dosya Türleri'
  };

  return displayNames[key] || key;
}

export default useUpdateSettingMutation;