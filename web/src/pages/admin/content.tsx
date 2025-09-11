import { VideoCard } from '@/components/admin/VideoCard'
import {
  IVideoItem,
  VideoForm,
  VideoLocation,
} from '@/components/admin/VideoForm'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
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
import { useState } from 'react'
import {
  FiArrowLeft,
  FiEdit,
  FiFilter,
  FiPlus,
  FiSave,
  FiSettings,
  FiTrash2,
  FiX,
} from 'react-icons/fi'

type TabType =
  | 'sliders'
  | 'services'
  | 'contact'
  | 'about'
  | 'branding'
  | 'videos'

const ContentManagementPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('sliders')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: string
    id: string
  } | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Video management state
  const [locationFilter, setLocationFilter] = useState<VideoLocation | 'all'>(
    'all'
  )
  const [editingVideo, setEditingVideo] = useState<IVideoItem | null>(null)
  const [isCreatingVideo, setIsCreatingVideo] = useState(false)

  // Queries
  const { data: sliders = [], isLoading: slidersLoading } = useSliders()
  const { data: services = [], isLoading: servicesLoading } = useServices()
  const { data: videos = [], isLoading: videosLoading } = useVideos()
  const { data: contact, isLoading: contactLoading } = useContact()
  const { data: about, isLoading: aboutLoading } = useAbout()
  const { data: branding, isLoading: brandingLoading } = useBranding()

  // Mutations
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

  const tabs = [
    { id: 'sliders' as TabType, label: 'Sliders', count: sliders.length },
    { id: 'services' as TabType, label: 'Services', count: services.length },
    { id: 'videos' as TabType, label: 'Videos', count: videos.length },
    { id: 'contact' as TabType, label: 'Contact' },
    { id: 'about' as TabType, label: 'About Us' },
    { id: 'branding' as TabType, label: 'Branding' },
  ]

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingItem({})
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!editingItem) return

    try {
      if (activeTab === 'sliders') {
        if (isCreating) {
          await createSliderMutation.mutateAsync(editingItem)
        } else {
          await updateSliderMutation.mutateAsync({
            id: editingItem.id,
            data: editingItem,
          })
        }
      } else if (activeTab === 'services') {
        if (isCreating) {
          await createServiceMutation.mutateAsync(editingItem)
        } else {
          await updateServiceMutation.mutateAsync({
            id: editingItem.id,
            data: editingItem,
          })
        }
      } else if (activeTab === 'videos') {
        if (isCreating) {
          await createVideoMutation.mutateAsync(editingItem)
        } else {
          await updateVideoMutation.mutateAsync({
            id: editingItem.id,
            data: editingItem,
          })
        }
      } else if (activeTab === 'contact') {
        await updateContactMutation.mutateAsync(editingItem)
      } else if (activeTab === 'about') {
        await updateAboutMutation.mutateAsync(editingItem)
      } else if (activeTab === 'branding') {
        await updateBrandingMutation.mutateAsync(editingItem)
      }

      setEditingItem(null)
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      if (deleteConfirm.type === 'slider') {
        await deleteSliderMutation.mutateAsync(deleteConfirm.id)
      } else if (deleteConfirm.type === 'service') {
        await deleteServiceMutation.mutateAsync(deleteConfirm.id)
      } else if (deleteConfirm.type === 'video') {
        await deleteVideoMutation.mutateAsync(deleteConfirm.id)
      }
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  // Video management functions
  const VIDEO_LOCATIONS = {
    'individual-setup': {
      label: 'Individual Setup',
      description: 'Setup tutorial videos',
    },
    'business-setup': {
      label: 'Business Setup',
      description: 'Business onboarding videos',
    },
    'app-index': {
      label: 'App Index',
      description: 'Main page promotional videos',
    },
    'individual-home': {
      label: 'Individual Home',
      description: 'Individual dashboard videos',
    },
    'business-home': {
      label: 'Business Home',
      description: 'Business dashboard videos',
    },
  }

  const filteredVideos =
    locationFilter === 'all'
      ? videos
      : videos.filter(video => video.location === locationFilter)

  const getVideoCountByLocation = (location: VideoLocation) => {
    return videos.filter(video => video.location === location).length
  }

  const handleEditVideo = (video: IVideoItem) => {
    setEditingVideo(video)
    setIsCreatingVideo(false)
  }

  const handleCreateVideo = () => {
    setEditingVideo(null)
    setIsCreatingVideo(true)
  }

  const handleSaveVideo = async (videoData: Partial<IVideoItem>) => {
    try {
      if (isCreatingVideo) {
        await createVideoMutation.mutateAsync(
          videoData as Omit<IVideoItem, 'id' | 'createdAt' | 'updatedAt'>
        )
      } else if (editingVideo?.id) {
        await updateVideoMutation.mutateAsync({
          id: editingVideo.id,
          data: videoData,
        })
      }
      setEditingVideo(null)
      setIsCreatingVideo(false)
    } catch (error) {
      console.error('Failed to save video:', error)
    }
  }

  const handleDeleteVideo = (video: IVideoItem) => {
    setDeleteConfirm({ type: 'video', id: video.id || '' })
  }

  const renderSliders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Slider Management</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="w-4 h-4" />
          Add Slider
        </button>
      </div>

      {slidersLoading ? (
        <div className="text-center py-8">Loading sliders...</div>
      ) : (
        <div className="grid gap-4">
          {sliders.map(slider => (
            <div
              key={slider.id}
              className="bg-white p-6 rounded-lg shadow border"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{slider.title}</h3>
                  <p className="text-gray-600 mt-1">{slider.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>Order: {slider.order}</span>
                    <span>
                      Status: {slider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(slider)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      slider.id &&
                      setDeleteConfirm({ type: 'slider', id: slider.id })
                    }
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderServices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Services Management</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {servicesLoading ? (
        <div className="text-center py-8">Loading services...</div>
      ) : (
        <div className="grid gap-4">
          {services.map(service => (
            <div
              key={service.id}
              className="bg-white p-6 rounded-lg shadow border"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{service.title}</h3>
                  <p className="text-gray-600 mt-1">{service.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>Order: {service.order}</span>
                    <span>
                      Status: {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      service.id &&
                      setDeleteConfirm({ type: 'service', id: service.id })
                    }
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderContact = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Contact Information</h2>

      {contactLoading ? (
        <div className="text-center py-8">Loading contact information...</div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Contact Details</h3>
            {contact && (
              <button
                onClick={() => handleEdit(contact)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiEdit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {contact ? (
            <div className="space-y-2">
              <p>
                <strong>Phone:</strong> {contact.phone}
              </p>
              <p>
                <strong>Email:</strong> {contact.email}
              </p>
              <p>
                <strong>Address:</strong> {contact.address}
              </p>
              <p>
                <strong>Working Hours:</strong> {contact.workingHours}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No contact information found</p>
              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Contact Information
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderAbout = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">About Us Information</h2>

      {aboutLoading ? (
        <div className="text-center py-8">Loading about information...</div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">About Details</h3>
            {about && (
              <button
                onClick={() => handleEdit(about)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiEdit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {about ? (
            <div className="space-y-4">
              <div>
                <strong>Title:</strong>
                <p className="mt-1">{about.title}</p>
              </div>
              <div>
                <strong>Description:</strong>
                <p className="mt-1">{about.description}</p>
              </div>
              <div>
                <strong>Mission:</strong>
                <p className="mt-1">{about.mission}</p>
              </div>
              <div>
                <strong>Vision:</strong>
                <p className="mt-1">{about.vision}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No about information found</p>
              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add About Information
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderBranding = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Branding Information</h2>

      {brandingLoading ? (
        <div className="text-center py-8">Loading branding information...</div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Brand Assets</h3>
            {branding && (
              <button
                onClick={() => handleEdit(branding)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiEdit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {branding ? (
            <div className="space-y-4">
              <div>
                <strong>Company Name:</strong>
                <p className="mt-1">{branding.companyName}</p>
              </div>
              <div>
                <strong>Logo URL:</strong>
                <p className="mt-1">{branding.logoUrl}</p>
              </div>
              <div>
                <strong>Favicon URL:</strong>
                <p className="mt-1">{branding.faviconUrl}</p>
              </div>
              <div>
                <strong>Primary Color:</strong>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: branding.brandColors.primary }}
                  />
                  <span>{branding.brandColors.primary}</span>
                </div>
              </div>
              <div>
                <strong>Secondary Color:</strong>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: branding.brandColors.secondary }}
                  />
                  <span>{branding.brandColors.secondary}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No branding information found
              </p>
              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Branding Information
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderVideos = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Management</h2>
          <p className="text-gray-600 mt-1">
            Manage YouTube videos displayed across your application
          </p>
        </div>
        <button
          onClick={handleCreateVideo}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Video
        </button>
      </div>

      {/* Location Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <FiFilter className="w-4 h-4 text-gray-500" />
        <button
          onClick={() => setLocationFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            locationFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Locations ({videos.length})
        </button>
        {Object.entries(VIDEO_LOCATIONS).map(([locationKey, location]) => {
          const count = getVideoCountByLocation(locationKey as VideoLocation)
          return (
            <button
              key={locationKey}
              onClick={() => setLocationFilter(locationKey as VideoLocation)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                locationFilter === locationKey
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {location.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Loading State */}
      {videosLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading videos...</p>
        </div>
      ) : (
        <>
          {/* Videos List */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-4 text-4xl">📹</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {locationFilter === 'all'
                  ? 'No videos found'
                  : `No videos for ${VIDEO_LOCATIONS[locationFilter as VideoLocation]?.label}`}
              </h3>
              <p className="text-gray-600 mb-4">
                {locationFilter === 'all'
                  ? 'Get started by adding your first video'
                  : 'Add videos for this location to get started'}
              </p>
              <button
                onClick={handleCreateVideo}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="w-4 h-4" />
                Add Video
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onEdit={handleEditVideo}
                  onDelete={handleDeleteVideo}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderEditForm = () => {
    if (!editingItem) return null

    const isLoading =
      createSliderMutation.isPending ||
      updateSliderMutation.isPending ||
      createServiceMutation.isPending ||
      updateServiceMutation.isPending ||
      createVideoMutation.isPending ||
      updateVideoMutation.isPending ||
      updateContactMutation.isPending ||
      updateAboutMutation.isPending ||
      updateBrandingMutation.isPending

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {isCreating ? 'Create' : 'Edit'}{' '}
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Render form fields based on active tab */}
              {(activeTab === 'sliders' || activeTab === 'services') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
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
                      Description
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
                      Image URL
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
                      Order
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
                      <span className="text-sm font-medium">Active</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'contact' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone
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
                      Email
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
                      Address
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
                      Working Hours
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
                      Map URL
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
                      Social Media
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
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
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
                      Description
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
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Mission
                    </label>
                    <textarea
                      value={editingItem.mission || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          mission: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Vision
                    </label>
                    <textarea
                      value={editingItem.vision || ''}
                      onChange={e =>
                        setEditingItem({
                          ...editingItem,
                          vision: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {activeTab === 'branding' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Company Name
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
                      Logo Alt Text
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
                      Primary Color
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
                      Secondary Color
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
                      Tagline
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
                Cancel
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
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-700">
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Content Management</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin/settings"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <FiSettings className="h-4 w-4 mr-2" />
                Sistem Ayarları
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-50 rounded-lg p-6">
          {activeTab === 'sliders' && renderSliders()}
          {activeTab === 'services' && renderServices()}
          {activeTab === 'videos' && renderVideos()}
          {activeTab === 'contact' && renderContact()}
          {activeTab === 'about' && renderAbout()}
          {activeTab === 'branding' && renderBranding()}
        </div>
      </div>

      {/* Edit Form Modal */}
      {renderEditForm()}

      {/* Video Form Modal */}
      <VideoForm
        video={editingVideo}
        isOpen={isCreatingVideo || !!editingVideo}
        isCreating={isCreatingVideo}
        onClose={() => {
          setEditingVideo(null)
          setIsCreatingVideo(false)
        }}
        onSave={handleSaveVideo}
        isLoading={false} // Mock loading state
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteConfirm?.type}`}
        message={`Are you sure you want to delete this ${deleteConfirm?.type}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={
          deleteSliderMutation.isPending || deleteServiceMutation.isPending
        }
      />
    </div>
  )
}

export default ContentManagementPage
