// This component handles the video and login section on the landing page
'use client'
import { LoginForm } from '@/components/auth'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useVideosByLocation } from '@/hooks/useContentQueries'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function IndexVideoAndLoginSection() {
  const { appUser, isLoading } = useAuth()
  const router = useRouter()
  const { data: appIndexVideos, isLoading: videosLoading } =
    useVideosByLocation('app-index')
  const primaryVideo = appIndexVideos?.find(v => v.isActive) || null

  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])
  const showVideoColumn = isClient ? videosLoading || !!primaryVideo : true
  const boxLoading = isClient && (videosLoading || isLoading)

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {showVideoColumn ? (
        <div className="relative">
          {boxLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="text-center">
                <LoadingSpinner />
                <p className="mt-2 text-sm text-gray-700">Yükleniyor...</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Video Section */}
            <div className="w-full">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">
                Nasıl Çalışır?
              </h3>
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl bg-gray-100">
                {!isClient ? (
                  // Render same placeholder on server and initial client render
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
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p>Henüz video eklenmemiş</p>
                    </div>
                  </div>
                ) : videosLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Video yükleniyor...</span>
                  </div>
                ) : primaryVideo ? (
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${primaryVideo.youtubeVideoId}${primaryVideo.autoStart ? '?autoplay=1' : ''}${primaryVideo.loop ? '&loop=1&playlist=' + primaryVideo.youtubeVideoId : ''}`}
                    title={
                      primaryVideo.title || 'ElectroExpert Tanıtım Videosu'
                    }
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
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
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p>Henüz video eklenmemiş</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Login Form Section */}
            <div className="w-full">
              {appUser ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">
                    Hoş Geldiniz!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Hesabınıza giriş yaptınız. Dashboard'a giderek
                    hizmetlerimizden yararlanabilirsiniz.
                  </p>
                  <Link href="/home">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg w-full max-w-xs">
                      Dashboard'a Git
                    </Button>
                  </Link>
                </div>
              ) : (
                <LoginForm
                  accountType="individual"
                  onSuccess={() => router.push('/home')}
                  onForgotPasswordClick={() => router.push('/forgot-password')}
                  onRegisterClick={() => router.push('/register')}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          {appUser ? (
            <div className="text-center">
              <p className="text-xl font-semibold mb-4">
                Hesabınız zaten giriş yaptı.
              </p>
              <Link href="/home">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg">
                  Dashboard'a Git
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-center mb-6 mx-auto max-w-[600px]">
                Platforma erişmek için giriş yapın veya kayıt olun. Yeni
                kayıtlar onay sürecine tabi tutulur ve en geç 24 saat içinde
                onaylanır.
              </p>
              <div className="flex justify-between w-full mx-auto max-w-[600px]">
                <Link href="/login?type=individual">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/register?type=individual">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg">
                    Üye Ol
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Removed duplicate export; top-level default export is sufficient
