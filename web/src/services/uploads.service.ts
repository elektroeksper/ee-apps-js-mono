import { FileMetadata } from '@/shared-generated/types'

type UploadCategory =
  | 'general'
  | 'sliders'
  | 'services'
  | 'branding'
  | 'content'
  | 'logos'
  | 'banners'

interface UploadFilter {
  category?: UploadCategory
  search?: string
}

export class UploadsService {
  private readonly apiUrl = '/api/admin/uploads'

  async upload(
    files: File[],
    category: string,
    authToken?: string
  ): Promise<FileMetadata[]> {
    const formData = new FormData()

    files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('category', category)

    const headers: HeadersInit = {}
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getAll(filter?: UploadFilter): Promise<FileMetadata[]> {
    const params = new URLSearchParams()
    if (filter?.category) {
      params.append('category', filter.category)
    }
    if (filter?.search) {
      params.append('search', filter.search)
    }

    const response = await fetch(`${this.apiUrl}?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`)
    }

    return response.json()
  }

  async delete(fileId: string, authToken?: string): Promise<void> {
    const headers: HeadersInit = {}
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
    }

    const response = await fetch(
      `${this.apiUrl}?id=${encodeURIComponent(fileId)}`,
      {
        method: 'DELETE',
        headers,
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`)
    }
  }

  getCategoryDisplayName(category: UploadCategory): string {
    const displayNames: Record<UploadCategory, string> = {
      general: 'General',
      sliders: 'Sliders',
      services: 'Services',
      branding: 'Branding',
      content: 'Content',
      logos: 'Logos',
      banners: 'Banners',
    }
    return displayNames[category] || category
  }

  isImageFile(file: FileMetadata): boolean {
    const imageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ]
    return imageTypes.includes(file.contentType)
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async listUploads(
    category?: UploadCategory
  ): Promise<{ success: boolean; data?: FileMetadata[]; error?: string }> {
    try {
      const files = await this.getAll({ category })
      return { success: true, data: files }
    } catch (error) {
      return { success: false, error: 'Failed to fetch uploads' }
    }
  }

  async deleteUpload(
    fileId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.delete(fileId)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Delete failed' }
    }
  }
}

export default new UploadsService()
