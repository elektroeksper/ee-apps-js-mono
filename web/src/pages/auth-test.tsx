import { auth } from '@/config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function AuthTest() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claims, setClaims] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const refreshAuthToken = async () => {
    if (!user) return

    setRefreshing(true)
    try {
      console.log('🔄 Refreshing auth token...')
      // Force refresh the ID token
      const idTokenResult = await user.getIdTokenResult(true)
      setClaims(idTokenResult.claims)
      console.log('✅ Token refreshed! New claims:', idTokenResult.claims)
    } catch (error) {
      console.error('❌ Failed to refresh token:', error)
      setError('Failed to refresh auth token')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    console.log('Setting up auth state listener...')
    const unsubscribe = onAuthStateChanged(
      auth,
      async user => {
        console.log('Auth state changed:', user)
        setUser(user)

        if (user) {
          try {
            const idTokenResult = await user.getIdTokenResult()
            setClaims(idTokenResult.claims)
            console.log('Current claims:', idTokenResult.claims)
          } catch (error) {
            console.error('Failed to get claims:', error)
          }
        } else {
          setClaims(null)
        }

        setLoading(false)
      },
      error => {
        console.error('Auth error:', error)
        setError(error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Auth Test - Loading...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Results</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Current User:</h2>
        {user ? (
          <div>
            <p>
              <strong>UID:</strong> {user.uid}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Display Name:</strong> {user.displayName}
            </p>
            <p>
              <strong>Email Verified:</strong>{' '}
              {user.emailVerified ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Provider:</strong> {user.providerData?.[0]?.providerId}
            </p>
          </div>
        ) : (
          <p className="text-red-600">No user signed in</p>
        )}
      </div>

      {user && (
        <div className="bg-blue-50 p-4 rounded mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Firebase Auth Claims:</h2>
            <button
              onClick={refreshAuthToken}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Token'}
            </button>
          </div>
          {claims ? (
            <div>
              <p>
                <strong>Admin:</strong> {claims.admin ? 'Yes ✅' : 'No ❌'}
              </p>
              <p>
                <strong>Roles:</strong>{' '}
                {claims.roles ? JSON.stringify(claims.roles) : 'None'}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">
                  All Claims (click to expand)
                </summary>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                  {JSON.stringify(claims, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p>No claims available</p>
          )}
        </div>
      )}

      {user && claims?.admin && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
          <p className="text-green-700 font-semibold">
            🎉 You have admin access!
          </p>
          <p className="text-green-600">
            You can now access the admin dashboard:
          </p>
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-600 hover:underline font-medium"
          >
            Go to Admin Dashboard →
          </button>
        </div>
      )}

      {!user && (
        <div className="mt-4">
          <p className="mb-2">You need to sign in first. Go to:</p>
          <a href="/login" className="text-blue-600 hover:underline">
            /login
          </a>
        </div>
      )}
    </div>
  )
}
