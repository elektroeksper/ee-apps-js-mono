import { signOut } from 'firebase/auth'
import { useState } from 'react'
import { getFirebaseAuth } from '../config/firebase-client-only'

export default function ResetAuthPage() {
  const [status, setStatus] = useState<string[]>([])

  const addStatus = (message: string) => {
    setStatus(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ])
  }

  const clearAllAuthData = async () => {
    try {
      addStatus('🧹 Starting complete auth reset...')

      // 1. Sign out from Firebase Auth
      const auth = getFirebaseAuth()
      await signOut(auth)
      addStatus('✅ Signed out from Firebase Auth')

      // 2. Clear all localStorage
      localStorage.clear()
      addStatus('✅ Cleared localStorage')

      // 3. Clear all sessionStorage
      sessionStorage.clear()
      addStatus('✅ Cleared sessionStorage')

      // 4. Clear all cookies
      document.cookie.split(';').forEach(c => {
        const eqPos = c.indexOf('=')
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
        document.cookie =
          name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
        document.cookie =
          name +
          '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' +
          window.location.hostname
        document.cookie =
          name +
          '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' +
          window.location.hostname
      })
      addStatus('✅ Cleared all cookies')

      // 5. Clear IndexedDB (Firebase Auth cache)
      if ('indexedDB' in window && indexedDB.deleteDatabase) {
        try {
          await indexedDB.deleteDatabase('firebaseLocalStorageDb')
          addStatus('✅ Cleared Firebase IndexedDB')
        } catch (e) {
          addStatus('⚠️ Could not clear IndexedDB (may not exist)')
        }
      }

      addStatus('🎉 Complete auth reset successful!')
      addStatus('🔄 Please refresh the page or navigate to login')
    } catch (error) {
      addStatus(
        `❌ Error during auth reset: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const checkCurrentAuthState = async () => {
    try {
      addStatus('🔍 Checking current auth state...')

      const auth = getFirebaseAuth()
      const user = auth.currentUser

      if (user) {
        addStatus(`👤 Current user: ${user.email} (UID: ${user.uid})`)
      } else {
        addStatus('👤 No current user')
      }

      // Check localStorage
      const localStorageKeys = Object.keys(localStorage).filter(
        key =>
          key.includes('firebase') ||
          key.includes('auth') ||
          key.includes('user')
      )
      addStatus(
        `📦 localStorage keys: ${localStorageKeys.length > 0 ? localStorageKeys.join(', ') : 'none'}`
      )

      // Check sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage).filter(
        key =>
          key.includes('firebase') ||
          key.includes('auth') ||
          key.includes('user')
      )
      addStatus(
        `📦 sessionStorage keys: ${sessionStorageKeys.length > 0 ? sessionStorageKeys.join(', ') : 'none'}`
      )

      // Check cookies
      const cookies = document.cookie
        .split(';')
        .map(c => c.trim().split('=')[0])
        .filter(
          name =>
            name.includes('firebase') ||
            name.includes('auth') ||
            name.includes('session')
        )
      addStatus(
        `🍪 Auth cookies: ${cookies.length > 0 ? cookies.join(', ') : 'none'}`
      )
    } catch (error) {
      addStatus(
        `❌ Error checking auth state: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Reset Authentication
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Reset Actions</h2>
          <p className="text-gray-600 mb-4">
            Use these tools to resolve authentication issues and user ID
            mismatches.
          </p>
          <div className="space-x-4">
            <button
              onClick={checkCurrentAuthState}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Check Auth State
            </button>
            <button
              onClick={clearAllAuthData}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Clear All Auth Data
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Status Log</h2>
          <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
            {status.length === 0 ? (
              <p className="text-gray-500 italic">No actions performed yet.</p>
            ) : (
              <div className="space-y-1">
                {status.map((message, index) => (
                  <div key={index} className="font-mono text-sm">
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
