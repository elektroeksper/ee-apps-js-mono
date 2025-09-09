'use client'

import { AuthGuard } from '@/components/auth'
import Link from 'next/link'
import {
  FiActivity,
  FiArrowLeft,
  FiBarChart,
  FiCalendar,
  FiPieChart,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi'

export default function AdminAnalyticsPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireAdmin={true}
      requireEmailVerification={true}
    >
      <AdminAnalyticsPageContent />
    </AuthGuard>
  )
}

function AdminAnalyticsPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin"
              className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FiArrowLeft className="h-5 w-5 mr-2" />
              Yönetici Paneli
            </Link>
            <div className="h-6 w-px bg-slate-300"></div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                İstatistikler ve Analitik
              </h1>
              <p className="text-slate-600">
                Detaylı sistem analitikleri ve raporları
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-slate-300 mb-6">
              <FiBarChart className="h-full w-full" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Analitik Paneli Geliştiriliyor
            </h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Kapsamlı analitik ve raporlama özellikleri yakında kullanıma
              sunulacak. Bu sayfa kullanıcı davranışları, sistem performansı ve
              iş metrikleri hakkında detaylı bilgiler içerecek.
            </p>

            {/* Planned Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <FiUsers className="h-8 w-8 mb-4" />
                <h3 className="font-semibold mb-2">Kullanıcı Analitiği</h3>
                <p className="text-sm opacity-90">
                  Kullanıcı kayıtları, aktivite ve davranış analizi
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <FiTrendingUp className="h-8 w-8 mb-4" />
                <h3 className="font-semibold mb-2">Büyüme Metrikleri</h3>
                <p className="text-sm opacity-90">
                  Büyüme oranları, trendler ve projeksiyonlar
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <FiActivity className="h-8 w-8 mb-4" />
                <h3 className="font-semibold mb-2">Sistem Performansı</h3>
                <p className="text-sm opacity-90">
                  Sistem kaynak kullanımı ve performans metrikleri
                </p>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <FiCalendar className="h-8 w-8 mb-4" />
                <h3 className="font-semibold mb-2">Zaman Bazlı Raporlar</h3>
                <p className="text-sm opacity-90">
                  Günlük, haftalık ve aylık detaylı raporlar
                </p>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
                <FiPieChart className="h-8 w-8 mb-4" />
                <h3 className="font-semibold mb-2">Dağılım Grafikleri</h3>
                <p className="text-sm opacity-90">
                  Kullanıcı türleri ve kategorik dağılımlar
                </p>
              </div>

              <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-6 text-white">
                <FiBarChart className="h-8 w-8 mb-4" />
                <h3 className="font-semibold mb-2">İnteraktif Dashboardlar</h3>
                <p className="text-sm opacity-90">
                  Filtrelenebilir ve özelleştirilebilir grafikler
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
