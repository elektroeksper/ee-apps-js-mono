import { PublicRoute } from '@/components/auth/AuthGuard'
import BusinessRegisterForm from '@/components/BusinessRegisterForm'
import IndividualRegisterForm from '@/components/IndividualRegisterForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

type AccountType = 'individual' | 'business'

const RegisterPage: React.FC = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [accountType, setAccountType] = useState<AccountType | undefined>(
    undefined
  )

  useEffect(() => {
    if (!router.isReady) return

    const { type } = router.query
    if (type === 'business' || type === 'individual') {
      setAccountType(type as AccountType)
    } else if (type) {
      // Invalid type, redirect to individual
      router.replace('/register?type=individual', undefined, { shallow: true })
      return
    } else {
      // No type parameter, default to individual
      router.push('/register?type=individual', undefined, { shallow: true })
      return
    }
    setIsLoading(false)
  }, [router.isReady, router.query, router])

  if (isLoading || !router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-auth">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <PublicRoute redirectTo="/home">
      <div className="min-h-screen flex items-center justify-center bg-gradient-auth py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 max-w-2xl w-full space-y-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            {accountType === 'business' && <BusinessRegisterForm />}
            {accountType === 'individual' && <IndividualRegisterForm />}
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}

export default RegisterPage
