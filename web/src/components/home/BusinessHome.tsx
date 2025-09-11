/**
 * Business Home Component
 * Dashboard for business accounts with statistics and management features
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useVideosByLocation } from '@/hooks/useContentQueries'
import { IExtendedAppUser, getBusinessName } from '@/types/user'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

interface DashboardStats {
  totalCustomers: number
  activeRequests: number
  completedServices: number
  monthlyRevenue: number
  rating: number
  reviewCount: number
}

const BusinessHome: React.FC = () => {
  const { appUser } = useAuth()
  const extendedUser = appUser as IExtendedAppUser
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeRequests: 0,
    completedServices: 0,
    monthlyRevenue: 0,
    rating: 0,
    reviewCount: 0,
  })
  const [loading, setLoading] = useState(true)

  // Video fetch and client guard
  const { data: videos, isLoading: videosLoading } =
    useVideosByLocation('business-home')
  const primaryVideo = videos?.find(v => v.isActive) || null
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Mock recent activities
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        totalCustomers: 247,
        activeRequests: 12,
        completedServices: 186,
        monthlyRevenue: 45750,
        rating: 4.7,
        reviewCount: 89,
      })

      setRecentActivities([
        {
          id: 1,
          type: 'request',
          customer: 'Ahmet Yılmaz',
          service: 'TV Tamiri',
          time: '15 dakika önce',
          status: 'new',
        },
        {
          id: 2,
          type: 'review',
          customer: 'Fatma Demir',
          rating: 5,
          time: '2 saat önce',
          comment: 'Çok hızlı ve kaliteli hizmet',
        },
        {
          id: 3,
          type: 'completed',
          customer: 'Mehmet Öz',
          service: 'Klima Montajı',
          time: '5 saat önce',
          amount: 2500,
        },
        {
          id: 4,
          type: 'request',
          customer: 'Ayşe Kara',
          service: 'Beyaz Eşya Servisi',
          time: '1 gün önce',
          status: 'in_progress',
        },
      ])

      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hoş Geldiniz,{' '}
                {getBusinessName(extendedUser) || extendedUser?.displayName}!
              </h1>
              <p className="text-gray-600 mt-1">
                İşletme kontrol panelinize hoş geldiniz
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {extendedUser?.businessInfo?.isApproved && (
                <div className="flex items-center px-4 py-2 bg-green-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Onaylanmış İşletme
                  </span>
                </div>
              )}
              {extendedUser?.businessInfo?.isCertified && (
                <div className="flex items-center px-4 py-2 bg-blue-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-blue-800 font-medium">
                    Yetkili Bayi
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Link href="/services/new">
            <div className="bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Bekleyen</p>
                  <p className="text-2xl font-bold">{stats.activeRequests}</p>
                  <p className="text-blue-100 text-sm mt-1">Yeni Talep</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-full">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h2a1 1 0 100-2 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Toplam Müşteri</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCustomers}
                </p>
                <p className="text-green-600 text-sm mt-1">↑ %12</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tamamlanan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedServices}
                </p>
                <p className="text-gray-500 text-sm mt-1">Bu ay</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Aylık Gelir</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₺{stats.monthlyRevenue.toLocaleString('tr-TR')}
                </p>
                <p className="text-green-600 text-sm mt-1">↑ %8</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Son Aktiviteler
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {activity.type === 'request' && (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
                            </svg>
                          </div>
                        )}
                        {activity.type === 'review' && (
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-yellow-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                        {activity.type === 'completed' && (
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.customer}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.time}
                          </p>
                        </div>
                        {activity.type === 'request' && (
                          <div>
                            <p className="text-sm text-gray-600 mt-1">
                              Yeni servis talebi: {activity.service}
                            </p>
                            {activity.status === 'new' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                                Yeni
                              </span>
                            )}
                            {activity.status === 'in_progress' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                                Devam Ediyor
                              </span>
                            )}
                          </div>
                        )}
                        {activity.type === 'review' && (
                          <div>
                            <div className="flex items-center mt-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${i < activity.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            {activity.comment && (
                              <p className="text-sm text-gray-600 mt-1">
                                "{activity.comment}"
                              </p>
                            )}
                          </div>
                        )}
                        {activity.type === 'completed' && (
                          <div>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.service} tamamlandı
                            </p>
                            {activity.amount && (
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                ₺{activity.amount.toLocaleString('tr-TR')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200">
                <Link href="/activities">
                  <span className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                    Tüm aktiviteleri gör →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Rating & Reviews */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Değerlendirmeler
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {stats.rating}
                </div>
                <div className="flex items-center justify-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(stats.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {stats.reviewCount} değerlendirme
                </p>
              </div>
              <Link href="/reviews">
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Değerlendirmeleri Gör
                </button>
              </Link>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Hızlı İşlemler
              </h3>
              <div className="space-y-3">
                <Link href="/profile">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded cursor-pointer">
                    <span className="text-sm text-gray-700">
                      Profili Düzenle
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </Link>
                <Link href="/services">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded cursor-pointer">
                    <span className="text-sm text-gray-700">
                      Hizmetleri Yönet
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </Link>
                <Link href="/documents">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded cursor-pointer">
                    <span className="text-sm text-gray-700">Belgelerim</span>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </Link>
                <Link href="/analytics">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded cursor-pointer">
                    <span className="text-sm text-gray-700">İstatistikler</span>
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>

            {/* Promotion */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Premium'a Geçin</h3>
              <p className="text-sm mb-4 text-blue-100">
                Daha fazla müşteriye ulaşın ve özel avantajlardan yararlanın
              </p>
              <button className="w-full px-4 py-2 bg-white text-blue-600 rounded hover:bg-gray-100 font-medium text-sm">
                Detayları Gör
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Section */}
      {isClient && (videosLoading || primaryVideo) && (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <div
                className="relative bg-gray-100 rounded-lg overflow-hidden shadow-xl"
                style={{ height: '500px' }}
              >
                {videosLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Video yükleniyor...</span>
                  </div>
                ) : primaryVideo ? (
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${primaryVideo.youtubeVideoId}${primaryVideo.autoStart ? '?autoplay=1' : ''}${primaryVideo.loop ? '&loop=1&playlist=' + primaryVideo.youtubeVideoId : ''}`}
                    title={primaryVideo.title || 'Yardım Videosu'}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
                        />
                      </svg>
                      <p>Henüz video eklenmemiş</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusinessHome
