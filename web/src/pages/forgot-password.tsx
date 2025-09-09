import { PublicRoute } from '@/components/auth/AuthGuard'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { useRouter } from 'next/router'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const handleBackToLogin = () => {
    router.push('/login')
  }

  return (
    <PublicRoute redirectTo="/home">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="flex justify-center items-center mb-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="80"
              height="80"
              viewBox="0 0 80 32"
              fill="none"
            >
              <rect width="80" height="32" fill="transparent" />
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#4B5563"
                fontSize="48"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                EE
              </text>
            </svg>
          </div>

          {/* Password Reset Form */}
          <PasswordResetForm onBackToLogin={handleBackToLogin} />
        </div>
      </div>
    </PublicRoute>
  )
}
