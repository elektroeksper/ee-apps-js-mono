/**
 * Simple test endpoint to debug storage configuration
 */

import { getStorageBucketName } from '@/lib/storage-config'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🧪 Testing storage configuration...')

    const bucketName = getStorageBucketName()
    console.log('🪣 Storage bucket name:', bucketName)

    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    }
    console.log('🌍 Environment variables:', env)

    return res.status(200).json({
      success: true,
      bucketName,
      env,
    })
  } catch (error: any) {
    console.error('❌ Storage config test error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    })
  }
}