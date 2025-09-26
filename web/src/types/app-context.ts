/**
 * AppContext Types - Minimal UI State Only
 * No Firebase operations - those are handled at component level
 */

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

// Minimal App Context Type - UI State Only
export interface IAppContextType {
  // Theme
  theme: AppTheme
  setTheme: (theme: AppTheme) => void

  // Notifications
  notifications: INotification[]
  addNotification: (
    notification: Omit<INotification, 'id' | 'createdAt'>
  ) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}
