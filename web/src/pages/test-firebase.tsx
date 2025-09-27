import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import {
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
} from '../config/firebase-client-only'

export default function TestFirebasePage() {
  const [status, setStatus] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addStatus = (message: string) => {
    setStatus(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ])
  }

  // Test emulator connection on mount
  useEffect(() => {
    addStatus('🔧 Testing Firebase client emulator connection...')

    try {
      // Force initialize Firebase app and check emulator connection
      const auth = getFirebaseAuth()
      const db = getFirebaseFirestore()
      const storage = getFirebaseStorage()

      addStatus(`✅ Firebase services initialized`)
      addStatus(`🔍 Auth app options: ${JSON.stringify(auth.app.options)}`)
      addStatus(`🔍 Current user: ${auth.currentUser?.uid || 'none'}`)

      // Check if we're actually connecting to emulators
      const authSettings = (auth as any)._delegate?._config || auth.config
      addStatus(`🔍 Auth settings: ${JSON.stringify(authSettings)}`)
    } catch (error) {
      addStatus(
        `❌ Error initializing Firebase: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }, [])

  const testFirebaseConnection = async () => {
    setLoading(true)
    setStatus([])

    try {
      addStatus('🧪 Testing Firebase emulator connections...')

      // Test Auth
      const auth = getFirebaseAuth()
      addStatus(`✅ Auth service initialized: ${auth.app.options.projectId}`)

      // Test Firestore
      const db = getFirebaseFirestore()
      addStatus(`✅ Firestore service initialized: ${db.app.options.projectId}`)

      // Test Storage
      const storage = getFirebaseStorage()
      addStatus(
        `✅ Storage service initialized: ${storage.app.options.projectId}`
      )

      // Test a simple Firestore write/read
      const testDocRef = doc(db, 'test', 'emulator-test')
      await setDoc(testDocRef, {
        message: 'Hello from emulator!',
        timestamp: new Date(),
      })
      addStatus('✅ Firestore write test successful')

      const testDoc = await getDoc(testDocRef)
      if (testDoc.exists()) {
        addStatus(
          `✅ Firestore read test successful: ${testDoc.data().message}`
        )
      } else {
        addStatus('❌ Firestore read test failed: document not found')
      }

      addStatus('🎉 All Firebase emulator tests passed!')
    } catch (error) {
      addStatus(
        `❌ Error testing Firebase: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setLoading(false)
    }
  }

  const testAuthEmulator = async () => {
    try {
      addStatus('🔐 Testing Auth emulator...')
      const auth = getFirebaseAuth()

      // Try to create a test user
      const testEmail = `test-${Date.now()}@example.com`
      const testPassword = 'testPassword123!'

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        testEmail,
        testPassword
      )
      addStatus(`✅ Test user created: ${userCredential.user.email}`)

      // Sign out and sign back in
      await auth.signOut()
      addStatus('✅ User signed out')

      const signInResult = await signInWithEmailAndPassword(
        auth,
        testEmail,
        testPassword
      )
      addStatus(`✅ User signed in: ${signInResult.user.email}`)

      await auth.signOut()
      addStatus('✅ User signed out again')
      addStatus('🎉 Auth emulator test completed successfully!')
    } catch (error) {
      addStatus(
        `❌ Auth emulator test failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Firebase Emulator Test
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>NEXT_PUBLIC_FIREBASE_EMULATOR:</strong>{' '}
              {process.env.NEXT_PUBLIC_FIREBASE_EMULATOR || 'undefined'}
            </div>
            <div>
              <strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID:</strong>{' '}
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'undefined'}
            </div>
            <div>
              <strong>NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST:</strong>{' '}
              {process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ||
                'undefined'}
            </div>
            <div>
              <strong>NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST:</strong>{' '}
              {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST ||
                'undefined'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testFirebaseConnection}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Firebase Connection'}
            </button>
            <button
              onClick={testAuthEmulator}
              disabled={loading}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Test Auth Emulator
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
            {status.length === 0 ? (
              <p className="text-gray-500 italic">
                No tests run yet. Click a test button above.
              </p>
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
