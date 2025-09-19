'use client'

import { DebugPanel } from '@/components/admin/DebugPanel'
import { AuthGuard } from '@/components/auth'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import useSystemSettings from '@/hooks/useSystemSettings'
import useUpdateSettingMutation from '@/hooks/useUpdateSettingMutation'
import { SystemSettingsKey } from '@/shared-generated'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBell,
  FiCheckCircle,
  FiDatabase,
  FiServer,
  FiSettings,
  FiShield,
} from 'react-icons/fi'

interface PendingUpdate {
  key: SystemSettingsKey
  value: any
  title: string
  message: string
}

export default function AdminSettingsPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireAdmin={true}
      requireEmailVerification={true}
    >
      <AdminSettingsPageContent />
    </AuthGuard>
  )
}

function AdminSettingsPageContent() {
  const { settings, isLoading, error, isError } = useSystemSettings()
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    pendingUpdate: PendingUpdate | null
  }>({
    isOpen: false,
    pendingUpdate: null,
  })

  // Track recently updated settings for success feedback
  const [recentlyUpdated, setRecentlyUpdated] = useState<
    Set<SystemSettingsKey>
  >(new Set())

  // Clear success indicators after 3 seconds
  useEffect(() => {
    if (recentlyUpdated.size > 0) {
      const timer = setTimeout(() => {
        setRecentlyUpdated(new Set())
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [recentlyUpdated])

  // Individual mutation hooks for each setting
  const updateAllowedFileTypes = useUpdateSettingMutation('allowedFileTypes')
  const updateUserRegistration = useUpdateSettingMutation('userRegistration')
  const updateEmailVerificationRequired = useUpdateSettingMutation(
    'emailVerificationRequired'
  )
  const updateBusinessAccountApproval = useUpdateSettingMutation(
    'businessAccountApproval'
  )
  const updateMaintenanceMode = useUpdateSettingMutation('maintenanceMode')
  const updateEmailNotifications =
    useUpdateSettingMutation('emailNotifications')
  const updateSessionTimeout = useUpdateSettingMutation('sessionTimeout')
  const updateAutoBackup = useUpdateSettingMutation('autoBackup')
  const updateAnalyticsEnabled = useUpdateSettingMutation('analyticsEnabled')
  const updateMaxFileSize = useUpdateSettingMutation('maxFileSize')

  // Track successful updates
  useEffect(() => {
    const mutations = [
      {
        key: 'allowedFileTypes' as SystemSettingsKey,
        mutation: updateAllowedFileTypes,
      },
      {
        key: 'userRegistration' as SystemSettingsKey,
        mutation: updateUserRegistration,
      },
      {
        key: 'emailVerificationRequired' as SystemSettingsKey,
        mutation: updateEmailVerificationRequired,
      },
      {
        key: 'businessAccountApproval' as SystemSettingsKey,
        mutation: updateBusinessAccountApproval,
      },
      {
        key: 'maintenanceMode' as SystemSettingsKey,
        mutation: updateMaintenanceMode,
      },
      {
        key: 'emailNotifications' as SystemSettingsKey,
        mutation: updateEmailNotifications,
      },
      {
        key: 'sessionTimeout' as SystemSettingsKey,
        mutation: updateSessionTimeout,
      },
      { key: 'autoBackup' as SystemSettingsKey, mutation: updateAutoBackup },
      {
        key: 'analyticsEnabled' as SystemSettingsKey,
        mutation: updateAnalyticsEnabled,
      },
      { key: 'maxFileSize' as SystemSettingsKey, mutation: updateMaxFileSize },
    ]

    mutations.forEach(({ key, mutation }) => {
      if (mutation.isSuccess && !recentlyUpdated.has(key)) {
        setRecentlyUpdated(prev => new Set([...prev, key]))
      }
    })
  }, [
    updateAllowedFileTypes.isSuccess,
    updateUserRegistration.isSuccess,
    updateEmailVerificationRequired.isSuccess,
    updateBusinessAccountApproval.isSuccess,
    updateMaintenanceMode.isSuccess,
    updateEmailNotifications.isSuccess,
    updateSessionTimeout.isSuccess,
    updateAutoBackup.isSuccess,
    updateAnalyticsEnabled.isSuccess,
    updateMaxFileSize.isSuccess,
    recentlyUpdated,
  ])

  // Helper function to get mutation hook by key
  const getMutationByKey = (key: SystemSettingsKey) => {
    switch (key) {
      case 'allowedFileTypes':
        return updateAllowedFileTypes
      case 'userRegistration':
        return updateUserRegistration
      case 'emailVerificationRequired':
        return updateEmailVerificationRequired
      case 'businessAccountApproval':
        return updateBusinessAccountApproval
      case 'maintenanceMode':
        return updateMaintenanceMode
      case 'emailNotifications':
        return updateEmailNotifications
      case 'sessionTimeout':
        return updateSessionTimeout
      case 'autoBackup':
        return updateAutoBackup
      case 'analyticsEnabled':
        return updateAnalyticsEnabled
      case 'maxFileSize':
        return updateMaxFileSize
      default:
        return updateUserRegistration
    }
  }

  // Helper function to get setting value by key
  const getSettingValue = (key: SystemSettingsKey) => {
    const setting = settings?.find(s => s.key === key)
    const value = setting?.value

    // Debug logging for value retrieval
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Getting value for ${key}:`, {
        found: !!setting,
        value,
        type: typeof value,
        setting: setting
          ? {
              key: setting.key,
              value: setting.value,
              isActive: setting.isActive,
            }
          : null,
      })
    }

    return value
  }

  // Helper function to show confirmation dialog
  const showConfirmation = (pendingUpdate: PendingUpdate) => {
    setConfirmDialog({
      isOpen: true,
      pendingUpdate,
    })
  }

  // Handle confirmed update
  const handleConfirmedUpdate = () => {
    if (!confirmDialog.pendingUpdate) return

    const { key, value } = confirmDialog.pendingUpdate
    const mutation = getMutationByKey(key)

    console.log('🚀 Starting confirmed update:', {
      key,
      value,
      currentValue: getSettingValue(key),
    })

    mutation.mutate(value, {
      onSuccess: data => {
        console.log('✅ Update confirmed successful:', { key, value, data })
        setConfirmDialog({ isOpen: false, pendingUpdate: null })
      },
      onError: error => {
        console.error('❌ Update confirmed failed:', { key, value, error })
        // Keep dialog open on error so user can see the error in toast
      },
    })
  }

  // Setting update handlers
  const handleUpdateSetting = (
    key: SystemSettingsKey,
    value: any,
    title: string,
    message: string
  ) => {
    showConfirmation({ key, value, title, message })
  }

  const handleToggleSetting = (
    key: SystemSettingsKey,
    currentValue: boolean,
    settingName: string
  ) => {
    const newValue = !currentValue
    const action = newValue ? 'etkinleştirmek' : 'devre dışı bırakmak'
    handleUpdateSetting(
      key,
      newValue,
      `${settingName} ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `${settingName} ayarını ${action} istediğinizden emin misiniz?`
    )
  }

  const ToggleSwitch = ({
    enabled,
    onChange,
    disabled = false,
    loading = false,
    showSuccess = false,
  }: {
    enabled: boolean
    onChange: () => void
    disabled?: boolean
    loading?: boolean
    showSuccess?: boolean
  }) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={onChange}
        disabled={disabled}
        className={`flex items-center justify-center w-10 h-5 rounded-full transition-colors ${
          disabled
            ? 'bg-slate-200 cursor-not-allowed'
            : enabled
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-slate-300 hover:bg-slate-400'
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-2.5' : '-translate-x-2.5'
          }`}
        />
      </button>
      {loading && <LoadingSpinner size="small" className="text-blue-600" />}
      {showSuccess && !loading && (
        <FiCheckCircle className="h-3 w-3 text-green-600 animate-pulse" />
      )}
    </div>
  )

  const ErrorMessage = ({ error }: { error: any }) => {
    if (!error) return null

    return (
      <div className="flex items-start space-x-2 mt-2 text-red-600 text-sm">
        <FiAlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{error.message || 'Bir hata oluştu'}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
              >
                <FiArrowLeft className="h-5 w-5 mr-2" />
              </Link>
              <div className="h-6 w-px bg-slate-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Sistem Ayarları
                </h1>
                <p className="text-slate-600">Uygulama ayarlarını yönetin</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin/content"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FiSettings className="h-4 w-4 mr-2" />
                İçerik Yönetimi
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiSettings className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Genel Ayarlar
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Kullanıcı Kaydı
                  </h3>
                  <p className="text-xs text-slate-500">
                    Yeni kullanıcıların kayıt olmasına izin ver
                  </p>
                </div>
                <div>
                  <ToggleSwitch
                    enabled={getSettingValue('userRegistration') || false}
                    onChange={() =>
                      handleToggleSetting(
                        'userRegistration',
                        getSettingValue('userRegistration') || false,
                        'Kullanıcı Kaydı'
                      )
                    }
                    disabled={updateUserRegistration.isPending}
                    loading={updateUserRegistration.isPending}
                  />
                  <ErrorMessage error={updateUserRegistration.error} />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Email Doğrulama Zorunlu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kullanıcıların email adreslerini doğrulaması zorunlu
                  </p>
                </div>
                <div>
                  <ToggleSwitch
                    enabled={
                      getSettingValue('emailVerificationRequired') || false
                    }
                    onChange={() =>
                      handleToggleSetting(
                        'emailVerificationRequired',
                        getSettingValue('emailVerificationRequired') || false,
                        'Email Doğrulama Zorunluluğu'
                      )
                    }
                    disabled={updateEmailVerificationRequired.isPending}
                    loading={updateEmailVerificationRequired.isPending}
                  />
                  <ErrorMessage error={updateEmailVerificationRequired.error} />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    İşletme Hesap Onayı
                  </h3>
                  <p className="text-xs text-slate-500">
                    İşletme hesapları için manuel onay gerektir
                  </p>
                </div>
                <div>
                  <ToggleSwitch
                    enabled={
                      getSettingValue('businessAccountApproval') || false
                    }
                    onChange={() =>
                      handleToggleSetting(
                        'businessAccountApproval',
                        getSettingValue('businessAccountApproval') || false,
                        'İşletme Hesap Onayı'
                      )
                    }
                    disabled={updateBusinessAccountApproval.isPending}
                    loading={updateBusinessAccountApproval.isPending}
                  />
                  <ErrorMessage error={updateBusinessAccountApproval.error} />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Bakım Modu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistemde bakım çalışması yapılıyor mesajı göster
                  </p>
                </div>
                <div>
                  <ToggleSwitch
                    enabled={getSettingValue('maintenanceMode') || false}
                    onChange={() =>
                      handleToggleSetting(
                        'maintenanceMode',
                        getSettingValue('maintenanceMode') || false,
                        'Bakım Modu'
                      )
                    }
                    disabled={updateMaintenanceMode.isPending}
                    loading={updateMaintenanceMode.isPending}
                  />
                  <ErrorMessage error={updateMaintenanceMode.error} />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <FiBell className="h-4 w-4 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Bildirim Ayarları
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Email Bildirimleri
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistem email bildirimlerini etkinleştir
                  </p>
                </div>
                <div>
                  <ToggleSwitch
                    enabled={getSettingValue('emailNotifications') || false}
                    onChange={() =>
                      handleToggleSetting(
                        'emailNotifications',
                        getSettingValue('emailNotifications') || false,
                        'Email Bildirimleri'
                      )
                    }
                    disabled={updateEmailNotifications.isPending}
                    loading={updateEmailNotifications.isPending}
                  />
                  <ErrorMessage error={updateEmailNotifications.error} />
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiShield className="h-4 w-4 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Güvenlik Ayarları
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Oturum Zaman Aşımı
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kullanıcı oturumlarının otomatik olarak kapanma süresi
                    (saat)
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={getSettingValue('sessionTimeout') || 1}
                      onChange={e => {
                        const value = parseInt(e.target.value)
                        if (value >= 1 && value <= 168) {
                          handleUpdateSetting(
                            'sessionTimeout',
                            value,
                            'Oturum Zaman Aşımı Güncelleme',
                            `Oturum zaman aşımını ${value} saat olarak ayarlamak istediğinizden emin misiniz?`
                          )
                        }
                      }}
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      min="1"
                      max="168"
                      disabled={updateSessionTimeout.isPending}
                    />
                    {updateSessionTimeout.isPending && (
                      <LoadingSpinner size="small" className="text-blue-600" />
                    )}
                  </div>
                  <ErrorMessage error={updateSessionTimeout.error} />
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <FiServer className="h-4 w-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Sistem Ayarları
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Otomatik Yedekleme
                  </h3>
                  <p className="text-xs text-slate-500">
                    Veritabanının otomatik yedeklenmesi
                  </p>
                </div>
                <div>
                  <ToggleSwitch
                    enabled={getSettingValue('autoBackup') || false}
                    onChange={() =>
                      handleToggleSetting(
                        'autoBackup',
                        getSettingValue('autoBackup') || false,
                        'Otomatik Yedekleme'
                      )
                    }
                    disabled={updateAutoBackup.isPending}
                    loading={updateAutoBackup.isPending}
                  />
                  <ErrorMessage error={updateAutoBackup.error} />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Analitik Takibi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kullanıcı davranışı ve sistem analitiği
                  </p>
                </div>
                <div>
                  <ToggleSwitch
                    enabled={getSettingValue('analyticsEnabled') || false}
                    onChange={() =>
                      handleToggleSetting(
                        'analyticsEnabled',
                        getSettingValue('analyticsEnabled') || false,
                        'Analitik Takibi'
                      )
                    }
                    disabled={updateAnalyticsEnabled.isPending}
                    loading={updateAnalyticsEnabled.isPending}
                  />
                  <ErrorMessage error={updateAnalyticsEnabled.error} />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">
                    Maksimum Dosya Boyutu
                  </h3>
                  <p className="text-xs text-slate-500">
                    Yüklenebilecek maksimum dosya boyutu (MB)
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={getSettingValue('maxFileSize') || 10}
                      onChange={e => {
                        const value = parseInt(e.target.value)
                        if (value >= 1 && value <= 100) {
                          handleUpdateSetting(
                            'maxFileSize',
                            value,
                            'Maksimum Dosya Boyutu Güncelleme',
                            `Maksimum dosya boyutunu ${value} MB olarak ayarlamak istediğinizden emin misiniz?`
                          )
                        }
                      }}
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      min="1"
                      max="100"
                      disabled={updateMaxFileSize.isPending}
                    />
                    {updateMaxFileSize.isPending && (
                      <LoadingSpinner size="small" className="text-blue-600" />
                    )}
                  </div>
                  <ErrorMessage error={updateMaxFileSize.error} />
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FiDatabase className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Dosya Yükleme Ayarları
              </h2>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 mb-2 text-sm">
                İzin Verilen Dosya Türleri
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Kullanıcıların yükleyebileceği dosya türleri
              </p>
              <div className="flex flex-wrap gap-2">
                {getSettingValue('allowedFileTypes') ? (
                  (getSettingValue('allowedFileTypes') as Array<string>).map(
                    (type, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        .{type}
                      </span>
                    )
                  )
                ) : (
                  <span className="text-xs text-slate-500">
                    Henüz dosya türü ayarlanmamış
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() =>
            setConfirmDialog({ isOpen: false, pendingUpdate: null })
          }
          onConfirm={handleConfirmedUpdate}
          title={confirmDialog.pendingUpdate?.title || ''}
          message={confirmDialog.pendingUpdate?.message || ''}
          confirmText="Evet, Uygula"
          cancelText="İptal"
          type="warning"
          isLoading={
            confirmDialog.pendingUpdate
              ? getMutationByKey(confirmDialog.pendingUpdate.key).isPending
              : false
          }
        />

        {/* Debug Panel */}
        <DebugPanel settings={settings} isLoading={isLoading} error={error} />
      </div>
    </div>
  )
}
