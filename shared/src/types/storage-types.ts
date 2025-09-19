/**
 * Enhanced shared types for document management
 * Combines with existing DocumentType and DocumentStatus enums
 */
import { Timestamp } from 'firebase/firestore'

import { BusinessVerificationStatus, StorageDocumentStatus, StorageDocumentType } from '../enums'

// Re-export document-related enums for consistency
export { BusinessVerificationStatus, StorageDocumentStatus, StorageDocumentType }

/**
 * User document interface for storage operations
 * This represents files stored in Firebase Storage for users
 */

/**
 * File types for user documents (different from business DocumentType enum)
 */
export type DocumentFileType = 'pdf' | 'image' | 'other'

/**
 * Categories for organizing user documents
 */
export type DocumentCategory =
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
  verificationStatus?: StorageDocumentStatus
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
  size?: number // File size in bytes
  [key: string]: any // Allow additional metadata fields
}

/**
 * Storage service interface - defines what storage operations should be available
 */
export interface IStorageService {
  // User document operations
  getUserDocuments(userId: string): Promise<IDocument[]>
  uploadUserDocument(userId: string, file: File, category: DocumentCategory): Promise<IDocument>
  deleteUserDocument(userId: string, documentPath: string): Promise<boolean>

  // Document display helpers
  getCategoryDisplayName(category: DocumentCategory): string
  getFileDisplayName(fileName: string): string

  // Document verification operations (admin only)
  verifyDocument?(documentPath: string, status: StorageDocumentStatus, notes?: string): Promise<boolean>
}


export interface IDocument {
  type: StorageDocumentType;
  name?: string; // Original file name
  url: string; // Storage URL or public URL
  uploadedAt: Timestamp | Date | string;
  uploadedBy: string; // User ID who uploaded
  status: StorageDocumentStatus;
  fullPath?: string; // Full storage path
  fileType: DocumentFileType; // e.g. 'pdf', 'image', 'other'
  category: DocumentCategory; // e.g. 'business-documents', 'identity-documents'
  metadata?: DocumentMetadata; // Additional metadata
  reviewedAt?: Timestamp | Date | string;
  reviewedBy?: string; // Admin user ID who reviewed
  rejectionReason?: string; // Reason if rejected
  expiresAt?: Timestamp; // Optional expiration date
}

/**
 * Request/Response interfaces for Firebase Functions
 */
export interface GetUserDocumentsRequest {
  userId: string
}

export interface GetUserDocumentsResponse {
  success: boolean
  data?: IDocument[]
  error?: string
}

export interface UploadDocumentRequest {
  userId: string
  fileName: string
  category: DocumentCategory
  fileData: string // base64 or data URL
  metadata?: DocumentMetadata
}

export interface UploadDocumentResponse {
  success: boolean
  data?: IDocument
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
  category?: DocumentCategory
  metadata?: DocumentMetadata
}
