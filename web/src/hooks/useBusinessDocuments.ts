/**
 * Business Document Hooks
 * React hooks for managing business document operations
 */

import { businessDocumentService } from '@/services/documents.service';
import { DocumentCategory, IDocument } from '@/shared-generated';
import { useCallback, useEffect, useState } from 'react';

export interface UseBusinessDocumentsState {
  documents: IDocument[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  uploadDocument: (file: File, category: DocumentCategory, metadata?: any) => Promise<boolean>;
  deleteDocument: (documentId: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Hook for managing business documents
 */
export function useBusinessDocuments(): UseBusinessDocumentsState {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await businessDocumentService.getDocuments();

      if (result.success && result.data) {
        setDocuments(result.data);
      } else {
        setError(result.error || 'Failed to fetch documents');
        setDocuments([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (
    file: File,
    category: DocumentCategory,
    metadata?: any
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await businessDocumentService.uploadDocument(file, category, metadata);

      if (result.success) {
        // Refresh documents list to include the new document
        await refresh();
        return true;
      } else {
        setError(result.error || 'Failed to upload document');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await businessDocumentService.deleteDocument(documentId);

      if (result.success) {
        // Remove document from local state
        setDocuments(prev => prev.filter(doc =>
          doc.metadata?.documentId !== documentId
        ));
        return true;
      } else {
        setError(result.error || 'Failed to delete document');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load documents on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    documents,
    isLoading,
    error,
    refresh,
    uploadDocument,
    deleteDocument,
    clearError
  };
}

/**
 * Hook for document upload with progress tracking
 */
export interface UseDocumentUploadState {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadDocument: (file: File, category: DocumentCategory, metadata?: any) => Promise<boolean>;
  clearError: () => void;
}

export function useDocumentUpload(onSuccess?: () => void): UseDocumentUploadState {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadDocument = useCallback(async (
    file: File,
    category: DocumentCategory,
    metadata?: any
  ): Promise<boolean> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 20;
          return next > 90 ? 90 : next;
        });
      }, 200);

      const result = await businessDocumentService.uploadDocument(file, category, metadata);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setTimeout(() => {
          setUploadProgress(0);
          onSuccess?.();
        }, 500);
        return true;
      } else {
        setError(result.error || 'Failed to upload document');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
      return false;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [onSuccess]);

  return {
    isUploading,
    uploadProgress,
    error,
    uploadDocument,
    clearError
  };
}

/**
 * Hook for document categorization and validation
 */
export interface UseDocumentValidationState {
  validateFile: (file: File) => { isValid: boolean; error?: string };
  getCategoryDisplayName: (category: DocumentCategory) => string;
  getFileTypeIcon: (fileName: string) => string;
  formatFileSize: (size: number) => string;
}

export function useDocumentValidation(): UseDocumentValidationState {
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Dosya boyutu 10MB\'ı geçemez'
      };
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Sadece PDF ve resim dosyaları (JPEG, PNG, GIF, WebP) kabul edilir'
      };
    }

    return { isValid: true };
  }, []);

  const getCategoryDisplayName = useCallback((category: DocumentCategory): string => {
    return businessDocumentService.getCategoryDisplayName(category);
  }, []);

  const getFileTypeIcon = useCallback((fileName: string): string => {
    const fileType = businessDocumentService.getFileType(fileName);

    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      default:
        return '📁';
    }
  }, []);

  const formatFileSize = useCallback((size: number): string => {
    return businessDocumentService.formatFileSize(size);
  }, []);

  return {
    validateFile,
    getCategoryDisplayName,
    getFileTypeIcon,
    formatFileSize
  };
}