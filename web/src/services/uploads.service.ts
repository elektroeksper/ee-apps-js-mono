/**
 * Admin Upload Management Service
 * Handles file uploads and management for admin purposes
 */

import { IUploadItem, IUploadListResponse, IUploadResponse, IUploadService, IUploadsFilter, UploadCategory } from '@/shared-generated';


export class UploadsService implements IUploadService {
  async delete(id: string, authToken?: string): Promise<IUploadResponse> {
    try {
      const response = await fetch(`/api/admin/uploads?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: Failed to delete file`
        };
      }

      return result;
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }
  /**
   * Get list of uploaded files
   */
  async getAll(filter: IUploadsFilter): Promise<IUploadListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (filter.category) {
        queryParams.append('category', filter.category);
      }
      if (filter.uploadedBy) {
        queryParams.append('uploadedBy', filter.uploadedBy);
      }
      if (filter.dateFrom) {
        queryParams.append('dateFrom', filter.dateFrom);
      }
      if (filter.dateTo) {
        queryParams.append('dateTo', filter.dateTo);
      }

      const response = await fetch(`/api/admin/uploads?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: Failed to fetch files`
        };
      }

      return result;
    } catch (error) {
      console.error('Error fetching files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch files'
      };
    }
  }

  /**
   * Upload a new file
   */
  async upload(
    file: File,
    category: UploadCategory = 'general',
    authToken?: string
  ): Promise<IUploadResponse> {
    try {
      // Validate file
      const validation = this.validate(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Convert file to base64
      const fileData = await this.fileToBase64(file);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/admin/uploads', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          fileName: file.name,
          fileData,
          category,
          metadata: {
            originalName: file.name,
            size: file.size,
            type: file.type
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `HTTP ${response.status}: Failed to upload file`
        };
      }

      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }
  /**
   * Validate file for upload
   */
  validate(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Dosya boyutu 10MB\'ı geçemez' };
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Sadece resim dosyaları yüklenebilir (JPG, PNG, GIF, WebP, BMP)' };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get display name for file category
   */
  getCategoryDisplayName(category: UploadCategory): string {
    const categoryNames: Record<UploadCategory, string> = {
      general: 'Genel',
      sliders: 'Slider Görselleri',
      services: 'Hizmet Görselleri',
      branding: 'Marka Görselleri',
      content: 'İçerik Görselleri'
    };
    return categoryNames[category] || 'Bilinmeyen';
  }

  /**
   * Check if file is an image
   */
  isImageFile(file: IUploadItem): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Get file extension
   */
  getExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Convert File to base64
   */
  public fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}

export const adminUploadsService = new UploadsService();
export default adminUploadsService;