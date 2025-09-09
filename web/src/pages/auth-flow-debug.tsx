'use client'

/**
 * Debug page to test the complete auth flow:
 * AuthContext -> useUser -> AuthGuard -> Admin check
 */

import { AuthGuard } from '@/components/auth'
import { auth } from '@/config/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

function FirebaseDirectDebug() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null)
  const [firebaseLoading, setFirebaseLoading] = useState(true)

  useEffect(() => {
    console.log('🔥 Setting up direct Firebase auth listener')
    const unsubscribe = auth.onAuthStateChanged(user => {
      console.log(
        '🔥 Direct Firebase auth state changed:',
        user?.email || 'null'
      )
      setFirebaseUser(user)
      setFirebaseLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <div className="p-4 border border-red-200 rounded bg-red-50">
      <h3 className="font-bold text-red-800">Direct Firebase Auth Data</h3>
      <pre className="text-xs bg-white p-2 rounded mt-2">
        {JSON.stringify(
          {
            user: firebaseUser?.email || 'null',
            loading: firebaseLoading,
            uid: firebaseUser?.uid || 'null',
          },
          null,
          2
        )}
      </pre>
    </div>
  )
}

function AuthContextDebug() {
  const authContext = useAuth()

  useEffect(() => {
    console.log('🔍 Direct AuthContext Data:', {
      appUser: authContext.appUser?.email,
      isAdmin: authContext.isAdmin,
      userRoles: authContext.userRoles,
      isLoading: authContext.isLoading,
    })
  }, [authContext])

  return (
    <div className="p-4 border border-blue-200 rounded bg-blue-50">
      <h3 className="font-bold text-blue-800">Direct AuthContext Data</h3>
      <pre className="text-xs bg-white p-2 rounded mt-2">
        {JSON.stringify(
          {
            appUser: authContext.appUser?.email || 'null',
            isAdmin: authContext.isAdmin,
            userRoles: authContext.userRoles,
            isLoading: authContext.isLoading,
          },
          null,
          2
        )}
      </pre>
    </div>
  )
}

function AuthGuardTest() {
  return (
    <div className="space-y-4">
      {/* Non-admin test */}
      <AuthGuard requireAuth={false}>
        <div className="p-4 border border-green-200 rounded bg-green-50">
          <h3 className="font-bold text-green-800">
            ✅ Basic AuthGuard Test Passed
          </h3>
          <p className="text-green-600">
            No auth required - should always work
          </p>
        </div>
      </AuthGuard>

      {/* Admin test */}
      <AuthGuard requireAuth={true} requireAdmin={true}>
        <div className="p-4 border border-purple-200 rounded bg-purple-50">
          <h3 className="font-bold text-purple-800">
            ✅ Admin AuthGuard Test Passed
          </h3>
          <p className="text-purple-600">
            If you see this, AuthGuard allowed admin access!
          </p>
        </div>
      </AuthGuard>
    </div>
  )
}

export default function AuthFlowDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Auth Flow Debug</h1>
        <p className="text-gray-600">
          Testing the complete authentication flow step by step
        </p>

        <div className="space-y-4">
          <FirebaseDirectDebug />
          <AuthContextDebug />
          <AuthGuardTest />
        </div>

        <div className="mt-8 p-4 border border-yellow-200 rounded bg-yellow-50">
          <h3 className="font-bold text-yellow-800">Expected Flow:</h3>
          <ol className="text-yellow-700 text-sm mt-2 list-decimal list-inside">
            <li>AuthContext should show admin claims and isAdmin: true</li>
            <li>useUser should reflect the same admin status</li>
            <li>AuthGuard should allow access and show the success message</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
