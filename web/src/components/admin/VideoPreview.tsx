'use client'

import {
  fetchYouTubeMetadata,
  getYouTubeEmbedUrl,
  isValidYouTubeVideoId,
  YouTubeVideoMetadata,
} from '@/utils/youtube'
import { useEffect, useState } from 'react'
import { FiLoader, FiPlay } from 'react-icons/fi'

interface VideoPreviewProps {
  videoId: string
  autoStart?: boolean
  loop?: boolean
  onMetadataLoad?: (metadata: {
    title: string
    thumbnailUrl: string
    duration: number
  }) => void
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoId,
  autoStart = false,
  loop = false,
  onMetadataLoad,
}) => {
  const [metadata, setMetadata] = useState<YouTubeVideoMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)

  useEffect(() => {
    if (!videoId) {
      setLoading(false)
      return
    }

    fetchVideoMetadata()
  }, [videoId])

  const fetchVideoMetadata = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isValidYouTubeVideoId(videoId)) {
        throw new Error('Invalid video ID format')
      }

      const data = await fetchYouTubeMetadata(videoId)
      setMetadata(data)

      // Notify parent component about metadata
      if (onMetadataLoad && data) {
        onMetadataLoad({
          title: data.title,
          thumbnailUrl: data.thumbnail_url,
          duration: 0, // oEmbed doesn't provide duration
        })
      }
    } catch (error) {
      console.error('Failed to fetch video metadata:', error)
      setError(error instanceof Error ? error.message : 'Failed to load video')
      setMetadata(null)
    } finally {
      setLoading(false)
    }
  }

  if (!videoId) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-500">Enter a YouTube video ID to see preview</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <FiLoader className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">Loading video preview...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
        <p className="text-red-500 text-xs mt-1">
          Please check the video ID and make sure the video is public
        </p>
      </div>
    )
  }

  if (!metadata) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600 text-sm">Unable to load video metadata</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Video Preview */}
      <div className="relative aspect-video bg-black">
        {showPlayer ? (
          <iframe
            src={getYouTubeEmbedUrl(videoId, {
              autoplay: autoStart,
              loop: loop,
              controls: true,
              modestbranding: true,
              rel: false,
            })}
            title={metadata.title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            className="relative w-full h-full group cursor-pointer"
            onClick={() => setShowPlayer(true)}
          >
            <img
              src={metadata.thumbnail_url}
              alt={metadata.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-colors">
              <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform">
                <FiPlay className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {metadata.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{metadata.author_name}</p>

        {/* Video Settings Preview */}
        <div className="flex gap-4 mt-3 text-xs">
          <span
            className={`px-2 py-1 rounded ${autoStart ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Auto Start: {autoStart ? 'Yes' : 'No'}
          </span>
          <span
            className={`px-2 py-1 rounded ${loop ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Loop: {loop ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  )
}
