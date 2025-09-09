'use client'

import { storageClientService } from '@/services/storageClientService'
import { IAppUser, UserDocument } from '@/shared-generated'
import { useEffect, useState } from 'react'
import {
  FiCheck,
  FiExternalLink,
  FiFile,
  FiFileText,
  FiFolder,
  FiImage,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
  FiX,
} from 'react-icons/fi'
import Modal from './ui/Modal'

interface BusinessDocumentModalProps {
  user: IAppUser | null
  isOpen: boolean
  onClose: () => void
  onApprove: (userId: string) => Promise<void>
  onReject: () => void
  isLoading: boolean
}

export default function BusinessDocumentModal({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: BusinessDocumentModalProps) {
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  // Fetch documents when modal opens and user is available
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchUserDocuments()
    }
  }, [isOpen, user?.id])

  const fetchUserDocuments = async () => {
    if (!user?.id) return

    setLoadingDocuments(true)
    try {
      // Use the storage client service
      const userDocs = await storageClientService.getUserDocuments(user.id)
      setDocuments(userDocs)
    } catch (error) {
      console.error('Error fetching user documents:', error)
      setDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }

  if (!user) return null

  const extendedUser = user as any
  const businessInfo = extendedUser?.businessInfo || {}

  // Group documents by category
  const documentsByCategory = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = []
      }
      acc[doc.category].push(doc)
      return acc
    },
    {} as Record<string, UserDocument[]>
  )

  const handleApprove = async () => {
    if (user) {
      await onApprove(user.id)
      onClose()
    }
  }

  const handleReject = () => {
    onReject()
    // Don't close here, parent will handle it
  }

  const openDocument = (url: string, title: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      alert(`${title} belgesi bulunamadı`)
    }
  }

  // Component to render document icon based on type
  const DocumentIcon = ({
    type,
    className = 'h-8 w-8',
  }: {
    type: string
    className?: string
  }) => {
    switch (type) {
      case 'pdf':
        return <FiFile className={`${className} text-red-500`} />
      case 'image':
        return <FiImage className={`${className} text-blue-500`} />
      default:
        return <FiFileText className={`${className} text-gray-500`} />
    }
  }

  // Component to render document item
  const DocumentItem = ({ document }: { document: UserDocument }) => {
    const displayName = storageClientService.getFileDisplayName(document.name)

    // For PDF files, show as simple list item with icon
    if (document.type === 'pdf') {
      return (
        <div className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors group">
          <div className="flex-shrink-0">
            <DocumentIcon type={document.type} className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-slate-900 text-sm">
              {displayName}
            </h5>
            <p className="text-xs text-slate-500">{document.name}</p>
          </div>
          <button
            onClick={() => openDocument(document.url, displayName)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Yeni sekmede aç"
          >
            <FiExternalLink className="h-4 w-4" />
          </button>
        </div>
      )
    }

    // For image files, this will be handled in a separate photo grid component
    return null
  }

  // Component to render photo gallery for images
  const PhotoGallery = ({ photos }: { photos: UserDocument[] }) => {
    if (photos.length === 0) return null

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <FiImage className="h-4 w-4 text-slate-400" />
          <h5 className="text-sm font-medium text-slate-700 uppercase tracking-wide">
            İşyeri Fotoğrafları
          </h5>
          <span className="text-xs text-slate-400">({photos.length})</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, index) => {
            const displayName = storageClientService.getFileDisplayName(
              photo.name
            )
            return (
              <div
                key={`${photo.fullPath}-${index}`}
                className="relative group cursor-pointer"
                onClick={() => openDocument(photo.url, displayName)}
              >
                <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors">
                  <img
                    src={photo.url}
                    alt={displayName}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    onError={e => {
                      console.error('Image failed to load:', photo.url)
                      // Fallback to a placeholder or icon
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-slate-100">
                          <svg class="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                          </svg>
                        </div>
                      `
                    }}
                  />
                </div>

                {/* Overlay with expand icon */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <FiExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>

                {/* Photo name tooltip */}
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
                  {displayName}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="İşletme Belgelerini İncele"
      maxWidth="4xl"
    >
      {/* Business Information */}
      <div className="mb-8 p-4 bg-slate-50 rounded-xl">
        <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
          <FiUser className="h-5 w-5 mr-2" />
          İşletme Bilgileri
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">İşletme Adı</p>
            <p className="font-medium text-slate-900">
              {businessInfo.businessName ||
                businessInfo.companyName ||
                'Belirtilmemiş'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Sahip</p>
            <p className="font-medium text-slate-900">
              {user.displayName || `${user.firstName} ${user.lastName}`}
            </p>
          </div>
          <div>
            <div className="text-sm text-slate-600 flex items-center">
              <FiMail className="h-4 w-4 mr-1" />
              Email
            </div>
            <p className="font-medium text-slate-900">{user.email}</p>
          </div>
          <div>
            <div className="text-sm text-slate-600 flex items-center">
              <FiPhone className="h-4 w-4 mr-1" />
              Telefon
            </div>
            <p className="font-medium text-slate-900">
              {user.phone || businessInfo.phone || 'Belirtilmemiş'}
            </p>
          </div>
          {businessInfo.address && (
            <div className="md:col-span-2">
              <div className="text-sm text-slate-600 flex items-center">
                <FiMapPin className="h-4 w-4 mr-1" />
                Adres
              </div>
              <p className="font-medium text-slate-900">
                {businessInfo.address}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
          <FiFileText className="h-5 w-5 mr-2" />
          İşletme Belgeleri
        </h4>

        {loadingDocuments ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p>Belgeler yükleniyor...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-6">
            {/* Separate photos from other documents */}
            {(() => {
              const photos = documents.filter(doc => doc.type === 'image')
              const otherDocs = documents.filter(doc => doc.type !== 'image')
              const otherDocsByCategory = otherDocs.reduce(
                (acc, doc) => {
                  if (!acc[doc.category]) {
                    acc[doc.category] = []
                  }
                  acc[doc.category].push(doc)
                  return acc
                },
                {} as Record<string, UserDocument[]>
              )

              return (
                <>
                  {/* Photo Gallery */}
                  <PhotoGallery photos={photos} />

                  {/* Other Documents */}
                  {Object.entries(otherDocsByCategory).map(
                    ([category, categoryDocs]) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <FiFolder className="h-4 w-4 text-slate-400" />
                          <h5 className="text-sm font-medium text-slate-700 uppercase tracking-wide">
                            {storageClientService.getCategoryDisplayName(
                              category as UserDocument['category']
                            )}
                          </h5>
                          <span className="text-xs text-slate-400">
                            ({categoryDocs.length})
                          </span>
                        </div>

                        <div className="space-y-2">
                          {categoryDocs.map((document, index) => (
                            <DocumentItem
                              key={`${document.fullPath}-${index}`}
                              document={document}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </>
              )
            })()}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">
            <FiFileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-medium mb-2">Belge Bulunamadı</p>
            <p>Bu işletme için henüz belge yüklenmemiş.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          disabled={isLoading}
        >
          İptal
        </button>
        <button
          onClick={handleReject}
          disabled={isLoading}
          className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <FiX className="h-4 w-4 mr-2" />
          Reddet
        </button>
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <FiCheck className="h-4 w-4 mr-2" />
          )}
          Onayla
        </button>
      </div>
    </Modal>
  )
}
