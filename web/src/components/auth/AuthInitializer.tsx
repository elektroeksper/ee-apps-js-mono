'use client'

/**
 * AuthInitializer Component
 * Initializes the useUser hook for Firebase auth listener
 */

import { useAuth } from '@/contexts/AuthContext'
import { ReactNode } from 'react'

interface AuthInitializerProps {
  children: ReactNode
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  // Touch AuthContext to ensure providers mount; listeners live inside useFirebaseAuth
  useAuth()
  return <>{children}</>
}
