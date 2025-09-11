/**
 * YouTube Video Utilities
 * Helpers for working with YouTube videos in the admin panel
 */

export interface YouTubeVideoMetadata {
  title: string
  author_name: string
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
  html: string
}

/**
 * Extract video ID from various YouTube URL formats
 */
export const extractYouTubeVideoId = (input: string): string => {
  if (!input) return ''

  const urlPatterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    // youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([^&\n?#]+)/,
    // youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    // youtube.com/v/VIDEO_ID
    /(?:youtube\.com\/v\/)([^&\n?#]+)/,
    // Direct video ID (11 characters)
    /^([a-zA-Z0-9_-]{11})$/
  ]

  for (const pattern of urlPatterns) {
    const match = input.trim().match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  // If no pattern matches, return the input cleaned up
  return input.trim().replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 11)
}

/**
 * Validate if a string is a valid YouTube video ID
 */
export const isValidYouTubeVideoId = (videoId: string): boolean => {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
}

/**
 * Get YouTube video thumbnail URL
 */
export const getYouTubeThumbnailUrl = (videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string => {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault'
  }

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

/**
 * Fetch video metadata from YouTube oEmbed API
 */
export const fetchYouTubeMetadata = async (videoId: string): Promise<YouTubeVideoMetadata | null> => {
  if (!isValidYouTubeVideoId(videoId)) {
    throw new Error('Invalid YouTube video ID')
  }

  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`

    const response = await fetch(oEmbedUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: YouTubeVideoMetadata = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error)
    throw error
  }
}

/**
 * Generate YouTube embed URL with options
 */
export const getYouTubeEmbedUrl = (videoId: string, options: {
  autoplay?: boolean
  loop?: boolean
  controls?: boolean
  modestbranding?: boolean
  rel?: boolean
  start?: number
  end?: number
} = {}): string => {
  const params = new URLSearchParams()

  if (options.autoplay) params.set('autoplay', '1')
  if (options.loop) {
    params.set('loop', '1')
    params.set('playlist', videoId) // Required for loop to work
  }
  if (options.controls === false) params.set('controls', '0')
  if (options.modestbranding) params.set('modestbranding', '1')
  if (options.rel === false) params.set('rel', '0')
  if (options.start) params.set('start', options.start.toString())
  if (options.end) params.set('end', options.end.toString())

  const queryString = params.toString()
  return `https://www.youtube.com/embed/${videoId}${queryString ? '?' + queryString : ''}`
}

/**
 * Get YouTube watch URL
 */
export const getYouTubeWatchUrl = (videoId: string, startTime?: number): string => {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  return startTime ? `${url}&t=${startTime}s` : url
}

/**
 * Check if video exists and is accessible
 */
export const checkYouTubeVideoExists = async (videoId: string): Promise<boolean> => {
  try {
    await fetchYouTubeMetadata(videoId)
    return true
  } catch (error) {
    return false
  }
}
