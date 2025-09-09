/**
 * Unauthorized Access Page
 * Shown when users try to access pages they don't have permission for
 */

'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { FiArrowLeft, FiHome, FiShield } from 'react-icons/fi'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <FiShield className="w-8 h-8 text-red-600" />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">
              Erişim Engellendi
            </h1>
            <p className="text-slate-600">
              Bu sayfaya erişim yetkiniz bulunmamaktadır. Lütfen yönetici ile
              iletişime geçin.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-4">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FiHome className="w-4 h-4 mr-2" />
              Ana Sayfaya Dön
            </Link>

            <button
              onClick={() => router.back()}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">
              Bu sayfaya erişim için yönetici yetkisi gereklidir. Eğer yönetici
              olduğunuzu düşünüyorsanız, lütfen çıkış yapıp tekrar giriş yapmayı
              deneyin.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
