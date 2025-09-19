/**
 * Business Document Service
 * Handles business document upload, retrieval, and management operations
 * Uses Next.js API routes for server-side operations
 */

import { IOperationResult, UserDocument, UserDocumentCategory } from '@/shared-generated';

export interface BusinessDocumentService {
  getDocuments(): Promise<IOperationResult<UserDocument[]>>;
  uploadDocument(file: File, category: UserDocumentCategory, metadata?: any): Promise<IOperationResult<UserDocument>>;
  deleteDocument(documentId: string): Promise<IOperationResult<void>>;
}

class BusinessDocumentServiceImpl implements BusinessDocumentService {
  /**
   * Get all business documents for the current user
   */
  async getDocuments(): Promise<IOperationResult<UserDocument[]>> {
    try {
      const response = await fetch('/api/business/documents', {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch documents',
          code: response.status
        };
      }

      return {
        success: true,
        data: result.data || [],
        code: 200
      };
    } catch (error: any) {
      console.error('Error fetching business documents:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch documents',
        code: 500
      };
    }
  }

  /**
   * Upload a new business document
   */
  async uploadDocument(
    file: File,
    category: UserDocumentCategory,
    metadata?: any
  ): Promise<IOperationResult<UserDocument>> {
    try {
      // Validate file
      if (!file) {
        return {
          success: false,
          error: 'File is required',
          code: 400
        };
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size exceeds 10MB limit',
          code: 413
        };
      }

      // Convert file to base64
      const fileData = await this.fileToBase64(file);

      const requestBody = {
        fileName: file.name,
        category,
        fileData,
        metadata
      };

      const response = await fetch('/api/business/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to upload document',
          code: response.status
        };
      }

      return {
        success: true,
        data: result.data,
        code: 201
      };
    } catch (error: any) {
      console.error('Error uploading business document:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload document',
        code: 500
      };
    }
  }

  /**
   * Delete a business document
   */
  async deleteDocument(documentId: string): Promise<IOperationResult<void>> {
    try {
      if (!documentId) {
        return {
          success: false,
          error: 'Document ID is required',
          code: 400
        };
      }

      const response = await fetch(`/api/business/documents?documentId=${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to delete document',
          code: response.status
        };
      }

      return {
        success: true,
        code: 200
      };
    } catch (error: any) {
      console.error('Error deleting business document:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete document',
        code: 500
      };
    }
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Get display name for document category
   */
  getCategoryDisplayName(category: UserDocumentCategory): string {
    const categoryMap: Record<UserDocumentCategory, string> = {
      'business-documents': 'İşletme Belgeleri',
      'tax-certificates': 'Vergi Levhaları',
      'place-photos': 'İşyeri Fotoğrafları',
      'identity-documents': 'Kimlik Belgeleri',
      'other': 'Diğer Belgeler'
    };

    return categoryMap[category] || category;
  }

  /**
   * Get file type from file name
   */
  getFileType(fileName: string): 'pdf' | 'image' | 'other' {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }

    if (extension === 'pdf') {
      return 'pdf';
    }

    return 'other';
  }

  /**
   * Check if file is an image
   */
  isImageFile(fileName: string): boolean {
    return this.getFileType(fileName) === 'image';
  }

  /**
   * Check if file is a PDF
   */
  isPdfFile(fileName: string): boolean {
    return this.getFileType(fileName) === 'pdf';
  }

  /**
   * Format file size for display
   */
  formatFileSize(size: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  }
}

// Export singleton instance
export const businessDocumentService = new BusinessDocumentServiceImpl();