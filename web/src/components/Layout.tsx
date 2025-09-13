import { useRouter } from 'next/router'
import { ReactNode } from 'react'
import Navbar from './Navbar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()

  // Define auth pages that should not have the navbar
  const authPages = [
    '/login',
    '/register',
    '/forgot-password',
    '/verify-email',
    '/auth-test',
    '/auth-debug',
    '/quick-auth-check',
    '/action', // Firebase auth action page
  ]

  // Check if current route is an auth page
  const isAuthPage = authPages.some(
    authPage =>
      router.pathname === authPage || router.pathname.startsWith(authPage)
  )

  return (
    <>
      {/* Only show navbar if it's not an auth page */}
      {!isAuthPage && <Navbar />}

      {/* Page content */}
      <main className={isAuthPage ? '' : ''}>{children}</main>
    </>
  )
}
