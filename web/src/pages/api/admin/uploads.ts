/**
 * Admin Uploads API - Simplified to work with Firebase Storage metadata only
 * No Firestore collections, just direct storage operations
 */

import { adminAuth, adminStorage } from '@/lib/firebase-admin'
import { randomUUID } from 'crypto'
import formidable from 'formidable'
import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

// Simple file metadata interface - just what we need for the UI
interface FileMetadata {
  id: string
  name: string
  url: string
  size: number
  contentType: string
  category: string
  createdAt: string
  isImage: boolean
}

export const config = {
  api: {
    bodyParser: false,
  },
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Authentication check for POST and DELETE operations
    if (req.method === 'POST' || req.method === 'DELETE') {
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const token = authHeader.split('Bearer ')[1]
      try {
        const decodedToken = await adminAuth.verifyIdToken(token)
        console.log(
          'Token verified for user:',
          decodedToken.email,
          'Admin:',
          decodedToken.admin
        )
        // Temporarily allow all authenticated users (remove this in production)
        // if (!decodedToken.admin) {
        //   return res.status(403).json({ error: 'Admin privileges required' })
        // }
      } catch (authError) {
        console.error('Authentication error:', authError)
        return res.status(401).json({ error: 'Invalid authentication token' })
      }
    }

    if (req.method === 'POST') {
      return await handleUpload(req, res)
    } else if (req.method === 'GET') {
      return await handleList(req, res)
    } else if (req.method === 'DELETE') {
      return await handleDelete(req, res)
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Admin uploads API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleUpload(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Starting file upload process...')

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    })

    console.log('Parsing form data...')
    const [fields, files] = await form.parse(req)
    const category = Array.isArray(fields.category)
      ? fields.category[0]
      : fields.category || 'general'

    console.log('Form parsed:', {
      category,
      filesCount: Object.keys(files).length,
    })

    const uploadedFiles: FileMetadata[] = []
    const fileArray = Array.isArray(files.files)
      ? files.files
      : [files.files].filter(Boolean)

    console.log('Processing files:', fileArray.length)

    for (const file of fileArray) {
      if (!file) continue

      console.log('Processing file:', file.originalFilename, 'Size:', file.size)

      // Generate unique filename with UUID
      const fileExtension = path.extname(file.originalFilename || '')
      const uniqueId = randomUUID()
      const fileName = `${uniqueId}${fileExtension}`
      const storagePath = `uploads/${category}/${fileName}`

      console.log('Storage path:', storagePath)

      // Upload to Firebase Storage
      const bucket = adminStorage.bucket(
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      )
      const fileUpload = bucket.file(storagePath)

      const fileBuffer = fs.readFileSync(file.filepath)
      console.log('File buffer size:', fileBuffer.length)

      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: file.mimetype || 'application/octet-stream',
          metadata: {
            originalName: file.originalFilename || 'unknown',
            category: category,
            uploadedAt: new Date().toISOString(),
            uniqueId: uniqueId,
          },
        },
      })

      console.log('File uploaded to storage, making public...')

      // Make file publicly readable
      await fileUpload.makePublic()

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`

      console.log('File made public:', publicUrl)

      const isImageFile = (contentType: string): boolean => {
        return contentType.startsWith('image/')
      }

      uploadedFiles.push({
        id: uniqueId,
        name: file.originalFilename || 'unknown',
        url: publicUrl,
        size: file.size || 0,
        contentType: file.mimetype || 'application/octet-stream',
        category: category,
        createdAt: new Date().toISOString(),
        isImage: isImageFile(file.mimetype || 'application/octet-stream'),
      })
    }

    console.log('Upload completed successfully:', uploadedFiles.length, 'files')
    return res.status(200).json(uploadedFiles)
  } catch (error) {
    console.error('Upload error details:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return res
      .status(500)
      .json({ error: 'Upload failed', details: errorMessage })
  }
}

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, search } = req.query

    const bucket = adminStorage.bucket(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    )
    const prefix =
      category && category !== 'general' ? `uploads/${category}/` : 'uploads/'

    const [files] = await bucket.getFiles({ prefix })

    const fileList: FileMetadata[] = []

    for (const file of files) {
      // Skip directories
      if (file.name.endsWith('/')) continue

      try {
        const [metadata] = await file.getMetadata()
        const customMetadata = metadata.metadata || {}

        // Extract category from path if not in metadata
        const pathParts = file.name.split('/')
        const fileCategory = String(
          customMetadata.category ||
            (pathParts.length > 1 ? pathParts[1] : 'general')
        )

        // Filter by category if specified
        if (category && category !== 'general' && fileCategory !== category) {
          continue
        }

        const fileName = String(
          customMetadata.originalName || path.basename(file.name)
        )

        // Filter by search if specified
        if (
          search &&
          !fileName.toLowerCase().includes(String(search).toLowerCase())
        ) {
          continue
        }

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`

        const isImageFile = (contentType: string): boolean => {
          return contentType.startsWith('image/')
        }

        fileList.push({
          id: String(
            customMetadata.uniqueId ||
              path.basename(file.name, path.extname(file.name))
          ),
          name: fileName,
          url: publicUrl,
          size: parseInt(String(metadata.size || '0')),
          contentType: metadata.contentType || 'application/octet-stream',
          category: String(fileCategory),
          createdAt: String(
            customMetadata.uploadedAt ||
              metadata.timeCreated ||
              new Date().toISOString()
          ),
          isImage: isImageFile(
            metadata.contentType || 'application/octet-stream'
          ),
        })
      } catch (error) {
        console.error('Error processing file:', file.name, error)
        // Continue with other files
      }
    }

    // Sort by upload date (newest first)
    fileList.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return res.status(200).json(fileList)
  } catch (error) {
    console.error('List error:', error)
    return res.status(500).json({ error: 'Failed to list files' })
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'File ID is required' })
    }

    const bucket = adminStorage.bucket(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    )

    // Find file by ID in metadata
    const [files] = await bucket.getFiles({ prefix: 'uploads/' })

    for (const file of files) {
      try {
        const [metadata] = await file.getMetadata()
        const customMetadata = metadata.metadata || {}

        if (String(customMetadata.uniqueId) === id) {
          await file.delete()
          return res.status(200).json({ success: true })
        }
      } catch (error) {
        // Continue searching
      }
    }

    return res.status(404).json({ error: 'File not found' })
  } catch (error) {
    console.error('Delete error:', error)
    return res.status(500).json({ error: 'Delete failed' })
  }
}
