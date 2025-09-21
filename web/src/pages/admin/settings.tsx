'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { AuthGuard } from '@/components/auth'
import { useAuth } from '@/contexts/AuthContext'
import {
  ISettingItem,
  SystemSettingsKey,
} from '@/shared-generated/types/common-types'
import { useEffect, useState } from 'react'
import {
  FiAlertTriangle,
  FiBarChart,
  FiClock,
  FiDatabase,
  FiFileText,
  FiHardDrive,
  FiMail,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiToggleLeft,
  FiToggleRight,
  FiUsers,
} from 'react-icons/fi'

interface SettingConfig {
  key: SystemSettingsKey
  label: string
  description: string
  type: 'boolean' | 'number' | 'string' | 'array'
  icon: React.ReactNode
  category: string
  defaultValue: any
}

const settingsConfig: SettingConfig[] = [
  {
    key: 'emailNotifications',
    label: 'E-posta Bildirimleri',
    description: 'Sistem e-posta bildirimlerini etkinleştir',
    type: 'boolean',
    icon: <FiMail className="h-5 w-5" />,
    category: 'İletişim',
    defaultValue: true,
  },
  {
    key: 'maintenanceMode',
    label: 'Bakım Modu',
    description: 'Sistemi bakım moduna alır, sadece adminler erişebilir',
    type: 'boolean',
    icon: <FiAlertTriangle className="h-5 w-5" />,
    category: 'Sistem',
    defaultValue: false,
  },
  {
    key: 'userRegistration',
    label: 'Kullanıcı Kaydı',
    description: 'Yeni kullanıcı kayıtlarını etkinleştir',
    type: 'boolean',
    icon: <FiUsers className="h-5 w-5" />,
    category: 'Kullanıcı Yönetimi',
    defaultValue: true,
  },
  {
    key: 'emailVerificationRequired',
    label: 'E-posta Doğrulama Zorunluluğu',
    description: 'Kullanıcıların e-posta adreslerini doğrulamasını zorunlu kıl',
    type: 'boolean',
    icon: <FiShield className="h-5 w-5" />,
    category: 'Güvenlik',
    defaultValue: true,
  },
  {
    key: 'businessAccountApproval',
    label: 'İşletme Hesabı Onayı',
    description: 'İşletme hesapları için manuel onay gereksinimi',
    type: 'boolean',
    icon: <FiShield className="h-5 w-5" />,
    category: 'İşletme Yönetimi',
    defaultValue: true,
  },
  {
    key: 'autoBackup',
    label: 'Otomatik Yedekleme',
    description: 'Veritabanının otomatik yedeklenmesini etkinleştir',
    type: 'boolean',
    icon: <FiDatabase className="h-5 w-5" />,
    category: 'Sistem',
    defaultValue: true,
  },
  {
    key: 'analyticsEnabled',
    label: 'Analitik Toplama',
    description: 'Kullanım analitiklerini topla ve kaydet',
    type: 'boolean',
    icon: <FiBarChart className="h-5 w-5" />,
    category: 'Analitik',
    defaultValue: true,
  },
  {
    key: 'sessionTimeout',
    label: 'Oturum Zaman Aşımı (dakika)',
    description: 'Kullanıcı oturumunun otomatik sonlandırılma süresi',
    type: 'number',
    icon: <FiClock className="h-5 w-5" />,
    category: 'Güvenlik',
    defaultValue: 60,
  },
  {
    key: 'maxFileSize',
    label: 'Maksimum Dosya Boyutu (MB)',
    description: 'Yüklenebilecek maksimum dosya boyutu',
    type: 'number',
    icon: <FiHardDrive className="h-5 w-5" />,
    category: 'Dosya Yönetimi',
    defaultValue: 10,
  },
  {
    key: 'allowedFileTypes',
    label: 'İzin Verilen Dosya Türleri',
    description: 'Yüklenebilecek dosya uzantıları (virgülle ayrılmış)',
    type: 'string',
    icon: <FiFileText className="h-5 w-5" />,
    category: 'Dosya Yönetimi',
    defaultValue: 'jpg,jpeg,png,pdf,doc,docx',
  },
]

export default function AdminSettingsPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireAdmin={true}
      requireEmailVerification={true}
    >
      <AdminLayout title="Sistem Ayarları">
        <AdminSettingsPageContent />
      </AdminLayout>
    </AuthGuard>
  )
}

function AdminSettingsPageContent() {
  const { fireUser } = useAuth() as any
  const [settings, setSettings] = useState<
    Partial<Record<SystemSettingsKey, any>>
  >({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)

      if (!fireUser) return

      const idToken = await fireUser.getIdToken(true)
      const response = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const settingsMap: Partial<Record<SystemSettingsKey, any>> = {}

        // Initialize with default values
        settingsConfig.forEach(config => {
          settingsMap[config.key] = config.defaultValue
        })

        // Override with actual values
        if (data.data) {
          data.data.forEach((item: ISettingItem) => {
            settingsMap[item.key] = item.value
          })
        }

        setSettings(settingsMap)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: SystemSettingsKey, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    try {
      setSaving(true)

      if (!fireUser) return

      const idToken = await fireUser.getIdToken(true)

      const promises = Object.entries(settings).map(([key, value]) =>
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            key: key as SystemSettingsKey,
            value,
          }),
        })
      )

      await Promise.all(promises)
      setHasChanges(false)

      // Show success message (you can implement a toast notification here)
      alert('Ayarlar başarıyla kaydedildi!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ayarlar kaydedilirken hata oluştu!')
    } finally {
      setSaving(false)
    }
  }

  const groupedSettings = settingsConfig.reduce(
    (acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = []
      }
      acc[config.category].push(config)
      return acc
    },
    {} as Record<string, SettingConfig[]>
  )

  if (loading) {
    return (
      <div className="pr-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pr-6 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Sistem Ayarları
                </h1>
                <p className="text-slate-600">
                  Sistem genelindeki ayarları yönet ve yapılandır
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={loadSettings}
                  className="inline-flex items-center px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium shadow-lg transform transition-all hover:scale-105"
                >
                  <FiRefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </button>
                {hasChanges && (
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium shadow-lg transform transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <FiSave className="h-4 w-4 mr-2" />
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-8">
          {Object.entries(groupedSettings).map(
            ([category, categorySettings]) => (
              <div
                key={category}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {category}
                  </h2>
                </div>

                <div className="p-8 space-y-6">
                  {categorySettings.map(config => (
                    <div
                      key={config.key}
                      className="flex items-center justify-between p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 p-3 bg-white rounded-lg shadow-sm text-slate-600">
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            {config.label}
                          </h3>
                          <p className="text-slate-600 text-sm">
                            {config.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {config.type === 'boolean' ? (
                          <button
                            onClick={() =>
                              updateSetting(config.key, !settings[config.key])
                            }
                            className="flex items-center"
                          >
                            {settings[config.key] ? (
                              <FiToggleRight className="h-8 w-8 text-green-500 hover:text-green-600 transition-colors" />
                            ) : (
                              <FiToggleLeft className="h-8 w-8 text-slate-400 hover:text-slate-500 transition-colors" />
                            )}
                          </button>
                        ) : config.type === 'number' ? (
                          <input
                            type="number"
                            value={settings[config.key] ?? config.defaultValue}
                            onChange={e =>
                              updateSetting(
                                config.key,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="0"
                          />
                        ) : (
                          <input
                            type="text"
                            value={settings[config.key] ?? config.defaultValue}
                            onChange={e =>
                              updateSetting(config.key, e.target.value)
                            }
                            className="w-64 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Warning Message */}
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <FiAlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Dikkat
              </h3>
              <p className="text-yellow-700 text-sm">
                Bu ayarlar sistem genelinde etkili olur. Özellikle bakım modu ve
                güvenlik ayarlarını değiştirirken dikkatli olun. Bazı
                değişiklikler sistemin yeniden başlatılmasını gerektirebilir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
