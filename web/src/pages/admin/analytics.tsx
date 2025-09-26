'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { AuthGuard } from '@/components/auth'
import { GetServerSideProps } from 'next'
import {
  FiActivity,
  FiBarChart,
  FiCalendar,
  FiPieChart,
  FiRefreshCw,
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
      <AdminLayout title="İstatistikler ve Analitik">
        <AdminAnalyticsPageContent />
      </AdminLayout>
    </AuthGuard>
  )
}

function AdminAnalyticsPageContent() {
  return (
    <div className="pr-6 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  İstatistikler ve Analitik
                </h1>
                <p className="text-slate-600">
                  Detaylı sistem analitikleri ve raporları
                </p>
              </div>
              <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg transform transition-all hover:scale-105">
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 mb-6">
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
          </div>
        </div>

        {/* Planned Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform transition-all hover:scale-105">
            <FiUsers className="h-8 w-8 mb-4" />
            <h3 className="font-semibold mb-2">Kullanıcı Analitiği</h3>
            <p className="text-sm opacity-90">
              Kullanıcı kayıtları, aktivite ve davranış analizi
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl transform transition-all hover:scale-105">
            <FiTrendingUp className="h-8 w-8 mb-4" />
            <h3 className="font-semibold mb-2">Büyüme Metrikleri</h3>
            <p className="text-sm opacity-90">
              Büyüme oranları, trendler ve projeksiyonlar
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl transform transition-all hover:scale-105">
            <FiActivity className="h-8 w-8 mb-4" />
            <h3 className="font-semibold mb-2">Sistem Performansı</h3>
            <p className="text-sm opacity-90">
              Sistem kaynak kullanımı ve performans metrikleri
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl transform transition-all hover:scale-105">
            <FiCalendar className="h-8 w-8 mb-4" />
            <h3 className="font-semibold mb-2">Zaman Bazlı Raporlar</h3>
            <p className="text-sm opacity-90">
              Günlük, haftalık ve aylık detaylı raporlar
            </p>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl transform transition-all hover:scale-105">
            <FiPieChart className="h-8 w-8 mb-4" />
            <h3 className="font-semibold mb-2">Dağılım Grafikleri</h3>
            <p className="text-sm opacity-90">
              Kullanıcı türleri ve kategorik dağılımlar
            </p>
          </div>

          <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl transform transition-all hover:scale-105">
            <FiBarChart className="h-8 w-8 mb-4" />
            <h3 className="font-semibold mb-2">İnteraktif Dashboardlar</h3>
            <p className="text-sm opacity-90">
              Filtrelenebilir ve özelleştirilebilir grafikler
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Force server-side rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  }
}
