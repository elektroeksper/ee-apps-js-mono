// Example integration into existing content management
// This shows how to add video management to your existing content.tsx page

import { VideoCard } from '@/components/admin/VideoCard'
import {
  IVideoItem,
  VideoForm,
  VideoLocation,
} from '@/components/admin/VideoForm'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'
import { useState } from 'react'
import { FiFilter, FiPlus } from 'react-icons/fi'

// Add 'videos' to your existing TabType
type TabType =
  | 'sliders'
  | 'services'
  | 'contact'
  | 'about'
  | 'branding'
  | 'videos'

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

// Mock data - replace with actual hooks
const mockVideos: IVideoItem[] = [
  {
    id: '1',
    title: 'Welcome to ElectroExpert',
    youtubeVideoId: 'dQw4w9WgXcQ',
    location: 'app-index',
    autoStart: false,
    loop: false,
    order: 1,
    isActive: true,
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
  },
]

// Add this to your existing content management component
const renderVideos = () => {
  const [videos] = useState<IVideoItem[]>(mockVideos) // Replace with actual hook
  const [locationFilter, setLocationFilter] = useState<VideoLocation | 'all'>(
    'all'
  )
  const [editingVideo, setEditingVideo] = useState<IVideoItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    video: IVideoItem
  } | null>(null)

  const filteredVideos =
    locationFilter === 'all'
      ? videos
      : videos.filter(video => video.location === locationFilter)

  const getVideoCountByLocation = (location: VideoLocation) => {
    return videos.filter(video => video.location === location).length
  }

  const handleEdit = (video: IVideoItem) => {
    setEditingVideo(video)
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingVideo(null)
    setIsCreating(true)
  }

  const handleSave = async (videoData: Partial<IVideoItem>) => {
    try {
      if (isCreating) {
        // await createVideoMutation.mutateAsync(videoData)
        console.log('Creating video:', videoData)
      } else if (editingVideo?.id) {
        // await updateVideoMutation.mutateAsync({ id: editingVideo.id, data: videoData })
        console.log('Updating video:', { id: editingVideo.id, data: videoData })
      }
      setEditingVideo(null)
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to save video:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm?.video.id) return

    try {
      // await deleteVideoMutation.mutateAsync(deleteConfirm.video.id)
      console.log('Deleting video:', deleteConfirm.video.id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete video:', error)
    }
  }

  return (
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
          onClick={handleCreate}
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

      {/* Videos List */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">📹</div>
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
            onClick={handleCreate}
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
              onEdit={handleEdit}
              onDelete={video => setDeleteConfirm({ video })}
            />
          ))}
        </div>
      )}

      {/* Video Form Modal */}
      <VideoForm
        video={editingVideo}
        isOpen={isCreating || !!editingVideo}
        isCreating={isCreating}
        onClose={() => {
          setEditingVideo(null)
          setIsCreating(false)
        }}
        onSave={handleSave}
        isLoading={false} // Replace with actual loading state
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Video"
        message={`Are you sure you want to delete "${deleteConfirm?.video.title || 'this video'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={false} // Replace with actual loading state
      />
    </div>
  )
}

// Add to your existing tabs array in content.tsx:
/*
const tabs = [
  { id: 'sliders' as TabType, label: 'Sliders', count: sliders.length },
  { id: 'services' as TabType, label: 'Services', count: services.length },
  { id: 'videos' as TabType, label: 'Videos', count: videos.length }, // New tab
  { id: 'contact' as TabType, label: 'Contact' },
  { id: 'about' as TabType, label: 'About Us' },
  { id: 'branding' as TabType, label: 'Branding' },
]
*/

// Add to your tab content rendering:
// {activeTab === 'videos' && renderVideos()}

export default renderVideos
