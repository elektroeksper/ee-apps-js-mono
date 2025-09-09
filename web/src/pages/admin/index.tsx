'use client'

import { AuthGuard } from '@/components/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useUserStats } from '@/hooks/useUserStats'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  FiAlertTriangle,
  FiBarChart,
  FiCheckCircle,
  FiEdit,
  FiRefreshCw,
  FiSettings,
  FiShield,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from 'react-icons/fi'

export default function AdminDashboard() {
  return (
    <AuthGuard
      requireAuth={true}
      requireAdmin={true}
      requireEmailVerification={true}
    >
      <AdminDashboardContent />
    </AuthGuard>
  )
}

function AdminDashboardContent() {
  const { appUser: user, isLoading: userLoading, error, isAdmin } = useAuth()
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch,
  } = useUserStats()

  // Local short grace period to wait for client auth persistence on full refresh.
  // Many auth providers (e.g. Firebase) restore the user asynchronously; avoid
  // showing "no user" immediately on page load by waiting a short time.
  const [authChecking, setAuthChecking] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setAuthChecking(false), 700)
    return () => clearTimeout(t)
  }, [])

  // Debug logging
  console.log('🏠 Admin Dashboard Debug:', {
    user: user
      ? {
          id: user.id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        }
      : null,
    userLoading,
    isAdmin,
    error,
    stats,
    statsLoading,
    statsError,
    timestamp: new Date().toISOString(),
  })

  // Additional debug for auth state
  console.log('🔍 Auth State Details:', {
    hasUser: !!user,
    hasUserId: !!user?.id,
    userEmail: user?.email,
    isEmailVerified: user?.isEmailVerified,
    authLoading: userLoading,
    adminStatus: isAdmin,
    authChecking,
    timestamp: new Date().toISOString(),
  })

  // Additional check using isAdmin from useUser hook
  useEffect(() => {
    if (!userLoading && !authChecking && !isAdmin) {
      // If user is not admin, the AuthGuard should handle this, but this is an extra safety check
      console.warn('Non-admin user attempted to access admin dashboard')
    }
  }, [userLoading, authChecking, isAdmin])

  if (userLoading || authChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 font-medium">
                Kullanıcı verileri yükleniyor...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center space-x-3">
              <FiAlertTriangle className="h-6 w-6 text-red-500" />
              <p className="text-red-700 font-medium">
                Kullanıcı istatistikleri yüklenirken hata oluştu: {statsError}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats?.totalUsers ?? 0,
      icon: FiUsers,
      color: 'blue',
      trend: stats?.monthlyGrowth,
    },
    {
      title: 'Aktif Kullanıcı',
      value: stats?.activeUsers ?? 0,
      icon: FiCheckCircle,
      color: 'green',
      description: 'Son 30 gün içinde aktif',
    },
    {
      title: 'Yönetici Sayısı',
      value: stats?.adminCount ?? 0,
      icon: FiShield,
      color: 'purple',
      description: 'Admin yetkisine sahip',
    },
    {
      title: 'İşletme Hesapları',
      value: stats?.businessUsers ?? 0,
      icon: FiUsers,
      color: 'orange',
      description: 'Doğrulanmış işletmeler',
    },
    {
      title: 'Bireysel Hesaplar',
      value: stats?.individualUsers ?? 0,
      icon: FiUser,
      color: 'indigo',
      description: 'Bireysel kullanıcılar',
    },
    {
      title: 'Son Kayıtlar',
      value: stats?.recentRegistrations ?? 0,
      icon: FiTrendingUp,
      color: 'emerald',
      description: 'Son 7 gün',
    },
  ]

  const quickActions = [
    {
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcıları görüntüle, düzenle ve yönet',
      href: '/admin/users',
      icon: FiUsers,
      color: 'blue',
    },
    {
      title: 'İçerik Yönetimi',
      description: 'Web sitesi içeriğini düzenle ve güncelle',
      href: '/admin/content',
      icon: FiEdit,
      color: 'indigo',
    },
    {
      title: 'İstatistikler',
      description: 'Detaylı analitik ve raporları görüntüle',
      href: '/admin/analytics',
      icon: FiBarChart,
      color: 'green',
    },
    {
      title: 'Sistem Ayarları',
      description: 'Uygulama ayarlarını yapılandır',
      href: '/admin/settings',
      icon: FiSettings,
      color: 'purple',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Yönetici Paneli
              </h1>
              <p className="text-slate-600">
                Hoş geldiniz, {user?.displayName || user?.firstName}
              </p>
            </div>
            <button
              onClick={refetch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </button>
          </div>
        </div>

        {user ? (
          <div className="space-y-8">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((card, index) => {
                const IconComponent = card.icon
                const colorClasses = {
                  blue: 'bg-blue-50 text-blue-600 border-blue-200',
                  green: 'bg-green-50 text-green-600 border-green-200',
                  purple: 'bg-purple-50 text-purple-600 border-purple-200',
                  orange: 'bg-orange-50 text-orange-600 border-orange-200',
                  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
                  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                }

                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-lg border ${colorClasses[card.color as keyof typeof colorClasses]}`}
                      >
                        <IconComponent className="h-6 w-6" />
                      </div>
                      {card.trend && (
                        <div className="flex items-center text-sm text-emerald-600">
                          <FiTrendingUp className="h-4 w-4 mr-1" />+{card.trend}
                          %
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">
                        {card.title}
                      </p>
                      <p className="text-3xl font-bold text-slate-900">
                        {statsLoading ? (
                          <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                        ) : (
                          card.value.toLocaleString()
                        )}
                      </p>
                      {card.description && (
                        <p className="text-xs text-slate-500">
                          {card.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Hızlı İşlemler
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon
                  const colorClasses = {
                    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
                    indigo:
                      'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
                    green:
                      'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
                    purple:
                      'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
                  }

                  return (
                    <Link
                      key={index}
                      href={action.href}
                      className={`group relative overflow-hidden rounded-lg bg-gradient-to-r ${colorClasses[action.color as keyof typeof colorClasses]} p-6 text-white transition-all hover:shadow-lg hover:scale-105`}
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="relative">
                        <IconComponent className="h-8 w-8 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          {action.title}
                        </h3>
                        <p className="text-sm opacity-90">
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Son Aktivite
              </h2>
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-slate-300">
                  <FiBarChart className="h-full w-full" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-900">
                  Henüz aktivite yok
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Sistem aktiviteleri burada görüntülenecek.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center space-x-3">
              <FiAlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-red-700 font-semibold">Erişim Hatası</p>
                <p className="text-red-600 text-sm">
                  {error
                    ? `Hata: ${error}`
                    : 'Kullanıcı verisi mevcut değil. Lütfen tekrar giriş yapmayı deneyin.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
