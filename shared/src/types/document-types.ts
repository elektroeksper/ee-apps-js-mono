/**
 * Enhanced shared types for document management
 * Combines with existing DocumentType and DocumentStatus enums
 */

import { BusinessVerificationStatus, DocumentStatus, DocumentType } from '../enums'

// Re-export document-related enums for consistency
export { BusinessVerificationStatus, DocumentStatus, DocumentType }

/**
 * User document interface for storage operations
 * This represents files stored in Firebase Storage for users
 */
export interface UserDocument {
  name: string
  url: string
  type: UserDocumentFileType
  fullPath: string
  category: UserDocumentCategory
  uploadedAt?: string
  updatedAt?: string
  size?: number
  metadata?: Record<string, any>
}

/**
 * File types for user documents (different from business DocumentType enum)
 */
export type UserDocumentFileType = 'pdf' | 'image' | 'other'

/**
 * Categories for organizing user documents
 */
export type UserDocumentCategory =
  | 'business-documents'
  | 'tax-certificates'
  | 'place-photos'
  | 'identity-documents'
  | 'other'

/**
 * Document metadata for business verification
 */
export interface DocumentMetadata {
  originalName: string
  uploadedBy: string
  verificationStatus?: DocumentStatus
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
}

/**
 * Storage service interface - defines what storage operations should be available
 */
export interface IStorageService {
  // User document operations
  getUserDocuments(userId: string): Promise<UserDocument[]>
  uploadUserDocument(userId: string, file: File, category: UserDocumentCategory): Promise<UserDocument>
  deleteUserDocument(userId: string, documentPath: string): Promise<boolean>

  // Document display helpers
  getCategoryDisplayName(category: UserDocumentCategory): string
  getFileDisplayName(fileName: string): string

  // Document verification operations (admin only)
  verifyDocument?(documentPath: string, status: DocumentStatus, notes?: string): Promise<boolean>
}

/**
 * Request/Response interfaces for Firebase Functions
 */
export interface GetUserDocumentsRequest {
  userId: string
}

export interface GetUserDocumentsResponse {
  success: boolean
  data?: UserDocument[]
  error?: string
}

export interface UploadDocumentRequest {
  userId: string
  fileName: string
  category: UserDocumentCategory
  fileData: string // base64 or data URL
  metadata?: DocumentMetadata
}

export interface UploadDocumentResponse {
  success: boolean
  data?: UserDocument
  error?: string
}

export interface DeleteDocumentRequest {
  userId: string
  documentPath: string
}

export interface DeleteDocumentResponse {
  success: boolean
  error?: string
}

/**
 * Helper type for document operations
 */
export interface DocumentOperation {
  type: 'upload' | 'delete' | 'verify'
  userId: string
  documentPath?: string
  category?: UserDocumentCategory
  metadata?: DocumentMetadata
}

/**
 * Business document verification interface
 */
export interface BusinessDocumentReview {
  userId: string
  documents: UserDocument[]
  businessInfo: {
    businessName: string
    ownerName: string
    email: string
    phone?: string
    address?: string
  }
  verificationStatus: BusinessVerificationStatus
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
}
