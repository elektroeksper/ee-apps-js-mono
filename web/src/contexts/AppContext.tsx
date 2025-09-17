'use client'

/**
 * AppContext - Global Application State Management
 * Handles settings, theme, notifications, and content
 */

import type { VideoLocation } from '@/shared-generated'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useAbout,
  useBranding,
  useContact,
  useServices,
  useSliders,
  useVideos,
} from '../hooks/useContentQueries'
import useSystemSettings from '../hooks/useSystemSettings'
import {
  AppTheme,
  ContentData,
  IAppContextType,
  INotification,
  ISystemSettings,
} from '../types/app-context'

// Context Definition
const AppContext = createContext<IAppContextType | undefined>(undefined)

/**
 * Hook to access AppContext
 * Throws error if used outside AppProvider
 */
export const useAppContext = (): IAppContextType => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

/**
 * AppProvider - Manages global application state
 * Provides settings, theme, notifications, and content management
 */
interface AppProviderProps {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  // Hooks for content data
  const slidersQuery = useSliders()
  const servicesQuery = useServices()
  const videosQuery = useVideos()
  const contactQuery = useContact()
  const aboutQuery = useAbout()
  const brandingQuery = useBranding()

  // System settings
  const {
    settings: systemSettings,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useSystemSettings()

  // Theme state with localStorage persistence
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-theme')
      return (saved as AppTheme) || 'light'
    }
    return 'light'
  })

  // Notifications state
  const [notifications, setNotifications] = useState<INotification[]>([])

  // Loading states
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  // Theme management
  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-theme', newTheme)
      // Apply theme class to document
      document.documentElement.className = newTheme
    }
  }, [])

  // Apply theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.className = theme
    }
  }, [theme])

  // Settings management
  const systemSettingsData: ISystemSettings = useMemo(
    () => ({
      data: systemSettings,
      isLoading: settingsLoading,
      isError: settingsError,
      refetch: refetchSettings,
      updateSetting: async (key: string, value: any) => {
        // TODO: Implement setting update logic
        console.log('Update setting:', key, value)
      },
    }),
    [systemSettings, settingsLoading, settingsError, refetchSettings]
  )

  // Notification management
  const addNotification = useCallback(
    (notification: Omit<INotification, 'id' | 'createdAt'>) => {
      const newNotification: INotification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date(),
      }
      setNotifications(prev => [newNotification, ...prev.slice(0, 99)]) // Keep max 100
    },
    []
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Content data aggregation
  const contentData: ContentData = useMemo(
    () => ({
      sliders: {
        data: slidersQuery.data,
        isLoading: slidersQuery.isLoading,
        isError: slidersQuery.isError,
        refetch: slidersQuery.refetch,
      },
      services: {
        data: servicesQuery.data,
        isLoading: servicesQuery.isLoading,
        isError: servicesQuery.isError,
        refetch: servicesQuery.refetch,
      },
      videos: {
        data: videosQuery.data,
        isLoading: videosQuery.isLoading,
        isError: videosQuery.isError,
        refetch: videosQuery.refetch,
      },
      contact: {
        data: contactQuery.data,
        isLoading: contactQuery.isLoading,
        isError: contactQuery.isError,
        refetch: contactQuery.refetch,
      },
      about: {
        data: aboutQuery.data,
        isLoading: aboutQuery.isLoading,
        isError: aboutQuery.isError,
        refetch: aboutQuery.refetch,
      },
      branding: {
        data: brandingQuery.data,
        isLoading: brandingQuery.isLoading,
        isError: brandingQuery.isError,
        refetch: brandingQuery.refetch,
      },
    }),
    [
      slidersQuery,
      servicesQuery,
      videosQuery,
      contactQuery,
      aboutQuery,
      brandingQuery,
    ]
  )

  // Video management functions
  const getVideosByLocation = useCallback(
    (location: VideoLocation) => {
      return (
        contentData.videos.data?.filter(video => video.location === location) ||
        []
      )
    },
    [contentData.videos.data]
  )

  const refreshContent = useCallback(async () => {
    setIsLoadingContent(true)
    try {
      await Promise.all([
        slidersQuery.refetch(),
        servicesQuery.refetch(),
        videosQuery.refetch(),
        contactQuery.refetch(),
        aboutQuery.refetch(),
        brandingQuery.refetch(),
      ])
    } catch (error) {
      console.error('Error refreshing content:', error)
      addNotification({
        type: 'error',
        title: 'Content Refresh Failed',
        message: 'Failed to refresh content data',
      })
    } finally {
      setIsLoadingContent(false)
    }
  }, [
    slidersQuery,
    servicesQuery,
    videosQuery,
    contactQuery,
    aboutQuery,
    brandingQuery,
    addNotification,
  ])

  // Global loading state
  const isLoading = useMemo(() => {
    return (
      isLoadingContent ||
      contentData.sliders.isLoading ||
      contentData.services.isLoading ||
      contentData.videos.isLoading ||
      contentData.contact.isLoading ||
      contentData.about.isLoading ||
      contentData.branding.isLoading ||
      systemSettingsData.isLoading
    )
  }, [isLoadingContent, contentData, systemSettingsData])

  // Context value
  const contextValue: IAppContextType = useMemo(
    () => ({
      // Theme
      theme,
      setTheme,

      // Settings
      settings: systemSettingsData,

      // Notifications
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications,

      // Content
      content: contentData,
      getVideosByLocation,
      refreshContent,

      // Loading
      isLoading,
    }),
    [
      theme,
      setTheme,
      systemSettingsData,
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications,
      contentData,
      getVideosByLocation,
      refreshContent,
      isLoading,
    ]
  )

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  )
}

export default AppProvider
