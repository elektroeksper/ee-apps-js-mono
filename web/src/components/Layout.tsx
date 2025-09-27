import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'
import Navbar from './Navbar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Define auth pages that should not have the navbar
  const authPages = [
    '/login',
    '/register',
    '/forgot-password',
    '/auth/verify-email',
    '/auth-test',
    '/auth-debug',
    '/quick-auth-check',
    '/action', // Firebase auth action page
  ]

  // Only check auth pages after component is mounted and router is ready
  const isAuthPage =
    isMounted && router.pathname
      ? authPages.some(
          authPage =>
            router.pathname === authPage || router.pathname.startsWith(authPage)
        )
      : false

  return (
    <>
      {/* Only show navbar if it's not an auth page */}
      {!isAuthPage && <Navbar />}

      {/* Page content */}
      <main className={isAuthPage ? '' : ''}>{children}</main>
    </>
  )
}
