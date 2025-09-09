/**
 * Welcome Page
 * Temporary page to handle redirects - will redirect to setup
 */

import { AuthGuard } from '@/components/auth/AuthGuard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

function WelcomeContent() {
  const { appUser, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && appUser) {
      // Redirect to setup page for profile completion
      router.replace('/setup')
    }
  }, [appUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Hoş Geldiniz!
        </h2>
        <p className="text-gray-600 mb-6">
          Hesabınız başarıyla oluşturuldu. Profil kurulum sayfasına
          yönlendiriliyorsunuz...
        </p>
        <LoadingSpinner />
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <AuthGuard requireAuth={true} requireEmailVerification={true}>
      <WelcomeContent />
    </AuthGuard>
  )
}
