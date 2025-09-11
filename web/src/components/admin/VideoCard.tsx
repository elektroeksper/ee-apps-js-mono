'use client'

import { FiEdit, FiPlay, FiTrash2 } from 'react-icons/fi'
import { IVideoItem } from './VideoForm'

interface VideoCardProps {
  video: IVideoItem
  onEdit: (video: IVideoItem) => void
  onDelete: (video: IVideoItem) => void
}

const VIDEO_LOCATIONS = {
  'individual-setup': {
    label: 'Individual Setup',
    color: 'bg-blue-100 text-blue-700',
  },
  'business-setup': {
    label: 'Business Setup',
    color: 'bg-purple-100 text-purple-700',
  },
  'app-index': { label: 'App Index', color: 'bg-green-100 text-green-700' },
  'individual-home': {
    label: 'Individual Home',
    color: 'bg-cyan-100 text-cyan-700',
  },
  'business-home': {
    label: 'Business Home',
    color: 'bg-orange-100 text-orange-700',
  },
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onEdit,
  onDelete,
}) => {
  const locationInfo = VIDEO_LOCATIONS[video.location] || {
    label: video.location,
    color: 'bg-gray-100 text-gray-700',
  }

  const thumbnailUrl =
    video.thumbnailUrl ||
    `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`

  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        {/* Video Thumbnail */}
        <div className="relative w-40 h-24 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={video.title || 'Video thumbnail'}
            className="w-full h-full object-cover"
            onError={e => {
              // Fallback to default YouTube thumbnail if custom fails
              const target = e.target as HTMLImageElement
              target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`
            }}
          />

          {/* Video ID overlay */}
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
            {video.youtubeVideoId}
          </div>
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {video.title || 'Untitled Video'}
              </h3>

              {video.description && (
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {video.description}
                </p>
              )}

              {/* Video Settings */}
              <div className="flex items-center gap-3 mt-3 text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${locationInfo.color}`}
                >
                  {locationInfo.label}
                </span>

                <span className="text-gray-500">Order: {video.order}</span>

                {video.autoStart && (
                  <span className="flex items-center gap-1 text-green-600">
                    <FiPlay className="w-3 h-3" />
                    Auto Start
                  </span>
                )}

                {video.loop && (
                  <span className="flex items-center gap-1 text-blue-600">
                    🔄 Loop
                  </span>
                )}

                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    video.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {video.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(video)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit video"
              >
                <FiEdit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(video)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete video"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Preview Link */}
      <div className="border-t px-4 py-2 bg-gray-50">
        <a
          href={`https://youtube.com/watch?v=${video.youtubeVideoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <FiPlay className="w-3 h-3" />
          Watch on YouTube
        </a>
      </div>
    </div>
  )
}
