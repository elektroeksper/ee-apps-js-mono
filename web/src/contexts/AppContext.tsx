'use client'

/**
 * AppContext - Global Application State Management
 * Handles settings, theme, notifications (NO Firebase operations)
 * Firebase operations moved to component level for build safety
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppTheme, IAppContextType, INotification } from '../types/app-context'

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

  // Context value (no Firebase operations)
  const contextValue: IAppContextType = useMemo(
    () => ({
      // Theme
      theme,
      setTheme,

      // Notifications
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications,
    }),
    [
      theme,
      setTheme,
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications,
    ]
  )

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  )
}

export default AppProvider
