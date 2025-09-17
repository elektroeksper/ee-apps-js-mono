/**
 * AppContext Types
 * Global application state management types
 */

import type {
  IAboutInfo,
  IBrandingInfo,
  IContactInfo,
  IServiceItem,
  ISettingItem,
  ISliderItem,
  IVideoItem,
  VideoLocation
} from '@/shared-generated'
import type { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'

// Data Query Interface for content items
export interface IDataQuery<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<T, Error>>
}

// System Settings Interface with query functionality
export interface ISystemSettings {
  data: ISettingItem[] | undefined
  isLoading: boolean
  isError: boolean
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<ISettingItem[] | undefined, Error>>
  updateSetting: (key: string, value: any) => Promise<void>
}

// Content Data Interface
export interface ContentData {
  sliders: IDataQuery<ISliderItem[]>
  services: IDataQuery<IServiceItem[]>
  videos: IDataQuery<IVideoItem[]>
  contact: IDataQuery<IContactInfo | undefined>
  about: IDataQuery<IAboutInfo | undefined>
  branding: IDataQuery<IBrandingInfo | undefined>
}

// Notification Interface
export interface INotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  actions?: INotificationAction[]
  autoClose?: boolean
  duration?: number
  createdAt: Date
}

export interface INotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

// App Theme Settings
export type AppTheme = 'light' | 'dark' | 'system'
export type SupportedLanguage = 'tr' | 'en'

// App Context Type
export interface IAppContextType {
  // Theme
  theme: AppTheme
  setTheme: (theme: AppTheme) => void

  // Settings
  settings: ISystemSettings

  // Notifications
  notifications: INotification[]
  addNotification: (notification: Omit<INotification, 'id' | 'createdAt'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void

  // Content
  content: ContentData
  getVideosByLocation: (location: VideoLocation) => IVideoItem[]
  refreshContent: () => Promise<void>

  // Loading
  isLoading: boolean
}