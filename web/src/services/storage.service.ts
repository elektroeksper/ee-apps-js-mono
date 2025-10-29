/**
 * Client-side storage service that uses API routes
 * Implements the IStorageService interface for consistent API
 */

import {
  DocumentCategory,
  DocumentFileType,
  IDocument,
  IStorageService,
} from '@/shared/types'
import { authService } from './auth.service'

/**
 * Client storage service implementation using API routes
 */
export class StorageClientService implements IStorageService {
  /**
   * Get all documents for a specific user
   */
  async getUserDocuments(userId: string): Promise<IDocument[]> {
    try {
      // Get ID token for authentication
      const idToken = await authService.getIdToken(true)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`
      }

      const response = await fetch('/api/business/documents', {
        method: 'GET',
        headers,
        credentials: 'include', // Include session cookies
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error ||
          `HTTP ${response.status}: Failed to fetch documents`
        )
      }

      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        console.error('Failed to fetch documents:', result.error)
        throw new Error(result.error || 'Failed to fetch documents')
      }
    } catch (error) {
      console.error('Error fetching user documents:', error)
      throw error instanceof Error
        ? error
        : new Error('Failed to fetch user documents')
    }
  }

  /**
   * Upload a new document for a user
   */
  async uploadUserDocument(
    userId: string,
    file: File,
    category: DocumentCategory
  ): Promise<IDocument> {
    try {
      // Compress images to reduce payload size (client-side only)
      let fileToUpload = file
      let compressionAttempted = false

      if (this.isImageFile(file.name) && typeof window !== 'undefined') {
        const originalSizeMB = (file.size / 1024 / 1024).toFixed(2)

        if (category === 'place-photos') {
          console.log(`🔄 Compressing place photo: ${file.name} (${originalSizeMB}MB)`)
          compressionAttempted = true
          fileToUpload = await this.compressImage(file, 800) // 800KB limit for place photos
        } else {
          // Other image categories - larger limit
          console.log(`🔄 Compressing image: ${file.name} (${originalSizeMB}MB)`)
          compressionAttempted = true
          fileToUpload = await this.compressImage(file, 1000) // 1MB limit for other images
        }

        if (compressionAttempted && fileToUpload.size !== file.size) {
          const compressedSizeMB = (fileToUpload.size / 1024 / 1024).toFixed(2)
          console.log(`✅ Compressed from ${originalSizeMB}MB to ${compressedSizeMB}MB`)
        }
      }

      // Convert file to base64 for transmission
      const fileData = await this.fileToBase64(fileToUpload)

      // Get ID token for authentication
      const idToken = await authService.getIdToken(true) // Force refresh

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`
      }

      const response = await fetch('/api/business/documents', {
        method: 'POST',
        headers,
        credentials: 'include', // Include session cookies
        body: JSON.stringify({
          fileName: fileToUpload.name,
          category,
          fileData,
          metadata: {
            originalName: file.name,
            uploadedBy: userId,
            size: fileToUpload.size,
            type: fileToUpload.type,
            originalSize: file.size,
            compressed: compressionAttempted && fileToUpload.size !== file.size,
            environment: typeof window !== 'undefined' ? 'client' : 'server',
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error ||
          `HTTP ${response.status}: Failed to upload document`
        )
      }

      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error instanceof Error
        ? error
        : new Error('Failed to upload document')
    }
  }

  /**
   * Delete a user document
   */
  async deleteUserDocument(
    userId: string,
    documentPath: string
  ): Promise<boolean> {
    try {
      // Get ID token for authentication
      const idToken = await authService.getIdToken(true)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`
      }

      const response = await fetch(
        `/api/business/documents?documentPath=${encodeURIComponent(documentPath)}`,
        {
          method: 'DELETE',
          headers,
          credentials: 'include', // Include session cookies
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error ||
          `HTTP ${response.status}: Failed to delete document`
        )
      }

      const result = await response.json()
      if (result.success) {
        return true
      } else {
        throw new Error(result.error || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error instanceof Error
        ? error
        : new Error('Failed to delete document')
    }
  }

  /**
   * Get user-friendly display name for document categories
   */
  getCategoryDisplayName(category: DocumentCategory): string {
    switch (category) {
      case 'business-documents':
        return 'İşletme Belgeleri'
      case 'tax-certificates':
        return 'Vergi Belgeleri'
      case 'place-photos':
        return 'İşyeri Fotoğrafları'
      case 'identity-documents':
        return 'Kimlik Belgeleri'
      default:
        return 'Diğer Belgeler'
    }
  }

  /**
   * Get file display name (remove extensions and format nicely)
   */
  getFileDisplayName(fileName: string): string {
    // Remove extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')

    // Replace common patterns with readable names
    const patterns = [
      { pattern: /trade.?registry/i, replacement: 'Ticaret Sicil Belgesi' },
      { pattern: /tax.?certificate/i, replacement: 'Vergi Levhası' },
      { pattern: /identity/i, replacement: 'Kimlik Belgesi' },
      { pattern: /license/i, replacement: 'Ruhsat Belgesi' },
      { pattern: /authority/i, replacement: 'Yetki Belgesi' },
      { pattern: /photo/i, replacement: 'Fotoğraf' },
      { pattern: /document/i, replacement: 'Belge' },
    ]

    for (const { pattern, replacement } of patterns) {
      if (pattern.test(nameWithoutExt)) {
        return replacement
      }
    }

    // If no pattern matches, return formatted filename
    return nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
  }

  /**
   * Get file type based on extension
   */
  getFileType(fileName: string): DocumentFileType {
    const extension = fileName.toLowerCase().split('.').pop()

    if (extension === 'pdf') return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || ''))
      return 'image'
    return 'other'
  }

  /**
   * Check if a file is an image
   */
  isImageFile(fileName: string): boolean {
    return this.getFileType(fileName) === 'image'
  }

  /**
   * Check if a file is a PDF
   */
  isPdfFile(fileName: string): boolean {
    return this.getFileType(fileName) === 'pdf'
  }

  /**
   * Get appropriate icon class for file type
   */
  getFileIconClass(fileName: string): string {
    const type = this.getFileType(fileName)
    switch (type) {
      case 'pdf':
        return 'text-red-500'
      case 'image':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  /**
   * Validate file for upload
   */
  validateFile(
    file: File,
    category: DocumentCategory
  ): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: "Dosya boyutu 10MB'ı geçemez" }
    }

    // Check file type
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
    const extension = file.name.toLowerCase().split('.').pop()
    if (!extension || !allowedTypes.includes(extension)) {
      return { valid: false, error: 'Desteklenmeyen dosya formatı' }
    }

    // Category-specific validations
    switch (category) {
      case 'business-documents':
      case 'tax-certificates':
      case 'identity-documents':
        // These should preferably be PDFs but images are allowed
        break
      case 'place-photos':
        // These should be images
        if (this.getFileType(file.name) !== 'image') {
          return {
            valid: false,
            error: 'İşyeri fotoğrafları resim formatında olmalıdır',
          }
        }
        break
    }

    return { valid: true }
  }

  /**
   * Compress image if it's too large (client-side only)
   */
  async compressImage(file: File, maxSizeKB: number = 500): Promise<File> {
    return new Promise((resolve) => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.warn('Image compression not available in server environment, using original file')
        resolve(file)
        return
      }

      if (!this.isImageFile(file.name)) {
        resolve(file) // Not an image, return as-is
        return
      }

      // Check if file is already small enough
      if (file.size <= maxSizeKB * 1024) {
        resolve(file) // Already small enough, no compression needed
        return
      }

      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        if (!ctx) {
          console.warn('Canvas context not available, using original file')
          resolve(file)
          return
        }

        img.onload = () => {
          try {
            // Calculate new dimensions (max 1920x1080 for place photos)
            let { width, height } = img
            const maxDimension = 1920

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height * maxDimension) / width
                width = maxDimension
              } else {
                width = (width * maxDimension) / height
                height = maxDimension
              }
            }

            canvas.width = width
            canvas.height = height

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height)

            // Start with quality 0.8 and reduce if needed
            let quality = 0.8
            const tryCompress = () => {
              canvas.toBlob(
                (blob) => {
                  if (blob && blob.size <= maxSizeKB * 1024) {
                    // Size is acceptable
                    const compressedFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    })
                    resolve(compressedFile)
                  } else if (quality > 0.1) {
                    // Try with lower quality
                    quality -= 0.1
                    tryCompress()
                  } else {
                    // Can't compress further, return original
                    console.warn('Could not compress image to target size, using original')
                    resolve(file)
                  }
                },
                'image/jpeg',
                quality
              )
            }
            tryCompress()
          } catch (compressionError) {
            console.error('Error during image compression:', compressionError)
            resolve(file)
          }
        }

        img.onerror = () => {
          console.error('Error loading image for compression')
          resolve(file)
        }

        img.src = URL.createObjectURL(file)
      } catch (error) {
        console.error('Error setting up image compression:', error)
        resolve(file)
      }
    })
  }

  /**
   * Convert file to base64 string for API uploads
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (
        typeof window !== 'undefined' &&
        typeof window.FileReader !== 'undefined'
      ) {
        const reader = new window.FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = error => reject(error)
      } else {
        reject(new Error('FileReader is not available in this environment'))
      }
    })
  }

  // Interface compliance methods (aliases for existing methods)
  async getDocuments(userId?: string): Promise<IDocument[]> {
    if (!userId) return []
    return this.getUserDocuments(userId)
  }

  async uploadDocument(
    userId: string,
    file: File,
    category: DocumentCategory
  ): Promise<IDocument> {
    return this.uploadUserDocument(userId, file, category)
  }

  async deleteDocument(userId: string, documentId: string): Promise<boolean> {
    return this.deleteUserDocument(userId, documentId)
  }
}

// Export singleton instance
export const storageClientService = new StorageClientService()

// Export convenience functions
export const { getUserDocuments, getCategoryDisplayName, getFileDisplayName } =
  storageClientService
