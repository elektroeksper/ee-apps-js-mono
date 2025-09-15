/**
 * Client-side storage service that consumes Firebase Functions
 * Implements the IStorageService interface for consistent API
 */
import { IStorageService, UserDocument, UserDocumentCategory, UserDocumentFileType } from '../../../shared/src/types';
/**
 * Client storage service implementation
 */
export declare class StorageClientService implements IStorageService {
    /**
     * Get all documents for a specific user
     */
    getUserDocuments(userId: string): Promise<UserDocument[]>;
    /**
     * Upload a new document for a user
     */
    uploadUserDocument(userId: string, file: File, category: UserDocumentCategory): Promise<UserDocument>;
    /**
     * Delete a user document
     * TODO: Implement when delete function is available
     */
    deleteUserDocument(userId: string, documentPath: string): Promise<boolean>;
    /**
     * Get user-friendly display name for document categories
     */
    getCategoryDisplayName(category: UserDocumentCategory): string;
    /**
     * Get file display name (remove extensions and format nicely)
     */
    getFileDisplayName(fileName: string): string;
    /**
     * Get file type based on extension
     */
    getFileType(fileName: string): UserDocumentFileType;
    /**
     * Check if a file is an image
     */
    isImageFile(fileName: string): boolean;
    /**
     * Check if a file is a PDF
     */
    isPdfFile(fileName: string): boolean;
    /**
     * Get appropriate icon class for file type
     */
    getFileIconClass(fileName: string): string;
    /**
     * Validate file for upload
     */
    validateFile(file: File, category: UserDocumentCategory): {
        valid: boolean;
        error?: string;
    };
    /**
     * Helper: Convert File to base64
     */
    private fileToBase64;
}
export declare const storageClientService: StorageClientService;
export declare const getUserDocuments: (userId: string) => Promise<UserDocument[]>, getCategoryDisplayName: (category: UserDocumentCategory) => string, getFileDisplayName: (fileName: string) => string;
