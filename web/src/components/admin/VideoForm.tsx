'use client'

import { extractYouTubeVideoId } from '@/utils/youtube'
import { useEffect, useState } from 'react'
import { FiSave, FiX } from 'react-icons/fi'
import { VideoPreview } from './VideoPreview'

export type VideoLocation =
  | 'individual-setup'
  | 'business-setup'
  | 'app-index'
  | 'individual-home'
  | 'business-home'

export interface IVideoItem {
  id?: string
  title?: string // Auto-fetched from YouTube
  description?: string // Auto-fetched from YouTube
  youtubeVideoId: string // Just the video ID, not full URL
  location: VideoLocation
  autoStart: boolean
  loop: boolean
  order: number
  isActive: boolean
  thumbnailUrl?: string // Auto-generated from YouTube
  duration?: number // In seconds, auto-fetched
  createdAt?: Date
  updatedAt?: Date
}

interface VideoFormProps {
  video?: IVideoItem | null
  isOpen: boolean
  isCreating: boolean
  onClose: () => void
  onSave: (video: Partial<IVideoItem>) => void
  isLoading?: boolean
}

const VIDEO_LOCATIONS = {
  'individual-setup': {
    label: 'Individual Setup',
    description: 'Setup tutorial videos for individual users',
  },
  'business-setup': {
    label: 'Business Setup',
    description: 'Setup tutorial videos for business users',
  },
  'app-index': {
    label: 'App Index',
    description: 'Welcome/promotional videos on main page',
  },
  'individual-home': {
    label: 'Individual Home',
    description: 'Tutorial videos for individual dashboard',
  },
  'business-home': {
    label: 'Business Home',
    description: 'Tutorial videos for business dashboard',
  },
}

export const VideoForm: React.FC<VideoFormProps> = ({
  video,
  isOpen,
  isCreating,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<IVideoItem>>({
    youtubeVideoId: '',
    location: 'app-index',
    autoStart: false,
    loop: false,
    order: 0,
    isActive: true,
  })

  const [videoMetadata, setVideoMetadata] = useState<{
    title: string
    thumbnailUrl: string
    duration: number
  } | null>(null)

  useEffect(() => {
    if (video) {
      setFormData(video)
    } else if (isCreating) {
      setFormData({
        youtubeVideoId: '',
        location: 'app-index',
        autoStart: false,
        loop: false,
        order: 0,
        isActive: true,
      })
    }
  }, [video, isCreating])

  const extractVideoId = (input: string): string => {
    return extractYouTubeVideoId(input)
  }

  const handleVideoIdChange = (input: string) => {
    const videoId = extractVideoId(input.trim())
    setFormData(prev => ({ ...prev, youtubeVideoId: videoId }))
  }

  const handleMetadataLoad = (metadata: {
    title: string
    thumbnailUrl: string
    duration: number
  }) => {
    setVideoMetadata(metadata)
    setFormData(prev => ({
      ...prev,
      title: metadata.title,
      thumbnailUrl: metadata.thumbnailUrl,
      duration: metadata.duration,
    }))
  }

  const handleSave = () => {
    const saveData = {
      ...formData,
      ...videoMetadata, // Include auto-fetched metadata
    }
    onSave(saveData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {isCreating ? 'Add New Video' : 'Edit Video'}
            </h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  YouTube Video URL or ID
                </label>
                <input
                  type="text"
                  value={formData.youtubeVideoId || ''}
                  onChange={e => handleVideoIdChange(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or video ID"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste a YouTube URL or just the video ID (e.g., dQw4w9WgXcQ)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Location
                </label>
                <select
                  value={formData.location || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      location: e.target.value as VideoLocation,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(VIDEO_LOCATIONS).map(([key, location]) => (
                    <option key={key} value={key}>
                      {location.label}
                    </option>
                  ))}
                </select>
                {formData.location && (
                  <p className="text-xs text-gray-500 mt-1">
                    {VIDEO_LOCATIONS[formData.location]?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order || 0}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.autoStart || false}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          autoStart: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium">
                      Auto Start Video
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Video will start playing automatically when loaded
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.loop || false}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          loop: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Loop Video</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Video will restart automatically when it ends
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive || false}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    Only active videos will be displayed
                  </p>
                </div>
              </div>
            </div>

            {/* Video Preview */}
            <div>
              <label className="block text-sm font-medium mb-2">Preview</label>
              <VideoPreview
                videoId={formData.youtubeVideoId || ''}
                autoStart={formData.autoStart}
                loop={formData.loop}
                onMetadataLoad={handleMetadataLoad}
              />

              {videoMetadata && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Video loaded successfully
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Title and thumbnail will be saved automatically
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !formData.youtubeVideoId}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave className="w-4 h-4" />
              )}
              {isLoading ? 'Saving...' : 'Save Video'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
