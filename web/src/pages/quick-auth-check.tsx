import { auth } from '@/config/firebase'
import { useEffect } from 'react'

export default function QuickAuthCheck() {
  useEffect(() => {
    console.log('🔍 Quick Auth Check:')
    console.log('- Auth object:', auth)
    console.log('- Current user:', auth.currentUser)
    console.log('- App name:', auth.app.name)
    console.log('- App options:', auth.app.options)

    // Try to get the current user state immediately
    const user = auth.currentUser
    if (user) {
      console.log('✅ User found:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      })

      // Try to get claims
      user
        .getIdTokenResult()
        .then(result => {
          console.log('✅ Claims loaded:', result.claims)
        })
        .catch(error => {
          console.error('❌ Failed to get claims:', error)
        })
    } else {
      console.log('❌ No user found - you need to log in')
    }
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Quick Auth Check</h1>
      <p>Check the console for authentication status</p>
      <div className="mt-4 space-y-2">
        <p>Current user: {auth.currentUser?.email || 'Not logged in'}</p>
        <p>Email verified: {auth.currentUser?.emailVerified ? 'Yes' : 'No'}</p>
        <a href="/login" className="text-blue-600 hover:underline">
          Go to Login
        </a>
      </div>
    </div>
  )
}
