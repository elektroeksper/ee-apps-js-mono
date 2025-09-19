import { auth } from '@/config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'

export default function AuthDebug() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [claims, setClaims] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [listenerFired, setListenerFired] = useState(false)
  const [listenerCount, setListenerCount] = useState(0)

  useEffect(() => {
    console.log('🔍 AuthDebug: Starting auth debugging...')
    console.log('🔍 AuthDebug: Initial auth.currentUser:', auth.currentUser)

    // Check immediate state
    if (auth.currentUser) {
      console.log('🔍 AuthDebug: User found immediately:', {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified,
      })
    } else {
      console.log('🔍 AuthDebug: No user found immediately')
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async user => {
        setListenerCount(prev => prev + 1)
        setListenerFired(true)
        console.log(
          `🔍 AuthDebug: onAuthStateChanged fired (${listenerCount + 1}):`,
          {
            user: user?.email || 'null',
            uid: user?.uid || 'null',
          }
        )

        setCurrentUser(user)

        if (user) {
          try {
            const idTokenResult = await user.getIdTokenResult()
            setClaims(idTokenResult.claims)
            console.log('🔍 AuthDebug: Claims loaded:', idTokenResult.claims)
          } catch (error) {
            console.error('🔍 AuthDebug: Failed to get claims:', error)
            setClaims(null)
          }
        } else {
          setClaims(null)
        }

        setLoading(false)
      },
      error => {
        console.error('🔍 AuthDebug: Auth error:', error)
        setLoading(false)
      }
    )

    // Also check auth state after a delay
    setTimeout(() => {
      console.log(
        '🔍 AuthDebug: Delayed check - auth.currentUser:',
        auth.currentUser
      )
    }, 1000)

    return () => {
      console.log('🔍 AuthDebug: Cleaning up listener')
      unsubscribe()
    }
  }, [])

  const handleManualRefresh = async () => {
    console.log('🔍 AuthDebug: Manual refresh triggered')
    const user = auth.currentUser
    console.log('🔍 AuthDebug: Manual check - current user:', user)

    if (user) {
      try {
        await user.reload()
        const idTokenResult = await user.getIdTokenResult(true) // Force refresh
        console.log(
          '🔍 AuthDebug: Manually refreshed claims:',
          idTokenResult.claims
        )
        setClaims(idTokenResult.claims)
      } catch (error) {
        console.error('🔍 AuthDebug: Manual refresh failed:', error)
      }
    }
  }

  const handleForceSignOut = async () => {
    try {
      await auth.signOut()
      console.log('🔍 AuthDebug: Force sign out completed')
    } catch (error) {
      console.error('🔍 AuthDebug: Force sign out failed:', error)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Auth State</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Listener fired:</strong> {listenerFired ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Listener count:</strong> {listenerCount}
            </p>
            <p>
              <strong>Current user (from state):</strong>{' '}
              {currentUser?.email || 'None'}
            </p>
            <p>
              <strong>Current user (direct):</strong>{' '}
              {auth.currentUser?.email || 'None'}
            </p>
            <p>
              <strong>Email verified:</strong>{' '}
              {currentUser?.emailVerified ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>UID:</strong> {currentUser?.uid || 'None'}
            </p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Claims</h2>
          <div className="space-y-2 text-sm">
            {claims ? (
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(claims, null, 2)}
              </pre>
            ) : (
              <p>No claims loaded</p>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Auth Object</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>App name:</strong> {auth.app.name}
            </p>
            <p>
              <strong>Project ID:</strong> {auth.app.options.projectId}
            </p>
            <p>
              <strong>Auth domain:</strong> {auth.app.options.authDomain}
            </p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleManualRefresh}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Manual Refresh
            </button>
            <button
              onClick={handleForceSignOut}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Force Sign Out
            </button>
            <button
              onClick={() => (window.location.href = '/login')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Go to Login
            </button>
            <button
              onClick={() => (window.location.href = '/admin')}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Test Admin Access
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-yellow-700">
          <li>Open browser console (F12) to see detailed logs</li>
          <li>Check if the auth state listener fires</li>
          <li>
            Compare "Current user (from state)" vs "Current user (direct)"
          </li>
          <li>If they differ, there's a listener issue</li>
          <li>
            If both are null but you think you're logged in, check login state
          </li>
        </ol>
      </div>
    </div>
  )
}
