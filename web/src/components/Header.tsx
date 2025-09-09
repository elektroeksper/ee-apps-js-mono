import { Button, buttonClassNames } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useIsDesktop } from '@/hooks/useWindowSize'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'

export default function Header() {
  const { appUser, isAdmin, logout } = useAuth()
  const router = useRouter()
  const isDesktop = useIsDesktop(768)

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerType, setRegisterType] = useState<'individual' | 'business'>(
    'individual'
  )

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleLoginClick = () => {
    if (isDesktop) {
      setShowLoginModal(true)
    } else {
      router.push('/login')
    }
  }

  const handleRegisterClick = (
    type: 'individual' | 'business' = 'business'
  ) => {
    if (isDesktop) {
      setRegisterType(type)
      setShowRegisterModal(true)
    } else {
      router.push(`/register?type=${type}`)
    }
  }

  const handleSwitchToRegister = () => {
    setShowLoginModal(false)
    setShowRegisterModal(true)
  }

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false)
    setShowLoginModal(true)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-blue-600">EE</span>
              <span className="ml-2 text-xl font-semibold text-gray-900">
                ElectroExpert
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/services"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Hizmetler
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Hakkımızda
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              İletişim
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {appUser ? (
              <>
                {' '}
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className={buttonClassNames('outline', 'small')}
                  >
                    Yönetici Paneli
                  </Link>
                ) : (
                  <Link
                    href="/home"
                    className={buttonClassNames('outline', 'small')}
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/profile"
                  className={buttonClassNames('outline', 'small')}
                >
                  Profil
                </Link>
                <Button onClick={handleLogout} size="small">
                  Çıkış Yap
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleLoginClick}
                >
                  Giriş Yap
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => handleRegisterClick('individual')}
                >
                  Kayıt Ol
                </Button>
                <Button
                  size="small"
                  onClick={() => handleRegisterClick('business')}
                >
                  Bayi Ol
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
        defaultAccountType={registerType}
      />
    </header>
  )
}
