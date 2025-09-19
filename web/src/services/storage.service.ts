/**
 * Client-side storage service that uses API routes
 * Implements the IStorageService interface for consistent API
 */

import { DocumentCategory, DocumentFileType, IDocument, IStorageService } from '@/shared-generated/types'

/**
 * Client storage service implementation using API routes
 */
export class StorageClientService implements IStorageService {

  /**
   * Get all documents for a specific user
   */
  async getUserDocuments(userId: string): Promise<IDocument[]> {
    try {
      const response = await fetch('/api/business/documents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch documents`)
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
      throw error instanceof Error ? error : new Error('Failed to fetch user documents')
    }
  }

  /**
   * Upload a new document for a user
   */
  async uploadUserDocument(userId: string, file: File, category: DocumentCategory): Promise<IDocument> {
    try {
      // Convert file to base64 for transmission
      const fileData = await this.fileToBase64(file)

      const response = await fetch('/api/business/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify({
          fileName: file.name,
          category,
          fileData,
          metadata: {
            originalName: file.name,
            uploadedBy: userId,
            size: file.size,
            type: file.type
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to upload document`)
      }

      const result = await response.json()
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error instanceof Error ? error : new Error('Failed to upload document')
    }
  }

  /**
   * Delete a user document
   */
  async deleteUserDocument(userId: string, documentPath: string): Promise<boolean> {
    try {
      // Extract document ID from path or use the documentPath as ID
      const documentId = documentPath.includes('/') ?
        documentPath.split('/').pop() : documentPath

      const response = await fetch(`/api/business/documents?documentId=${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete document`)
      }

      const result = await response.json()
      if (result.success) {
        return true
      } else {
        throw new Error(result.error || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error instanceof Error ? error : new Error('Failed to delete document')
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
      { pattern: /document/i, replacement: 'Belge' }
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
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '')) return 'image'
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
  validateFile(file: File, category: DocumentCategory): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Dosya boyutu 10MB\'ı geçemez' }
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
          return { valid: false, error: 'İşyeri fotoğrafları resim formatında olmalıdır' }
        }
        break
    }

    return { valid: true }
  }

  /**
   * Helper: Convert File to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && typeof window.FileReader !== 'undefined') {
        const reader = new window.FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = error => reject(error)
      } else {
        reject(new Error('FileReader is not available in this environment'))
      }
    })
  }
}

// Export singleton instance
export const storageClientService = new StorageClientService()

// Export convenience functions
export const {
  getUserDocuments,
  getCategoryDisplayName,
  getFileDisplayName
} = storageClientService
