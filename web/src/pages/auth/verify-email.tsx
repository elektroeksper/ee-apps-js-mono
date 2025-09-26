import { ProtectedRoute } from '@/components/auth/AuthGuard'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const { appUser, isLoading, isProfileComplete } = useAuth()
  const { type } = router.query

  // Determine user type and appropriate messages
  const userTypeInfo = useMemo(() => {
    const userType = type === 'business' ? 'business' : 'consumer'

    if (userType === 'business') {
      return {
        title: 'İş Hesabınızı Doğrulayın',
        subtitle:
          'İş hesabınızı güvence altına almak için size bir doğrulama e-postası gönderdik',
        nextSteps: {
          title: 'İş Kaydı Sonraki Adımlar',
          instructions: [
            'Ekibimizden gelen mesajı e-posta gelen kutunuzda kontrol edin.',
            'E-postadaki doğrulama bağlantısına tıklayın.',
            'Bu sayfaya dönün ve devam etmek için "Doğruladım" butonuna tıklayın.',
            'İş profilinizi tamamlayın ve onay bekleyin.',
          ],
        },
        redirectPath: '/setup?type=business',
      }
    }

    return {
      title: 'E-postanızı Doğrulayın',
      subtitle:
        'Hesabınızı güvence altına almak için size bir doğrulama e-postası gönderdik',
      nextSteps: {
        title: 'Sonraki Adımlar',
        instructions: [
          'Ekibimizden gelen mesajı e-posta gelen kutunuzda kontrol edin.',
          'E-postadaki doğrulama bağlantısına tıklayın.',
          'Bu sayfaya dönün ve devam etmek için "Doğruladım" butonuna tıklayın.',
        ],
      },
      redirectPath: '/setup',
    }
  }, [type])

  useEffect(() => {
    if (isLoading) return

    if (!appUser) {
      router.replace('/')
      return
    }

    if (appUser.isEmailVerified) {
      // If email is verified, check if profile is complete
      if (isProfileComplete) {
        // Profile is complete, redirect to home/dashboard
        router.replace('/home')
      } else {
        // Profile needs completion, redirect to setup with type parameter
        router.replace(userTypeInfo.redirectPath)
      }
      return
    }
  }, [appUser, isLoading, router, userTypeInfo.redirectPath])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-success">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!appUser || appUser.isEmailVerified) {
    return null // Will redirect
  }

  return (
    <ProtectedRoute redirectTo="/login">
      <div className="min-h-screen bg-gradient-success py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="mx-auto h-16 w-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">
                {userTypeInfo.title}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {userTypeInfo.subtitle}
              </p>
              {type === 'business' && (
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  İş Hesabı Kaydı
                </div>
              )}
            </div>
          </div>

          {/* Email Verification Banner */}
          <div className="mb-8">
            <EmailVerificationBanner showDismiss={false} />
          </div>

          {/* Instructions */}
          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl p-6 border border-white/20">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {userTypeInfo.nextSteps.title}
            </h2>
            <div className="space-y-4 text-gray-600">
              {userTypeInfo.nextSteps.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p>{instruction}</p>
                </div>
              ))}
            </div>

            {type === 'business' && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-blue-500 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      İş Hesabı Onay Süreci
                    </h3>
                    <p className="text-sm text-blue-800">
                      E-posta doğrulaması tamamlandıktan sonra, iş hesabınız
                      manuel olarak incelenecek ve 24-48 saat içinde
                      onaylanacaktır.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                E-postayı almadınız mı?
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Spam veya gereksiz klasörünüzü kontrol edin</li>
                <li>• Doğru e-posta adresini girdiğinizden emin olun</li>
                <li>
                  • Yukarıdaki "E-postayı Yeniden Gönder" düğmesini kullanın
                </li>
              </ul>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <div className="bg-white/60 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-sm text-gray-600">
                Yardıma mı ihtiyacınız var?{' '}
                <a
                  href="mailto:support@electroexpert.com"
                  className="font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Destek ile İletişime Geçin
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Force server-side rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  }
}
