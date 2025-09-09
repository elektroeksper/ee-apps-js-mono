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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <PublicRoute redirectTo="/home">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          {accountType === 'business' && <BusinessRegisterForm />}
          {accountType === 'individual' && <IndividualRegisterForm />}
        </div>
      </div>
    </PublicRoute>
  )
}

export default RegisterPage
