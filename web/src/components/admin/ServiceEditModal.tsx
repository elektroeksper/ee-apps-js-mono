import { IServiceItem } from '@/shared'
import { useEffect, useState } from 'react'
import { FiFolder, FiX } from 'react-icons/fi'
import UploadManagerModal from './UploadManagerModal'

interface ServiceEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<IServiceItem>) => void
  service?: IServiceItem
  isLoading: boolean
}

export default function ServiceEditModal({
  isOpen,
  onClose,
  onSave,
  service,
  isLoading,
}: ServiceEditModalProps) {
  const [formData, setFormData] = useState<Partial<IServiceItem>>({
    title: '',
    description: '',
    icon: '',
    imageUrl: '',
    features: [],
    order: 0,
    isActive: true,
  })

  const [featuresInput, setFeaturesInput] = useState('')
  const [fileManagerOpen, setFileManagerOpen] = useState(false)

  useEffect(() => {
    if (service) {
      setFormData(service)
      setFeaturesInput(service.features?.join('\n') || '')
    } else {
      setFormData({
        title: '',
        description: '',
        icon: '',
        imageUrl: '',
        features: [],
        order: 0,
        isActive: true,
      })
      setFeaturesInput('')
    }
  }, [service])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const features = featuresInput
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0)

    onSave({
      ...formData,
      features,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {service ? 'Hizmet Düzenle' : 'Yeni Hizmet'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Başlık *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Açıklama *
            </label>
            <textarea
              value={formData.description || ''}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              İkon (CSS sınıfı veya emoji)
            </label>
            <input
              type="text"
              value={formData.icon || ''}
              onChange={e =>
                setFormData(prev => ({ ...prev, icon: e.target.value }))
              }
              placeholder="🔧 veya fi-settings"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Resim URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={formData.imageUrl || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, imageUrl: e.target.value }))
                }
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
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
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="h-20 w-32 object-cover rounded border"
                  onError={e => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Özellikler (Her satıra bir özellik)
            </label>
            <textarea
              value={featuresInput}
              onChange={e => setFeaturesInput(e.target.value)}
              rows={4}
              placeholder="Hızlı servis&#10;7/24 destek&#10;Garantili onarım"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Her satıra bir özellik yazın. Boş satırlar otomatik olarak
              filtrelenecektir.
            </p>
          </div>

          {/* Order and Active */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sıra
              </label>
              <input
                type="number"
                value={formData.order || 0}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    order: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Durum
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Aktif</span>
              </div>
            </div>
          </div>

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
          setFormData(prev => ({ ...prev, imageUrl: fileUrl }))
          setFileManagerOpen(false)
        }}
        category="services"
        allowSelection={true}
      />
    </div>
  )
}
