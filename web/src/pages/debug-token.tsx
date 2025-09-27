/**
 * Debug page to test admin token and claims
 */

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

// This page requires authentication and dynamic content, so it should not be statically generated
export async function getServerSideProps() {
  return {
    props: {},
  }
}

export default function DebugTokenPage() {
  const { fireUser, isAuthLoading } = useAuth()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testToken = async () => {
    if (!fireUser) {
      alert('No user logged in')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      console.log('🔍 Getting fresh token...')

      // Cast to access getIdToken method
      const firebaseUser = fireUser as any
      const token = await firebaseUser.getIdToken(true) // Force refresh

      console.log('✅ Token obtained, testing API...')

      // Test the token with our debug endpoint
      const response = await fetch('/api/admin/test-token', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      console.log('API Response:', result)
      setResults({
        status: response.status,
        response: result,
        token: token.substring(0, 50) + '...',
        timestamp: new Date().toISOString(),
      })

      // Also test the actual stats API
      console.log('🔍 Testing stats API...')
      const statsResponse = await fetch('/api/admin/stats', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const statsResult = await statsResponse.json()
      console.log('Stats API Response:', statsResult)

      setResults((prev: any) => ({
        ...prev,
        statsTest: {
          status: statsResponse.status,
          response: statsResult,
        },
      }))
    } catch (error) {
      console.error('Error testing token:', error)
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  if (isAuthLoading) {
    return <div className="p-8">Loading auth...</div>
  }

  if (!fireUser) {
    return <div className="p-8">Please log in first</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Token Debug</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Current User</h2>
        <p>Email: {fireUser.uid}</p>
        <p>UID: {fireUser.uid}</p>
      </div>

      <button
        onClick={testToken}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Admin Token'}
      </button>

      {results && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h2 className="font-semibold mb-2">Test Results</h2>
          <pre className="bg-black text-green-400 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h2 className="font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>
            Click "Test Admin Token" to get a fresh token and test the API
          </li>
          <li>Check the browser console for detailed logs</li>
          <li>Look at the server terminal for API debug logs</li>
          <li>
            The results will show both token verification and admin access
          </li>
        </ol>
      </div>
    </div>
  )
}
