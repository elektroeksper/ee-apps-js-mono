import Header from '@/components/Header'
import { Button } from '@/components/ui/Button'
import IndexVideoAndLoginSection from '@/components/ui/IndexVideoAndLoginSection'
import { useAuth } from '@/contexts/AuthContext'
import { useVideosByLocation } from '@/hooks/useContentQueries'
// Auth service and error helpers are not needed here because we use the
// shared LoginForm component which handles submission and errors.
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const { appUser, isLoading } = useAuth()
  const router = useRouter()
  // Local email/password state and handler removed in favor of the
  // reusable <LoginForm /> component below.

  // Fetch videos for app-index location
  const { data: appIndexVideos, isLoading: videosLoading } =
    useVideosByLocation('app-index')

  // Avoid rendering the video iframe on the server to prevent
  // SSR/CSR markup mismatches (Next.js hydration errors). We render
  // a neutral placeholder during SSR and until the component mounts
  // on the client, then show the actual video state.
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // login handled by LoginForm

  // Get the first active video for the app-index location
  const primaryVideo = appIndexVideos?.find(video => video.isActive) || null

  // Decide whether to show the video column.
  // - During SSR / initial render we keep the column (isClient=false) to avoid
  //   hydration mismatches. After mount, showVideoColumn reflects actual data.
  const showVideoColumn = isClient ? videosLoading || !!primaryVideo : true

  // Show loading overlay for the whole content box (video + form)
  const boxLoading = isClient && (videosLoading || isLoading)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Elektrik ve Elektronik Hizmetleri
            </h1>
            <p className="text-xl sm:text-2xl mb-8 text-gray-200">
              Güvenilir ustalar, kaliteli hizmet, uygun fiyat
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/services')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 inline-block"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Hizmetler
              </Button>
              <Button
                onClick={() => router.push('/register?type=business')}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 inline-block"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Bayi Başvurusu
              </Button>
              {!appUser && (
                <Button
                  onClick={() => router.push('/login?type=business')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 inline-block"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Bayi Girişi
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Sayılarla Biz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center transform hover:scale-105 transition-transform">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">
                Toplam Kullanıcı
              </h3>
              <p className="text-4xl font-bold text-blue-600">123,456</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center transform hover:scale-105 transition-transform">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">
                Toplam Bayi
              </h3>
              <p className="text-4xl font-bold text-green-600">456</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center transform hover:scale-105 transition-transform">
              <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-white"
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
              <h3 className="text-2xl font-bold mb-2 text-gray-800">
                Tamamlanan İşler
              </h3>
              <p className="text-4xl font-bold text-purple-600">7,890</p>
            </div>
          </div>
        </div>
      </section>

      {/* Video and Login Section */}
      <section className="py-16 bg-white">
        <IndexVideoAndLoginSection />
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Müşterilerimiz Ne Diyor?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700 italic mb-4">
                    "ElectroExpert sayesinde evimizin tüm elektrik işlerini
                    güvenle hallettik. Hızlı ve profesyonel hizmet!"
                  </p>
                  <p className="font-semibold text-gray-900">Ahmet Y.</p>
                  <p className="text-sm text-gray-500">İstanbul</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700 italic mb-4">
                    "İşyerimizin tüm elektronik cihaz bakımlarını
                    ElectroExpert'e emanet ediyoruz. Çok memnunuz!"
                  </p>
                  <p className="font-semibold text-gray-900">Mehmet K.</p>
                  <p className="text-sm text-gray-500">Ankara</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Hemen Başlayın</h2>
          <p className="text-xl text-blue-100 mb-8">
            Profesyonel elektrik ve elektronik hizmetleri için doğru
            adrestesiniz
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?type=individual">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-medium">
                Bireysel Üyelik
              </Button>
            </Link>
            <Link href="/register?type=business">
              <Button className="bg-green-500 text-white hover:bg-green-600 px-8 py-3 rounded-full text-lg font-medium">
                İşletme Üyeliği
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">ElectroExpert</h3>
              <p className="text-gray-400">
                Güvenilir elektrik ve elektronik hizmetleri platformu
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Hızlı Linkler</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/services"
                    className="text-gray-400 hover:text-white"
                  >
                    Hizmetler
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white"
                  >
                    Hakkımızda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-400 hover:text-white"
                  >
                    İletişim
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Hesap</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/login"
                    className="text-gray-400 hover:text-white"
                  >
                    Giriş Yap
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-gray-400 hover:text-white"
                  >
                    Kayıt Ol
                  </Link>
                </li>
                <li>
                  <Link
                    href="/forgot-password"
                    className="text-gray-400 hover:text-white"
                  >
                    Şifremi Unuttum
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Sosyal Medya</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400">
              © 2024 ElectroExpert. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
