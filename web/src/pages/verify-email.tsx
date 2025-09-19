/**
 * Legacy verify-email redirect page
 * Redirects to the new auth/verify-email path
 */

import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function LegacyVerifyEmailPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new auth/verify-email path with query params preserved
    const queryString = window.location.search
    router.replace(`/auth/verify-email${queryString}`)
  }, [router])

  // Return null or a loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-success">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
        <p className="mt-4 text-gray-600">Yönlendiriliyor...</p>
      </div>
    </div>
  )
}
