import { AuthGuard } from '@/components/auth/AuthGuard'
import BusinessDashboard from '@/components/business/BusinessDashboard'
import { useEffect } from 'react'

export default function BusinessDashboardPage() {
  useEffect(() => {
    console.log('📊 Business Dashboard Page loaded')
  }, [])

  return (
    <AuthGuard>
      <BusinessDashboard />
    </AuthGuard>
  )
}
