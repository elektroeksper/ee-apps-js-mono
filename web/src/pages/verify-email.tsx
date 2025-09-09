import { ProtectedRoute } from '@/components/auth/AuthGuard'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const { appUser, isLoading, isProfileComplete } = useAuth()

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
        // Profile needs completion, redirect to setup
        router.replace('/setup')
      }
      return
    }
  }, [appUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <svg
              className="mx-auto h-16 w-16 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              E-postanızı Doğrulayın
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Hesabınızı güvence altına almak için size bir doğrulama e-postası
              gönderdik
            </p>
          </div>

          {/* Email Verification Banner */}
          <div className="mb-8">
            <EmailVerificationBanner showDismiss={false} />
          </div>

          {/* Instructions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sonraki Adımlar
            </h2>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <p>
                  Ekibimizden gelen mesajı e-posta gelen kutunuzda kontrol edin.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <p>E-postadaki doğrulama bağlantısına tıklayın.</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <p>
                  Bu sayfaya dönün ve devam etmek için "Doğruladım" butonuna
                  tıklayın.
                </p>
              </div>
            </div>

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
            <p className="text-sm text-gray-500">
              Yardıma mı ihtiyacınız var?{' '}
              <a
                href="mailto:support@electroexpert.com"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Destek ile İletişime Geçin
              </a>
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
