import type { IVideoItem } from '@/shared-generated/types/content-types'

/**
 * Type guard function to ensure video has required properties
 */
export const isValidVideo = (video: any): video is IVideoItem => {
  return video &&
    typeof video.youtubeVideoId === 'string' &&
    video.youtubeVideoId.length > 0 &&
    typeof video.isActive === 'boolean'
}

/**
 * Safely access video properties with proper type checking
 */
export const safeVideoAccess = (video: any) => {
  if (!isValidVideo(video)) {
    return null
  }
  return video as IVideoItem
}

/**
 * Generate YouTube embed URL safely
 */
export const generateYouTubeEmbedUrl = (video: any): string | null => {
  const safeVideo = safeVideoAccess(video)
  if (!safeVideo) {
    return null
  }

  const autoplayParam = safeVideo.autoStart ? '?autoplay=1' : ''
  const loopParam = safeVideo.loop ?
    (autoplayParam ? '&loop=1&playlist=' : '?loop=1&playlist=') + safeVideo.youtubeVideoId :
    ''

  return `https://www.youtube.com/embed/${safeVideo.youtubeVideoId}${autoplayParam}${loopParam}`
}

/**
 * Get video title safely
 */
export const getVideoTitle = (video: any): string => {
  const safeVideo = safeVideoAccess(video)
  return safeVideo?.title || 'Yardım Videosu'
}