import { Button, buttonClassNames } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useIsDesktop } from '@/hooks/useWindowSize'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'

export default function Navbar() {
  const { appUser, isAdmin, logout } = useAuth()
  const router = useRouter()
  const isDesktop = useIsDesktop(768)

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerType, setRegisterType] = useState<'individual' | 'business'>(
    'individual'
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    setMobileMenuOpen(false)
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
    setMobileMenuOpen(false)
  }

  const handleSwitchToRegister = () => {
    setShowLoginModal(false)
    setShowRegisterModal(true)
  }

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false)
    setShowLoginModal(true)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/services"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Hizmetler
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Hakkımızda
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              İletişim
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {appUser ? (
              <>
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
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Navigation Links */}
              <Link
                href="/services"
                className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1 transition-colors"
                onClick={closeMobileMenu}
              >
                Hizmetler
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1 transition-colors"
                onClick={closeMobileMenu}
              >
                Hakkımızda
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1 transition-colors"
                onClick={closeMobileMenu}
              >
                İletişim
              </Link>

              {/* Mobile Auth Buttons */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                {appUser ? (
                  <>
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        className="block w-full text-center bg-gray-100 text-gray-900 py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
                        onClick={closeMobileMenu}
                      >
                        Yönetici Paneli
                      </Link>
                    ) : (
                      <Link
                        href="/home"
                        className="block w-full text-center bg-gray-100 text-gray-900 py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="block w-full text-center bg-gray-100 text-gray-900 py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
                      onClick={closeMobileMenu}
                    >
                      Profil
                    </Link>
                    <Button onClick={handleLogout} className="w-full">
                      Çıkış Yap
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleLoginClick}
                      className="w-full"
                    >
                      Giriş Yap
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRegisterClick('individual')}
                      className="w-full"
                    >
                      Kayıt Ol
                    </Button>
                    <Button
                      onClick={() => handleRegisterClick('business')}
                      className="w-full"
                    >
                      Bayi Ol
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
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
