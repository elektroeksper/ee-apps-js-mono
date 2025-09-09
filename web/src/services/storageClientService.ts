/**
 * Client-side storage service that consumes Firebase Functions
 * Implements the IStorageService interface for consistent API
 */

import { functions } from '@/config/firebase'
import {
  DeleteDocumentResponse,
  GetUserDocumentsResponse,
  IStorageService,
  UploadDocumentResponse,
  UserDocument,
  UserDocumentCategory,
  UserDocumentFileType
} from '@/shared-generated'
import { httpsCallable } from 'firebase/functions'

/**
 * Client storage service implementation
 */
export class StorageClientService implements IStorageService {

  /**
   * Get all documents for a specific user
   */
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    try {
      const getUserDocumentsFunction = httpsCallable(functions, 'getUserDocuments')
      const result = await getUserDocumentsFunction({ userId })

      const response = result.data as GetUserDocumentsResponse
      if (response.success && response.data) {
        return response.data
      } else {
        console.error('Failed to fetch documents:', response.error)
        throw new Error(response.error || 'Failed to fetch documents')
      }
    } catch (error) {
      console.error('Error fetching user documents:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch user documents')
    }
  }

  /**
   * Upload a new document for a user
   */
  async uploadUserDocument(userId: string, file: File, category: UserDocumentCategory): Promise<UserDocument> {
    try {
      // Convert file to base64 for transmission
      const fileData = await this.fileToBase64(file)

      const uploadDocumentFunction = httpsCallable(functions, 'uploadUserDocument')
      const result = await uploadDocumentFunction({
        userId,
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

      const response = result.data as UploadDocumentResponse
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error instanceof Error ? error : new Error('Failed to upload document')
    }
  }

  /**
   * Delete a user document
   * TODO: Implement when delete function is available
   */
  async deleteUserDocument(userId: string, documentPath: string): Promise<boolean> {
    try {
      const deleteDocumentFunction = httpsCallable(functions, 'deleteUserDocument')
      const result = await deleteDocumentFunction({ userId, documentPath })

      const response = result.data as DeleteDocumentResponse
      if (response.success) {
        return true
      } else {
        throw new Error(response.error || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error instanceof Error ? error : new Error('Failed to delete document')
    }
  }

  /**
   * Get user-friendly display name for document categories
   */
  getCategoryDisplayName(category: UserDocumentCategory): string {
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
  getFileType(fileName: string): UserDocumentFileType {
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
  validateFile(file: File, category: UserDocumentCategory): { valid: boolean; error?: string } {
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
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
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
