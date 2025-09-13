'use client'

import { LoginForm } from '@/components/auth'
import { PublicRoute } from '@/components/auth/AuthGuard'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const router = useRouter()
  const accountType =
    (router.query.type as 'individual' | 'business') || 'individual'

  const handleLoginSuccess = () => {
    // Redirect to home page after successful login
    router.push('/home')
  }

  const handleRegisterClick = () => {
    router.push(`/register?type=${accountType}`)
  }

  const handleForgotPasswordClick = () => {
    router.push('/forgot-password')
  }

  return (
    <PublicRoute redirectTo="/home">
      <div className="min-h-screen flex items-center justify-center bg-gradient-auth py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-md w-full space-y-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            {/* Logo */}
            <div className="flex justify-center items-center mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-xl shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 80 32"
                  fill="none"
                >
                  <rect width="80" height="32" fill="transparent" />
                  <text
                    x="50%"
                    y="50%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="white"
                    fontSize="32"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                  >
                    EE
                  </text>
                </svg>
              </div>
            </div>
            <LoginForm
              accountType={accountType}
              onSuccess={handleLoginSuccess}
              onRegisterClick={handleRegisterClick}
              onForgotPasswordClick={handleForgotPasswordClick}
            />
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}
