'use client'

import { MarkdownField } from '@/components/admin/MarkdownEditor'
import { AuthGuard } from '@/components/auth'
import {
  useAbout,
  useBranding,
  useContact,
  useCreateServiceMutation,
  useCreateSliderMutation,
  useCreateVideoMutation,
  useDeleteServiceMutation,
  useDeleteSliderMutation,
  useDeleteVideoMutation,
  useServices,
  useSliders,
  useUpdateAboutMutation,
  useUpdateBrandingMutation,
  useUpdateContactMutation,
  useUpdateServiceMutation,
  useUpdateSliderMutation,
  useUpdateVideoMutation,
  useVideos,
} from '@/hooks/useContentQueries'
import Link from 'next/link'
import { MouseEvent, useCallback, useState } from 'react'
import {
  FiArrowLeft,
  FiEdit,
  FiPlus,
  FiSave,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'

type TabType =
  | 'sliders'
  | 'services'
  | 'videos'
  | 'contact'
  | 'about'
  | 'branding'

export default function AdminContentPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireAdmin={true}
      requireEmailVerification={true}
    >
      <AdminContentPageContent />
    </AuthGuard>
  )
}

function AdminContentPageContent() {
  // Data fetching hooks
  const { data: sliders = [], isLoading: slidersLoading } = useSliders()
  const { data: services = [], isLoading: servicesLoading } = useServices()
  const { data: videos = [], isLoading: videosLoading } = useVideos()
  const { data: contactInfo, isLoading: contactLoading } = useContact()
  const { data: aboutInfo, isLoading: aboutLoading } = useAbout()
  const { data: brandingInfo, isLoading: brandingLoading } = useBranding()

  // Mutation hooks
  const createSliderMutation = useCreateSliderMutation()
  const updateSliderMutation = useUpdateSliderMutation()
  const deleteSliderMutation = useDeleteSliderMutation()

  const createServiceMutation = useCreateServiceMutation()
  const updateServiceMutation = useUpdateServiceMutation()
  const deleteServiceMutation = useDeleteServiceMutation()

  const createVideoMutation = useCreateVideoMutation()
  const updateVideoMutation = useUpdateVideoMutation()
  const deleteVideoMutation = useDeleteVideoMutation()

  const updateContactMutation = useUpdateContactMutation()
  const updateAboutMutation = useUpdateAboutMutation()
  const updateBrandingMutation = useUpdateBrandingMutation()

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('sliders')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Tab configuration
  const tabs = [
    { id: 'sliders' as TabType, label: 'Sliderlar', count: sliders.length },
    { id: 'services' as TabType, label: 'Hizmetler', count: services.length },
    { id: 'videos' as TabType, label: 'Videolar', count: videos.length },
    { id: 'contact' as TabType, label: 'İletişim' },
    { id: 'about' as TabType, label: 'Hakkımızda' },
    { id: 'branding' as TabType, label: 'Marka' },
  ]

  // Handle create operations
  const handleCreate = useCallback(
    (type: TabType) => {
      let initialData = {}

      switch (type) {
        case 'sliders':
          initialData = {
            title: '',
            description: '',
            imageUrl: '',
            order: sliders.length + 1,
            isActive: true,
          }
          break
        case 'services':
          initialData = {
            title: '',
            description: '',
            imageUrl: '',
            order: services.length + 1,
            isActive: true,
          }
          break
        case 'videos':
          initialData = {
            title: '',
            description: '',
            youtubeUrl: '',
            thumbnailUrl: '',
            order: videos.length + 1,
            isActive: true,
          }
          break
      }

      setEditingItem(initialData)
      setIsCreating(true)
    },
    [sliders.length, services.length, videos.length]
  )

  const handleCreateVideo = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      handleCreate('videos')
    },
    [handleCreate]
  )

  // Handle edit operations
  const handleEdit = useCallback((item: any, type: TabType) => {
    setEditingItem({ ...item })
    setIsCreating(false)
  }, [])

  // Handle save operations
  const handleSave = useCallback(async () => {
    if (!editingItem) return

    setIsLoading(true)
    try {
      if (isCreating) {
        switch (activeTab) {
          case 'sliders':
            await createSliderMutation.mutateAsync(editingItem)
            break
          case 'services':
            await createServiceMutation.mutateAsync(editingItem)
            break
          case 'videos':
            await createVideoMutation.mutateAsync(editingItem)
            break
          case 'contact':
            await updateContactMutation.mutateAsync(editingItem)
            break
          case 'about':
            await updateAboutMutation.mutateAsync(editingItem)
            break
          case 'branding':
            await updateBrandingMutation.mutateAsync(editingItem)
            break
        }
      } else {
        switch (activeTab) {
          case 'sliders':
            await updateSliderMutation.mutateAsync({
              id: editingItem.id,
              data: editingItem,
            })
            break
          case 'services':
            await updateServiceMutation.mutateAsync({
              id: editingItem.id,
              data: editingItem,
            })
            break
          case 'videos':
            await updateVideoMutation.mutateAsync({
              id: editingItem.id,
              data: editingItem,
            })
            break
          case 'contact':
            await updateContactMutation.mutateAsync(editingItem)
            break
          case 'about':
            await updateAboutMutation.mutateAsync(editingItem)
            break
          case 'branding':
            await updateBrandingMutation.mutateAsync(editingItem)
            break
        }
      }
      setEditingItem(null)
      setIsCreating(false)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [
    editingItem,
    isCreating,
    activeTab,
    createSliderMutation,
    createServiceMutation,
    createVideoMutation,
    updateSliderMutation,
    updateServiceMutation,
    updateVideoMutation,
    updateContactMutation,
    updateAboutMutation,
    updateBrandingMutation,
  ])

  // Handle delete operations
  const handleDelete = useCallback(
    async (id: string, type: TabType) => {
      if (!confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return

      try {
        switch (type) {
          case 'sliders':
            await deleteSliderMutation.mutateAsync(id)
            break
          case 'services':
            await deleteServiceMutation.mutateAsync(id)
            break
          case 'videos':
            await deleteVideoMutation.mutateAsync(id)
            break
        }
      } catch (error) {
        console.error('Delete error:', error)
      }
    },
    [deleteSliderMutation, deleteServiceMutation, deleteVideoMutation]
  )

  // Render functions for each tab
  const renderSliders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Slider Yönetimi</h2>
        <button
          onClick={() => handleCreate('sliders')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="w-4 h-4" />
          Slider Ekle
        </button>
      </div>

      <div className="grid gap-4">
        {sliders.map(slider => (
          <div key={slider.id} className="bg-white p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{slider.title}</h3>
                <p className="text-gray-600 mt-1">{slider.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Sıra: {slider.order}</span>
                  <span
                    className={
                      slider.isActive ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {slider.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(slider, 'sliders')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(slider.id!, 'sliders')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderServices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hizmetler Yönetimi</h2>
        <button
          onClick={() => handleCreate('services')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="w-4 h-4" />
          Hizmet Ekle
        </button>
      </div>

      <div className="grid gap-4">
        {services.map(service => (
          <div key={service.id} className="bg-white p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{service.title}</h3>
                <p className="text-gray-600 mt-1">{service.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Sıra: {service.order}</span>
                  <span
                    className={
                      service.isActive ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {service.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(service, 'services')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id!, 'services')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderVideos = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Yönetimi</h2>
          <p className="text-gray-600 mt-1">
            Uygulamanızda gösterilen YouTube videolarını yönetin
          </p>
        </div>
        <button
          onClick={handleCreateVideo}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Video Ekle
        </button>
      </div>

      <div className="grid gap-4">
        {videos.map(video => (
          <div key={video.id} className="bg-white p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{video.title}</h3>
                <p className="text-gray-600 mt-1">{video.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Sıra: {video.order}</span>
                  <span
                    className={
                      video.isActive ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {video.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(video, 'videos')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(video.id!, 'videos')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderContact = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">İletişim Bilgileri</h2>

      <div className="bg-white p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">İletişim Detayları</h3>
          {contactInfo && (
            <button
              onClick={() => handleEdit(contactInfo, 'contact')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <FiEdit className="w-4 h-4" />
              Düzenle
            </button>
          )}
        </div>

        {contactInfo ? (
          <div className="space-y-2">
            <p>
              <strong>Telefon:</strong> {contactInfo?.phone ?? 'Belirtilmedi'}
            </p>
            <p>
              <strong>E-posta:</strong> {contactInfo?.email ?? 'Belirtilmedi'}
            </p>
            <p>
              <strong>Adres:</strong> {contactInfo?.address ?? 'Belirtilmedi'}
            </p>
            <p>
              <strong>Çalışma Saatleri:</strong>{' '}
              {contactInfo?.workingHours ?? 'Belirtilmedi'}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">İletişim bilgisi bulunamadı</p>
            <button
              onClick={() => handleEdit({}, 'contact')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              İletişim Bilgisi Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderAbout = () => (
    <div className="space-y-6">
      <div className="bg-gradient-admin-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">İçeriği Giriniz</h3>
          {aboutInfo && (
            <button
              onClick={() => handleEdit(aboutInfo, 'about')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <FiEdit className="w-4 h-4" />
              Düzenle
            </button>
          )}
        </div>
        {aboutInfo ? (
          <div className="space-y-4">
            <div className="mt-1 p-3">
              {aboutInfo.mdContent ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{aboutInfo.mdContent}</ReactMarkdown>
                </div>
              ) : (
                <span className="text-gray-500 italic">İçerik bulunamadı</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Hakkımızda bilgisi bulunamadı</p>
            <button
              onClick={() => handleEdit({}, 'about')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Hakkımızda Bilgisi Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderBranding = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Marka Bilgileri</h2>
      <div className="bg-white p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Marka Varlıkları</h3>
          {brandingInfo && (
            <button
              onClick={() => handleEdit(brandingInfo, 'branding')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <FiEdit className="w-4 h-4" />
              Düzenle
            </button>
          )}
        </div>

        {brandingInfo ? (
          <div className="space-y-4">
            <div>
              <strong>Şirket Adı:</strong>
              <p className="mt-1">{brandingInfo.companyName}</p>
            </div>
            <div>
              <strong>Logo URL:</strong>
              <p className="mt-1">{brandingInfo.logoUrl}</p>
            </div>
            <div>
              <strong>Favicon URL:</strong>
              <p className="mt-1">{brandingInfo.faviconUrl}</p>
            </div>
            <div>
              <strong>Ana Renk:</strong>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: brandingInfo.brandColors.primary }}
                />
                <span>{brandingInfo.brandColors.primary}</span>
              </div>
            </div>
            <div>
              <strong>İkincil Renk:</strong>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-6 h-6 rounded border"
                  style={{
                    backgroundColor: brandingInfo.brandColors.secondary,
                  }}
                />
                <span>{brandingInfo.brandColors.secondary}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Marka bilgisi bulunamadı</p>
            <button
              onClick={() => handleEdit({}, 'branding')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Marka Bilgisi Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Edit form renderer
  const renderEditForm = () => {
    if (!editingItem) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {isCreating ? 'Oluştur' : 'Düzenle'}{' '}
                {activeTab === 'sliders'
                  ? 'Slider'
                  : activeTab === 'services'
                    ? 'Hizmet'
                    : activeTab === 'videos'
                      ? 'Video'
                      : activeTab === 'contact'
                        ? 'İletişim'
                        : activeTab === 'about'
                          ? 'Hakkımızda'
                          : activeTab === 'branding'
                            ? 'Marka'
                            : ''}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Form fields based on active tab */}
              {(activeTab === 'sliders' || activeTab === 'services') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Başlık
                    </label>
                    <input
                      type="text"
                      value={editingItem.title || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={editingItem.description || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Görsel URL
                    </label>
                    <input
                      type="url"
                      value={editingItem.imageUrl || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          imageUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Sıra
                    </label>
                    <input
                      type="number"
                      value={editingItem.order || 0}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          order: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingItem.isActive || false}
                        onChange={e =>
                          setEditingItem({
                            ...editingItem,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Aktif</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'videos' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Başlık
                    </label>
                    <input
                      type="text"
                      value={editingItem.title || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={editingItem.description || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={editingItem.youtubeUrl || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          youtubeUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Thumbnail URL
                    </label>
                    <input
                      type="url"
                      value={editingItem.thumbnailUrl || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          thumbnailUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Sıra
                    </label>
                    <input
                      type="number"
                      value={editingItem.order || 0}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          order: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingItem.isActive || false}
                        onChange={e =>
                          setEditingItem({
                            ...editingItem,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Aktif</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'contact' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Telefon
                    </label>
                    <input
                      type="text"
                      value={editingItem.phone || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={editingItem.email || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Adres
                    </label>
                    <textarea
                      value={editingItem.address || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Çalışma Saatleri
                    </label>
                    <input
                      type="text"
                      value={editingItem.workingHours || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          workingHours: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Harita URL
                    </label>
                    <input
                      type="url"
                      value={editingItem.mapUrl || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          mapUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sosyal Medya
                    </label>
                    <div className="space-y-2">
                      <input
                        type="url"
                        placeholder="Facebook URL"
                        value={editingItem.socialMedia?.facebook || ''}
                        onChange={e =>
                          setEditingItem({
                            ...editingItem,
                            socialMedia: {
                              ...editingItem.socialMedia,
                              facebook: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="url"
                        placeholder="Instagram URL"
                        value={editingItem.socialMedia?.instagram || ''}
                        onChange={e =>
                          setEditingItem({
                            ...editingItem,
                            socialMedia: {
                              ...editingItem.socialMedia,
                              instagram: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="url"
                        placeholder="WhatsApp URL"
                        value={editingItem.socialMedia?.whatsapp || ''}
                        onChange={e =>
                          setEditingItem({
                            ...editingItem,
                            socialMedia: {
                              ...editingItem.socialMedia,
                              whatsapp: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'about' && (
                <div>
                  <MarkdownField
                    label="Hakkımızda İçeriği"
                    value={editingItem.mdContent || ''}
                    onChange={value =>
                      setEditingItem({
                        ...editingItem,
                        mdContent: value,
                      })
                    }
                    placeholder="Markdown formatında Hakkımızda içeriğini giriniz..."
                    height={400}
                  />
                </div>
              )}

              {activeTab === 'branding' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Şirket Adı
                    </label>
                    <input
                      type="text"
                      value={editingItem.companyName || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          companyName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={editingItem.logoUrl || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          logoUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Logo Alt Metni
                    </label>
                    <input
                      type="text"
                      value={editingItem.logoAltText || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          logoAltText: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Favicon URL
                    </label>
                    <input
                      type="url"
                      value={editingItem.faviconUrl || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          faviconUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Ana Renk
                    </label>
                    <input
                      type="color"
                      value={editingItem.brandColors?.primary || '#000000'}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          brandColors: {
                            ...editingItem.brandColors,
                            primary: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      İkincil Renk
                    </label>
                    <input
                      type="color"
                      value={editingItem.brandColors?.secondary || '#000000'}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          brandColors: {
                            ...editingItem.brandColors,
                            secondary: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Slogan
                    </label>
                    <input
                      type="text"
                      value={editingItem.tagline || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          tagline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                disabled={isLoading}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSave className="w-4 h-4" />
                )}
                {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sliders':
        return renderSliders()
      case 'services':
        return renderServices()
      case 'videos':
        return renderVideos()
      case 'contact':
        return renderContact()
      case 'about':
        return renderAbout()
      case 'branding':
        return renderBranding()
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-admin-card rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <FiArrowLeft className="h-5 w-5 mr-2" />
                </Link>
                <div className="h-6 w-px bg-slate-300"></div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    İçerik Yönetimi
                  </h1>
                  <p className="text-slate-600">
                    Web sitesi içeriklerini düzenleyin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow border border-slate-200 p-1">
            <div className="flex space-x-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
          {renderTabContent()}
        </div>

        {/* Edit Modal */}
        {renderEditForm()}
      </div>
    </div>
  )
}
