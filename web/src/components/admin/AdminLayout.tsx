'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useState } from 'react'
import {
  FiBarChart,
  FiHome,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiUsers,
  FiX,
} from 'react-icons/fi'

interface IAdminLayoutProps {
  children: ReactNode
  title?: string
}

interface INavItem {
  label: string
  href: string
  icon: any
  description?: string
}

export default function AdminLayout({ children, title }: IAdminLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems: INavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: FiHome,
      description: 'Ana kontrol paneli',
    },
    {
      label: 'Kullanıcılar',
      href: '/admin/users',
      icon: FiUsers,
      description: 'Kullanıcı yönetimi',
    },
    {
      label: 'Analitik',
      href: '/admin/analytics',
      icon: FiBarChart,
      description: 'İstatistikler ve raporlar',
    },
    {
      label: 'Ayarlar',
      href: '/admin/settings',
      icon: FiSettings,
      description: 'Sistem ayarları',
    },
  ]

  const isActivePath = (href: string) => {
    if (href === '/admin') {
      return router.pathname === '/admin'
    }
    return router.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">
              Admin Panel
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-500"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map(item => {
            const IconComponent = item.icon
            const isActive = isActivePath(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <IconComponent
                  className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                />
                <div>
                  <div>{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-slate-400">
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-slate-200 p-4">
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <FiLogOut className="h-5 w-5 mr-3" />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"
          >
            <FiMenu className="h-5 w-5" />
          </button>
          {title && (
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          )}
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
