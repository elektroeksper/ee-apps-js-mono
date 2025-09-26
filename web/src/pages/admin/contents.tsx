'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import ContentEditModal from '@/components/admin/ContentEditModal'
import ServiceEditModal from '@/components/admin/ServiceEditModal'
import SliderEditModal from '@/components/admin/SliderEditModal'
import UploadManagerModal from '@/components/admin/UploadManagerModal'
import { AuthGuard } from '@/components/auth'
import { useAuth } from '@/contexts/AuthContext'
import {
  IAboutInfo,
  IBrandingInfo,
  IContactInfo,
  IServiceItem,
  ISliderItem,
} from '@/shared-generated'
import { GetServerSideProps } from 'next'
import { useCallback, useEffect, useState } from 'react'
import {
  FiEdit,
  FiFolder,
  FiImage,
  FiInfo,
  FiMail,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiTrash2,
  FiVideo,
} from 'react-icons/fi'

type ContentTab =
  | 'sliders'
  | 'services'
  | 'contact'
  | 'about'
  | 'branding'
  | 'files'

interface IContentFilter {
  tab: ContentTab
  search: string
}

export default function AdminContentsPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireAdmin={true}
      requireEmailVerification={true}
    >
      <AdminLayout title="İçerik Yönetimi">
        <AdminContentsPageContent />
      </AdminLayout>
    </AuthGuard>
  )
}

function AdminContentsPageContent() {
  const { fireUser } = useAuth() as any
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Content data states
  const [sliders, setSliders] = useState<ISliderItem[]>([])
  const [services, setServices] = useState<IServiceItem[]>([])
  const [contactInfo, setContactInfo] = useState<IContactInfo | null>(null)
  const [aboutInfo, setAboutInfo] = useState<IAboutInfo | null>(null)
  const [brandingInfo, setBrandingInfo] = useState<IBrandingInfo | null>(null)

  // Modal states
  const [editModal, setEditModal] = useState<{
    type: ContentTab
    item?: any
    isOpen: boolean
  }>({ type: 'sliders', isOpen: false })

  const [fileManagerOpen, setFileManagerOpen] = useState(false)

  const [filters, setFilters] = useState<IContentFilter>({
    tab: 'sliders',
    search: '',
  })

  // Get auth token helper
  const getAuthToken = async () => {
    if (!fireUser) {
      throw new Error('User not authenticated')
    }
    const firebaseUser = fireUser as any
    return await firebaseUser.getIdToken(true)
  }

  // Fetch content data
  const fetchContent = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const idToken = await getAuthToken()
      const headers = {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      }

      // Fetch all content types
      const [
        slidersResponse,
        servicesResponse,
        contactResponse,
        aboutResponse,
        brandingResponse,
      ] = await Promise.all([
        fetch('/api/admin/content/sliders', { headers }),
        fetch('/api/admin/content/services', { headers }),
        fetch('/api/admin/content/contact', { headers }),
        fetch('/api/admin/content/about', { headers }),
        fetch('/api/admin/content/branding', { headers }),
      ])

      // Handle sliders
      if (slidersResponse.ok) {
        const result = await slidersResponse.json()
        setSliders(result.success ? result.data || [] : [])
      }

      // Handle services
      if (servicesResponse.ok) {
        const result = await servicesResponse.json()
        setServices(result.success ? result.data || [] : [])
      }

      // Handle contact
      if (contactResponse.ok) {
        const result = await contactResponse.json()
        setContactInfo(result.success ? result.data : null)
      }

      // Handle about
      if (aboutResponse.ok) {
        const result = await aboutResponse.json()
        setAboutInfo(result.success ? result.data : null)
      }

      // Handle branding
      if (brandingResponse.ok) {
        const result = await brandingResponse.json()
        setBrandingInfo(result.success ? result.data : null)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch content data')
    } finally {
      setLoading(false)
    }
  }, [fireUser])

  // Create item
  const createItem = useCallback(
    async (type: ContentTab, data: any) => {
      setActionLoading(`create-${type}`)
      setError(null)

      try {
        const idToken = await getAuthToken()
        const response = await fetch(`/api/admin/content/${type}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()
        if (result.success) {
          await fetchContent()
          setEditModal({ type, isOpen: false })
        } else {
          setError(result.error || `Failed to create ${type}`)
        }
      } catch (err: any) {
        setError(err.message || `Failed to create ${type}`)
      } finally {
        setActionLoading(null)
      }
    },
    [fetchContent, getAuthToken]
  )

  // Update item
  const updateItem = useCallback(
    async (type: ContentTab, id: string | undefined, data: any) => {
      setActionLoading(`update-${id}`)
      setError(null)

      try {
        const idToken = await getAuthToken()
        const url =
          type === 'contact' || type === 'about' || type === 'branding'
            ? `/api/admin/content/${type}`
            : `/api/admin/content/${type}?id=${id}`

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()
        if (result.success) {
          await fetchContent()
          setEditModal({ type, isOpen: false })
        } else {
          setError(result.error || `Failed to update ${type}`)
        }
      } catch (err: any) {
        setError(err.message || `Failed to update ${type}`)
      } finally {
        setActionLoading(null)
      }
    },
    [fetchContent, getAuthToken]
  )

  // Delete item
  const deleteItem = useCallback(
    async (type: ContentTab, id: string) => {
      if (!confirm(`Are you sure you want to delete this ${type}?`)) return

      setActionLoading(`delete-${id}`)
      setError(null)

      try {
        const idToken = await getAuthToken()
        const response = await fetch(`/api/admin/content/${type}?id=${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()
        if (result.success) {
          await fetchContent()
        } else {
          setError(result.error || `Failed to delete ${type}`)
        }
      } catch (err: any) {
        setError(err.message || `Failed to delete ${type}`)
      } finally {
        setActionLoading(null)
      }
    },
    [fetchContent, getAuthToken]
  )

  // Load data on component mount
  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  // Filter data based on search
  const filteredSliders = sliders.filter(item =>
    item.title.toLowerCase().includes(filters.search.toLowerCase())
  )

  const filteredServices = services.filter(item =>
    item.title.toLowerCase().includes(filters.search.toLowerCase())
  )

  const getTotalItems = () => {
    switch (filters.tab) {
      case 'sliders':
        return filteredSliders.length
      case 'services':
        return filteredServices.length
      case 'contact':
        return contactInfo ? 1 : 0
      case 'about':
        return aboutInfo ? 1 : 0
      case 'branding':
        return brandingInfo ? 1 : 0
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 font-medium">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  İçerik Yönetimi
                </h1>
                <p className="text-slate-600 mt-2">
                  {filters.tab.charAt(0).toUpperCase() + filters.tab.slice(1)} -{' '}
                  Toplam {getTotalItems()} öğe
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {(filters.tab === 'sliders' || filters.tab === 'services') && (
                  <button
                    onClick={() =>
                      setEditModal({ type: filters.tab, isOpen: true })
                    }
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium shadow-lg transform transition-all hover:scale-105"
                  >
                    <FiPlus className="h-4 w-4 mr-2" />
                    Yeni Ekle
                  </button>
                )}
                <button
                  onClick={fetchContent}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg transform transition-all hover:scale-105"
                >
                  <FiRefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'sliders', label: 'Slider', icon: FiImage },
                { key: 'services', label: 'Hizmetler', icon: FiSettings },
                { key: 'contact', label: 'İletişim', icon: FiMail },
                { key: 'about', label: 'Hakkımızda', icon: FiInfo },
                { key: 'branding', label: 'Marka', icon: FiVideo },
                { key: 'files', label: 'Dosyalar', icon: FiFolder },
              ].map(tab => {
                const isActive = filters.tab === tab.key
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        tab: tab.key as ContentTab,
                      }))
                    }
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Search */}
          {(filters.tab === 'sliders' || filters.tab === 'services') && (
            <div className="p-6">
              <input
                type="text"
                placeholder={`${
                  filters.tab === 'sliders' ? 'Slider' : 'Hizmet'
                } ara...`}
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Content Display */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          {filters.tab === 'sliders' && (
            <div className="space-y-4">
              {filteredSliders.length === 0 ? (
                <p className="text-center text-slate-500 py-12">
                  Henüz slider eklenmemiş.
                </p>
              ) : (
                filteredSliders.map(slider => (
                  <div
                    key={slider.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={slider.imageUrl}
                          alt={slider.title}
                          className="h-16 w-24 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {slider.title}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Sıra: {slider.order} | Durum:{' '}
                            {slider.isActive ? 'Aktif' : 'Pasif'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            setEditModal({
                              type: 'sliders',
                              item: slider,
                              isOpen: true,
                            })
                          }
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteItem('sliders', slider.id!)}
                          disabled={actionLoading === `delete-${slider.id}`}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {filters.tab === 'services' && (
            <div className="space-y-4">
              {filteredServices.length === 0 ? (
                <p className="text-center text-slate-500 py-12">
                  Henüz hizmet eklenmemiş.
                </p>
              ) : (
                filteredServices.map(service => (
                  <div
                    key={service.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {service.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {service.description.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Sıra: {service.order} | Durum:{' '}
                          {service.isActive ? 'Aktif' : 'Pasif'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            setEditModal({
                              type: 'services',
                              item: service,
                              isOpen: true,
                            })
                          }
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteItem('services', service.id!)}
                          disabled={actionLoading === `delete-${service.id}`}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {filters.tab === 'contact' && (
            <div>
              {contactInfo ? (
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">
                      İletişim Bilgileri
                    </h3>
                    <button
                      onClick={() =>
                        setEditModal({
                          type: 'contact',
                          item: contactInfo,
                          isOpen: true,
                        })
                      }
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Telefon:</strong> {contactInfo.phone}
                    </div>
                    <div>
                      <strong>Email:</strong> {contactInfo.email}
                    </div>
                    <div className="md:col-span-2">
                      <strong>Adres:</strong> {contactInfo.address}
                    </div>
                    <div className="md:col-span-2">
                      <strong>Çalışma Saatleri:</strong>{' '}
                      {contactInfo.workingHours}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">
                    İletişim bilgileri bulunamadı.
                  </p>
                  <button
                    onClick={() =>
                      setEditModal({ type: 'contact', isOpen: true })
                    }
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <FiPlus className="h-4 w-4 mr-2" />
                    İletişim Bilgilerini Ekle
                  </button>
                </div>
              )}
            </div>
          )}

          {filters.tab === 'about' && (
            <div>
              {aboutInfo ? (
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">
                      Hakkımızda İçeriği
                    </h3>
                    <button
                      onClick={() =>
                        setEditModal({
                          type: 'about',
                          item: aboutInfo,
                          isOpen: true,
                        })
                      }
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-slate-600">
                      {aboutInfo.mdContent.substring(0, 300)}
                      {aboutInfo.mdContent.length > 300 && '...'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">
                    Hakkımızda içeriği bulunamadı.
                  </p>
                  <button
                    onClick={() =>
                      setEditModal({ type: 'about', isOpen: true })
                    }
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <FiPlus className="h-4 w-4 mr-2" />
                    Hakkımızda İçeriği Ekle
                  </button>
                </div>
              )}
            </div>
          )}

          {filters.tab === 'branding' && (
            <div>
              {brandingInfo ? (
                <div className="border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">
                      Marka Bilgileri
                    </h3>
                    <button
                      onClick={() =>
                        setEditModal({
                          type: 'branding',
                          item: brandingInfo,
                          isOpen: true,
                        })
                      }
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>İşletme Adı:</strong> {brandingInfo.businessName}
                    </div>
                    {brandingInfo.tagline && (
                      <div>
                        <strong>Slogan:</strong> {brandingInfo.tagline}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <strong>Logo:</strong>
                      <img
                        src={brandingInfo.logoUrl}
                        alt={brandingInfo.logoAltText}
                        className="h-8 w-auto"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <strong>Ana Renk:</strong>
                      <div
                        className="w-6 h-6 rounded border"
                        style={{
                          backgroundColor: brandingInfo.brandColors.primary,
                        }}
                      ></div>
                      <span className="text-sm text-slate-600">
                        {brandingInfo.brandColors.primary}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">
                    Marka bilgileri bulunamadı.
                  </p>
                  <button
                    onClick={() =>
                      setEditModal({ type: 'branding', isOpen: true })
                    }
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <FiPlus className="h-4 w-4 mr-2" />
                    Marka Bilgilerini Ekle
                  </button>
                </div>
              )}
            </div>
          )}

          {filters.tab === 'files' && (
            <div>
              <div className="text-center py-12">
                <FiFolder className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Dosya Yöneticisi
                </h3>
                <p className="text-slate-500 mb-6">
                  Resimleri yükleyin ve yönetin. Slider, hizmetler ve diğer
                  içerikler için kullanabilirsiniz.
                </p>
                <button
                  onClick={() => setFileManagerOpen(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FiFolder className="h-5 w-5 mr-2" />
                  Dosya Yöneticisini Aç
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {editModal.isOpen && editModal.type === 'sliders' && (
          <SliderEditModal
            isOpen={editModal.isOpen}
            onClose={() => setEditModal({ type: 'sliders', isOpen: false })}
            onSave={(data: any) =>
              editModal.item
                ? updateItem('sliders', editModal.item.id, data)
                : createItem('sliders', data)
            }
            slider={editModal.item}
            isLoading={!!actionLoading}
          />
        )}

        {editModal.isOpen && editModal.type === 'services' && (
          <ServiceEditModal
            isOpen={editModal.isOpen}
            onClose={() => setEditModal({ type: 'services', isOpen: false })}
            onSave={(data: any) =>
              editModal.item
                ? updateItem('services', editModal.item.id, data)
                : createItem('services', data)
            }
            service={editModal.item}
            isLoading={!!actionLoading}
          />
        )}

        {editModal.isOpen &&
          (editModal.type === 'contact' ||
            editModal.type === 'about' ||
            editModal.type === 'branding') && (
            <ContentEditModal
              isOpen={editModal.isOpen}
              onClose={() =>
                setEditModal({ type: editModal.type, isOpen: false })
              }
              onSave={(data: any) =>
                updateItem(editModal.type, undefined, data)
              }
              contentType={editModal.type}
              data={editModal.item}
              isLoading={!!actionLoading}
            />
          )}

        <UploadManagerModal
          isOpen={fileManagerOpen}
          onClose={() => setFileManagerOpen(false)}
        />
      </div>
    </div>
  )
}

// Force server-side rendering to prevent static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  }
}
