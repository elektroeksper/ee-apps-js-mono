import MarkdownEditor from '@/components/admin/MarkdownEditor'
import { useEffect, useState } from 'react'
import { FiFolder, FiX } from 'react-icons/fi'
import UploadManagerModal from './UploadManagerModal'

type ContentType = 'contact' | 'about' | 'branding'

interface ContentEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  contentType: ContentType
  data?: any
  isLoading: boolean
}

export default function ContentEditModal({
  isOpen,
  onClose,
  onSave,
  contentType,
  data,
  isLoading,
}: ContentEditModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [fileManagerOpen, setFileManagerOpen] = useState(false)

  useEffect(() => {
    if (data) {
      setFormData(data)
    } else {
      // Initialize with default values based on content type
      switch (contentType) {
        case 'contact':
          setFormData({
            phone: '',
            email: '',
            address: '',
            workingHours: '',
            socialMedia: {
              facebook: '',
              instagram: '',
              twitter: '',
              linkedin: '',
              whatsapp: '',
            },
            mapUrl: '',
          })
          break
        case 'about':
          setFormData({
            mdContent: '',
          })
          break
        case 'branding':
          setFormData({
            logoUrl: '',
            logoAltText: '',
            faviconUrl: '',
            brandColors: {
              primary: '#3B82F6',
              secondary: '#1E40AF',
              accent: '#F59E0B',
            },
            businessName: '',
            tagline: '',
          })
          break
      }
    }
  }, [data, contentType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const getTitle = () => {
    switch (contentType) {
      case 'contact':
        return 'İletişim Bilgileri'
      case 'about':
        return 'Hakkımızda İçeriği'
      case 'branding':
        return 'Marka Bilgileri'
      default:
        return 'İçerik Düzenle'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {contentType === 'contact' && (
            <>
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adres *
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Working Hours */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Çalışma Saatleri *
                </label>
                <input
                  type="text"
                  value={formData.workingHours || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      workingHours: e.target.value,
                    }))
                  }
                  placeholder="Pazartesi - Cuma: 09:00 - 18:00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Social Media */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">
                  Sosyal Medya Hesapları
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'facebook',
                    'instagram',
                    'twitter',
                    'linkedin',
                    'whatsapp',
                  ].map(platform => (
                    <div key={platform}>
                      <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">
                        {platform}
                      </label>
                      <input
                        type="url"
                        value={formData.socialMedia?.[platform] || ''}
                        onChange={e =>
                          setFormData((prev: any) => ({
                            ...prev,
                            socialMedia: {
                              ...prev.socialMedia,
                              [platform]: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Map URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Harita URL
                </label>
                <input
                  type="url"
                  value={formData.mapUrl || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      mapUrl: e.target.value,
                    }))
                  }
                  placeholder="Google Maps embed URL"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {contentType === 'about' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hakkımızda İçeriği (Markdown) *
              </label>
              <MarkdownEditor
                value={formData.mdContent || ''}
                onChange={value =>
                  setFormData((prev: any) => ({ ...prev, mdContent: value }))
                }
                height={400}
              />
            </div>
          )}

          {contentType === 'branding' && (
            <>
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  İşletme Adı *
                </label>
                <input
                  type="text"
                  value={formData.businessName || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      businessName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Slogan
                </label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      tagline: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo URL *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={formData.logoUrl || ''}
                    onChange={e =>
                      setFormData((prev: any) => ({
                        ...prev,
                        logoUrl: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/logo.png"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFileManagerOpen(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center space-x-2"
                    title="Dosya Yöneticisinden Seç"
                  >
                    <FiFolder className="h-4 w-4" />
                    <span>Seç</span>
                  </button>
                </div>
                {formData.logoUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.logoUrl}
                      alt="Logo Preview"
                      className="h-16 w-auto border rounded"
                      onError={e => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Logo Alt Text */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo Alt Metni *
                </label>
                <input
                  type="text"
                  value={formData.logoAltText || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      logoAltText: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Favicon URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Favicon URL
                </label>
                <input
                  type="url"
                  value={formData.faviconUrl || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      faviconUrl: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Brand Colors */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">
                  Marka Renkleri
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['primary', 'secondary', 'accent'].map(colorType => (
                    <div key={colorType}>
                      <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">
                        {colorType === 'primary'
                          ? 'Ana Renk'
                          : colorType === 'secondary'
                            ? 'İkincil Renk'
                            : 'Vurgu Rengi'}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.brandColors?.[colorType] || '#3B82F6'}
                          onChange={e =>
                            setFormData((prev: any) => ({
                              ...prev,
                              brandColors: {
                                ...prev.brandColors,
                                [colorType]: e.target.value,
                              },
                            }))
                          }
                          className="h-10 w-16 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.brandColors?.[colorType] || '#3B82F6'}
                          onChange={e =>
                            setFormData((prev: any) => ({
                              ...prev,
                              brandColors: {
                                ...prev.brandColors,
                                [colorType]: e.target.value,
                              },
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>

      <UploadManagerModal
        isOpen={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        onSelectFile={fileUrl => {
          setFormData((prev: any) => ({ ...prev, logoUrl: fileUrl }))
          setFileManagerOpen(false)
        }}
        category="branding"
        allowSelection={true}
      />
    </div>
  )
}
