import { useAuth } from '@/contexts/AuthContext'
import adminUploadsService from '@/services/uploads.service'
import { IUploadItem, UploadCategory } from '@/shared-generated'
import { useCallback, useEffect, useState } from 'react'
import {
  FiCheck,
  FiCopy,
  FiDownload,
  FiFileText,
  FiImage,
  FiTrash2,
  FiUpload,
  FiX,
} from 'react-icons/fi'

interface FileManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectFile?: (fileUrl: string) => void
  category?: UploadCategory
  allowSelection?: boolean
}

export default function FileManagerModal({
  isOpen,
  onClose,
  onSelectFile,
  category = 'general',
  allowSelection = false,
}: FileManagerModalProps) {
  const { fireUser } = useAuth() as any
  const [files, setFiles] = useState<IUploadItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] =
    useState<UploadCategory>(category)
  const [dragOver, setDragOver] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const categories: UploadCategory[] = [
    'general',
    'sliders',
    'services',
    'branding',
    'content',
  ]

  const getAuthToken = async () => {
    if (!fireUser) {
      throw new Error('User not authenticated')
    }
    const firebaseUser = fireUser as any
    return await firebaseUser.getIdToken(true)
  }

  const fetchFiles = useCallback(async () => {
    if (!isOpen) return

    setLoading(true)
    setError(null)

    try {
      const filter =
        selectedCategory === 'general' ? {} : { category: selectedCategory }
      const result = await adminUploadsService.getAll(filter)

      if (result.success && result.data) {
        setFiles(result.data)
      } else {
        setError(result.error || 'Failed to fetch files')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [isOpen, selectedCategory])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleFileUpload = async (uploadFiles: FileList) => {
    if (!uploadFiles.length) return

    setUploading(true)
    setError(null)

    try {
      const authToken = await getAuthToken()

      for (const file of Array.from(uploadFiles)) {
        const result = await adminUploadsService.upload(
          file,
          selectedCategory,
          authToken
        )

        if (!result.success) {
          setError(result.error || 'Failed to upload file')
          break
        }
      }

      // Refresh file list
      await fetchFiles()
    } catch (err: any) {
      setError(err.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return

    try {
      const authToken = await getAuthToken()
      const result = await adminUploadsService.delete(fileId, authToken)

      if (result.success) {
        await fetchFiles()
      } else {
        setError(result.error || 'Failed to delete file')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete file')
    }
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleSelectFile = (fileUrl: string) => {
    if (onSelectFile) {
      onSelectFile(fileUrl)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Dosya Yöneticisi
            </h2>
            <p className="text-slate-600 mt-1">Resimleri yükleyin ve yönetin</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* Sidebar */}
          <div className="w-48 bg-slate-50 border-r border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Kategoriler
            </h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {adminUploadsService.getCategoryDisplayName(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Upload Area */}
            <div className="p-6 border-b border-slate-200">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <FiUpload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">
                  Dosyaları buraya sürükleyin veya
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                  <FiFileText className="h-4 w-4 mr-2" />
                  Dosya Seç
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  Sadece resim dosyaları (JPG, PNG, GIF, WebP, BMP) - Maks. 10MB
                </p>
              </div>
            </div>

            {/* Files Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-700">Dosyalar yükleniyor...</p>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12">
                  <FiImage className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    Bu kategoride henüz dosya yok
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {files.map(file => (
                    <div
                      key={file.id}
                      className="group relative bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Image */}
                      <div className="aspect-square bg-slate-100 relative">
                        {adminUploadsService.isImageFile(file) ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FiFileText className="h-8 w-8 text-slate-400" />
                          </div>
                        )}

                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            {allowSelection && onSelectFile && (
                              <button
                                onClick={() => handleSelectFile(file.url)}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                title="Seç"
                              >
                                <FiCheck className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyUrl(file.url)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              title="URL Kopyala"
                            >
                              {copiedUrl === file.url ? (
                                <FiCheck className="h-4 w-4" />
                              ) : (
                                <FiCopy className="h-4 w-4" />
                              )}
                            </button>
                            <a
                              href={file.url}
                              download={file.name}
                              className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                              title="İndir"
                            >
                              <FiDownload className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                              title="Sil"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="p-3">
                        <p
                          className="text-sm font-medium text-slate-900 truncate"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {adminUploadsService.formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Toplam {files.length} dosya
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
