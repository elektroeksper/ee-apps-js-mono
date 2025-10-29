/**
 * Diagnostic API to check Firebase Admin configuration and service account
 * This helps debug storage permission issues
 */

import { adminAuth, adminStorage } from '@/lib/firebase-admin'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🔍 Diagnosing Firebase Admin configuration...')

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        cwd: process.cwd(),
      },
      serviceAccount: {
        detected: 'unknown',
        method: 'unknown',
        projectId: 'unknown',
        storageBucket: 'unknown',
      },
      storageTest: {
        canAccessBucket: false,
        canListFiles: false,
        error: null,
      }
    }

    // Try to get service account info
    try {
      const app = adminAuth.app
      const options = app.options as any

      if (options.credential) {
        const credential = options.credential as any
        if (credential.certificate) {
          diagnostics.serviceAccount.detected = credential.certificate.client_email || 'certificate-present'
          diagnostics.serviceAccount.method = 'service-account-file'
        } else {
          diagnostics.serviceAccount.method = 'application-default-credentials'
        }
      }

      diagnostics.serviceAccount.projectId = options.projectId || 'unknown'
      diagnostics.serviceAccount.storageBucket = options.storageBucket || 'unknown'
    } catch (credError) {
      console.error('Error getting service account info:', credError)
      diagnostics.serviceAccount.error = credError.message
    }

    // Test storage access
    try {
      const bucket = adminStorage.bucket()

      // Test 1: Check if bucket exists
      const [exists] = await bucket.exists()
      diagnostics.storageTest.canAccessBucket = exists

      if (exists) {
        // Test 2: Try to list files (minimal)
        const [files] = await bucket.getFiles({ maxResults: 1 })
        diagnostics.storageTest.canListFiles = true
      }
    } catch (storageError) {
      console.error('Storage test error:', storageError)
      diagnostics.storageTest.error = storageError.message
    }

    console.log('📊 Diagnostics complete:', diagnostics)

    return res.status(200).json({
      success: true,
      diagnostics
    })

  } catch (error: any) {
    console.error('❌ Diagnostic error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    })
  }
}